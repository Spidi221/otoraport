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

    // Check if user exists in our database with complete profile
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        company_name,
        nip,
        phone,
        plan,
        subscription_status,
        trial_ends_at,
        created_at,
        onboarding_completed
      `)
      .eq('email', session.user.email)
      .single()

    if (error) {
      // User doesn't exist in database - needs to complete registration
      return NextResponse.json({
        profile_completed: false,
        reason: 'user_not_found',
        message: 'Użytkownik musi ukończyć proces rejestracji'
      })
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