/**
 * Analytics Events Utility - PostHog Event Tracking
 *
 * Provides typed event tracking functions for key user actions.
 * All tracking respects user consent and only fires if PostHog is initialized.
 *
 * Events tracked:
 * - User signup
 * - User login
 * - File upload
 * - Subscription start (trial)
 * - Trial start
 * - Payment success
 */

import posthog from 'posthog-js'

/**
 * Check if PostHog is initialized and user has consented
 */
function canTrack(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Check if PostHog is initialized
  if (!posthog.__loaded) {
    console.log('[Analytics] PostHog not initialized')
    return false
  }

  // Check if user has opted out
  if (posthog.has_opted_out_capturing()) {
    console.log('[Analytics] User has opted out of tracking')
    return false
  }

  return true
}

/**
 * Track user signup event
 *
 * @param userId - Unique user identifier from Supabase
 * @param plan - Selected subscription plan (trial, basic, pro)
 */
export function trackSignup(userId: string, plan: string = 'trial'): void {
  if (!canTrack()) return

  try {
    posthog.capture('user_signup', {
      plan,
      signup_method: 'email',
      $set: {
        plan,
        user_type: 'developer',
      },
    })

    // Identify user for future tracking
    posthog.identify(userId, {
      initial_plan: plan,
      signup_date: new Date().toISOString(),
    })

    console.log('[Analytics] Tracked signup:', { userId, plan })
  } catch (error) {
    console.error('[Analytics] Error tracking signup:', error)
  }
}

/**
 * Track user login event
 *
 * @param userId - Unique user identifier from Supabase
 */
export function trackLogin(userId: string): void {
  if (!canTrack()) return

  try {
    posthog.capture('user_login', {
      login_method: 'email',
    })

    // Identify user
    posthog.identify(userId)

    console.log('[Analytics] Tracked login:', { userId })
  } catch (error) {
    console.error('[Analytics] Error tracking login:', error)
  }
}

/**
 * Track successful file upload
 *
 * @param fileName - Name of uploaded file
 * @param recordCount - Number of property records uploaded
 */
export function trackFileUpload(fileName: string, recordCount: number): void {
  if (!canTrack()) return

  try {
    const fileExtension = fileName.split('.').pop()?.toLowerCase()

    posthog.capture('file_upload', {
      file_name: fileName,
      file_type: fileExtension,
      record_count: recordCount,
      upload_timestamp: new Date().toISOString(),
    })

    console.log('[Analytics] Tracked file upload:', { fileName, recordCount })
  } catch (error) {
    console.error('[Analytics] Error tracking file upload:', error)
  }
}

/**
 * Track subscription start (when user activates a paid plan)
 *
 * @param userId - Unique user identifier
 * @param plan - Subscription plan (basic, pro)
 */
export function trackSubscriptionStart(userId: string, plan: string): void {
  if (!canTrack()) return

  try {
    posthog.capture('subscription_start', {
      plan,
      subscription_type: 'paid',
      $set: {
        plan,
        subscription_status: 'active',
      },
    })

    // Update user properties
    posthog.identify(userId, {
      current_plan: plan,
      subscription_start_date: new Date().toISOString(),
    })

    console.log('[Analytics] Tracked subscription start:', { userId, plan })
  } catch (error) {
    console.error('[Analytics] Error tracking subscription start:', error)
  }
}

/**
 * Track trial start event
 *
 * @param userId - Unique user identifier
 */
export function trackTrialStart(userId: string): void {
  if (!canTrack()) return

  try {
    posthog.capture('trial_start', {
      trial_length_days: 14,
      $set: {
        trial_status: 'active',
      },
    })

    // Update user properties
    posthog.identify(userId, {
      trial_start_date: new Date().toISOString(),
      trial_status: 'active',
    })

    console.log('[Analytics] Tracked trial start:', { userId })
  } catch (error) {
    console.error('[Analytics] Error tracking trial start:', error)
  }
}

/**
 * Track successful payment event
 *
 * @param userId - Unique user identifier
 * @param amount - Payment amount in PLN
 * @param plan - Subscription plan purchased
 */
export function trackPaymentSuccess(
  userId: string,
  amount: number,
  plan: string
): void {
  if (!canTrack()) return

  try {
    posthog.capture('payment_success', {
      plan,
      amount,
      currency: 'PLN',
      payment_method: 'stripe',
      $set: {
        paying_customer: true,
        plan,
      },
    })

    // Update user properties
    posthog.identify(userId, {
      last_payment_date: new Date().toISOString(),
      last_payment_amount: amount,
      customer_status: 'paying',
    })

    console.log('[Analytics] Tracked payment success:', { userId, amount, plan })
  } catch (error) {
    console.error('[Analytics] Error tracking payment success:', error)
  }
}

/**
 * Track custom event
 *
 * @param eventName - Name of the event
 * @param properties - Event properties
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!canTrack()) return

  try {
    posthog.capture(eventName, properties)
    console.log('[Analytics] Tracked custom event:', { eventName, properties })
  } catch (error) {
    console.error('[Analytics] Error tracking custom event:', error)
  }
}

/**
 * Identify user with properties
 *
 * @param userId - Unique user identifier
 * @param properties - User properties
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): void {
  if (!canTrack()) return

  try {
    posthog.identify(userId, properties)
    console.log('[Analytics] Identified user:', { userId, properties })
  } catch (error) {
    console.error('[Analytics] Error identifying user:', error)
  }
}

/**
 * Reset user identity (on logout)
 */
export function resetUser(): void {
  if (!canTrack()) return

  try {
    posthog.reset()
    console.log('[Analytics] Reset user identity')
  } catch (error) {
    console.error('[Analytics] Error resetting user:', error)
  }
}
