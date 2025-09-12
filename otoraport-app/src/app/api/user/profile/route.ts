import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { sensitiveAPIRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Rate limiting for sensitive profile data access
    const rateLimitResult = await sensitiveAPIRateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Zbyt wiele zapytań. Spróbuj ponownie później.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      )
    }

    const session: any = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use session user ID directly (from NextAuth token)
    const userId = session.user.id

    if (!userId) {
      return NextResponse.json({
        profile_completed: false,
        reason: 'invalid_session',
        message: 'Błąd sesji użytkownika'
      })
    }

    // Get developer profile using bridge table
    const { data: bridgeData, error: bridgeError } = await supabase
      .rpc('get_developer_by_nextauth_user', { user_id: userId })
      .single()

    if (bridgeError || !bridgeData) {
      console.log('No developer profile found for user:', userId, 'Error:', bridgeError)
      
      // Check if user exists in NextAuth users table
      const { data: authUser } = await supabase
        .from('users')
        .select('id, email, name, image')
        .eq('id', userId)
        .single()

      return NextResponse.json({
        profile_completed: false,
        reason: 'incomplete_profile',
        message: 'Użytkownik musi ukończyć profil dewelopera',
        oauth_user: authUser ? {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          image: authUser.image
        } : null
      })
    }

    // Build user object from bridge data
    const user = {
      id: userId,
      developer_id: bridgeData.developer_id,
      email: bridgeData.email,
      name: bridgeData.name,
      company_name: bridgeData.company_name,
      nip: bridgeData.nip,
      plan: bridgeData.subscription_plan,
      subscription_status: bridgeData.subscription_status,
      trial_ends_at: null, // Will calculate from created_at + 14 days if trial
      onboarding_completed: bridgeData.registration_completed,
      profile_image_url: bridgeData.profile_image_url
    }

    // Calculate trial end date (14 days from developer profile creation)
    if (user.subscription_status === 'trial') {
      const { data: devData } = await supabase
        .from('developers')
        .select('created_at')
        .eq('id', user.developer_id)
        .single()
      
      if (devData?.created_at) {
        const createdAt = new Date(devData.created_at)
        user.trial_ends_at = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000)
      }
    }

    // Check if user has completed onboarding
    if (!user.onboarding_completed || !user.company_name || !user.nip) {
      return NextResponse.json({
        profile_completed: false,
        reason: 'incomplete_profile',
        message: 'Profil niekompletny - wymagane dane firmy',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      })
    }

    // Check subscription status
    const now = new Date()
    const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null
    const isTrialActive = trialEndsAt && now < trialEndsAt
    const hasActiveSubscription = user.subscription_status === 'active'

    if (!isTrialActive && !hasActiveSubscription) {
      return NextResponse.json({
        profile_completed: true,
        subscription_required: true,
        reason: 'subscription_expired',
        message: 'Subskrypcja wygasła - wymagana płatność',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          company_name: user.company_name,
          plan: user.plan,
          subscription_status: user.subscription_status,
          trial_ended: true
        }
      })
    }

    // SECURITY FIX: Return only essential data, no sensitive business info
    return NextResponse.json({
      profile_completed: true,
      subscription_required: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        // REMOVED: nip, phone, company_name (sensitive business data)
        plan: user.plan,
        subscription_status: user.subscription_status,
        is_trial_active: isTrialActive,
        has_active_subscription: hasActiveSubscription,
        trial_days_remaining: isTrialActive ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
      }
    })

  } catch (error) {
    console.error('Error checking user profile:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        profile_completed: false,
        reason: 'server_error'
      },
      { status: 500 }
    )
  }
}