/**
 * Subscription Enforcement Utilities - Task 10.5
 * Checks subscription status and enforces access control
 */

import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import type { Database } from './supabase'

export interface SubscriptionCheck {
  hasAccess: boolean
  reason?: 'trial_expired' | 'subscription_inactive' | 'subscription_cancelled' | 'subscription_past_due' | 'no_subscription'
  subscription: {
    plan: string
    status: string | null
    trial_ends_at: string | null
    current_period_end: string | null
  } | null
}

/**
 * Check if user has valid subscription access
 */
export async function checkSubscriptionAccess(
  request: NextRequest,
  userId: string
): Promise<SubscriptionCheck> {
  try {
    // Get env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ SUBSCRIPTION: Supabase env vars missing')
      return {
        hasAccess: false,
        reason: 'no_subscription',
        subscription: null
      }
    }

    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // No need to set cookies here, middleware handles it
          },
        },
      }
    )

    // Fetch developer subscription info
    const { data: developer, error } = await supabase
      .from('developers')
      .select('subscription_plan, subscription_status, trial_ends_at, current_period_end')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !developer) {
      console.error('❌ SUBSCRIPTION: Failed to fetch developer:', error)
      return {
        hasAccess: false,
        reason: 'no_subscription',
        subscription: null
      }
    }

    const now = new Date()
    const subscription = {
      plan: developer.subscription_plan || 'trial',
      status: developer.subscription_status,
      trial_ends_at: developer.trial_ends_at,
      current_period_end: developer.current_period_end
    }

    // Check subscription status
    switch (developer.subscription_status) {
      case 'active':
        // Active subscription - check if period hasn't ended
        if (developer.current_period_end) {
          const periodEnd = new Date(developer.current_period_end)
          if (now > periodEnd) {
            return {
              hasAccess: false,
              reason: 'subscription_inactive',
              subscription
            }
          }
        }
        return { hasAccess: true, subscription }

      case 'trialing':
        // Trial subscription - check if trial hasn't expired
        if (developer.trial_ends_at) {
          const trialEnd = new Date(developer.trial_ends_at)
          if (now > trialEnd) {
            return {
              hasAccess: false,
              reason: 'trial_expired',
              subscription
            }
          }
        }
        return { hasAccess: true, subscription }

      case 'past_due':
        // Allow limited access for past_due to let them update payment
        return {
          hasAccess: true, // Allow access but with warning in UI
          subscription
        }

      case 'cancelled':
      case 'expired':
      case 'inactive':
        return {
          hasAccess: false,
          reason: 'subscription_cancelled',
          subscription
        }

      default:
        // No valid status
        return {
          hasAccess: false,
          reason: 'no_subscription',
          subscription
        }
    }
  } catch (error) {
    console.error('❌ SUBSCRIPTION: Error checking access:', error)
    return {
      hasAccess: false,
      reason: 'no_subscription',
      subscription: null
    }
  }
}

/**
 * Get user-friendly error message for subscription issue
 */
export function getSubscriptionErrorMessage(reason: SubscriptionCheck['reason']): string {
  switch (reason) {
    case 'trial_expired':
      return 'Twój okres próbny wygasł. Aktywuj plan Basic, aby kontynuować.'
    case 'subscription_inactive':
      return 'Twoja subskrypcja wygasła. Odnów plan, aby kontynuować.'
    case 'subscription_cancelled':
      return 'Twoja subskrypcja została anulowana. Aktywuj nowy plan, aby kontynuować.'
    case 'subscription_past_due':
      return 'Twoja płatność nie powiodła się. Zaktualizuj metodę płatności.'
    case 'no_subscription':
      return 'Brak aktywnej subskrypcji. Wybierz plan, aby kontynuować.'
    default:
      return 'Wystąpił problem z subskrypcją. Skontaktuj się z pomocą techniczną.'
  }
}
