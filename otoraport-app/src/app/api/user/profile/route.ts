import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase'
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

    const auth = await getAuthenticatedDeveloper(request)

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const developer = auth.developer
    const user = auth.user

    // Build user object from developer data
    const userProfile = {
      id: developer.id,
      developer_id: developer.id,
      email: developer.email,
      name: developer.name,
      company_name: developer.company_name,
      nip: developer.nip,
      plan: developer.subscription_plan,
      subscription_status: developer.subscription_status,
      trial_ends_at: null, // Will calculate from created_at + 14 days if trial
      onboarding_completed: developer.registration_completed,
      profile_image_url: null // Can be added later if needed
    }

    // Calculate trial end date (14 days from developer profile creation)
    if (userProfile.subscription_status === 'trial') {
      if (developer.created_at) {
        const createdAt = new Date(developer.created_at)
        userProfile.trial_ends_at = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000)
      }
    }

    // Check if user has completed onboarding
    if (!userProfile.onboarding_completed || !userProfile.company_name || !userProfile.nip) {
      return NextResponse.json({
        profile_completed: false,
        reason: 'incomplete_profile',
        message: 'Profil niekompletny - wymagane dane firmy',
        user: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name
        }
      })
    }

    // Check subscription status
    const now = new Date()
    const trialEndsAt = userProfile.trial_ends_at ? new Date(userProfile.trial_ends_at) : null
    const isTrialActive = trialEndsAt && now < trialEndsAt
    const hasActiveSubscription = userProfile.subscription_status === 'active'

    if (!isTrialActive && !hasActiveSubscription) {
      return NextResponse.json({
        profile_completed: true,
        subscription_required: true,
        reason: 'subscription_expired',
        message: 'Subskrypcja wygasła - wymagana płatność',
        user: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          company_name: userProfile.company_name,
          plan: userProfile.plan,
          subscription_status: userProfile.subscription_status,
          trial_ended: true
        }
      })
    }

    // SECURITY FIX: Return only essential data, no sensitive business info
    return NextResponse.json({
      profile_completed: true,
      subscription_required: false,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        // REMOVED: nip, phone, company_name (sensitive business data)
        plan: userProfile.plan,
        subscription_status: userProfile.subscription_status,
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