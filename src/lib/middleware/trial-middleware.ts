/**
 * Trial Status Middleware - Task #49, Subtask 49.2
 * Checks and enforces 14-day trial period status
 *
 * Features:
 * - Checks if trial has expired
 * - Auto-updates trial_status to 'expired' when trial_ends_at < NOW()
 * - Returns trial info (isActive, daysRemaining, status)
 * - Provides middleware function to protect routes
 */

import { createAdminClient } from '@/lib/supabase/server'

// Trial status enum matching database
export type TrialStatus = 'active' | 'expired' | 'converted' | 'cancelled'

/**
 * Result of trial status check
 */
export interface TrialStatusResult {
  isActive: boolean
  daysRemaining: number
  trialEndsAt: Date | null
  status: TrialStatus
  subscriptionStatus: string | null
}

/**
 * Check trial status for a developer
 * Automatically updates trial_status to 'expired' if trial has ended
 *
 * @param developerId - Developer's UUID
 * @returns TrialStatusResult with current trial info
 */
export async function checkTrialStatus(developerId: string): Promise<TrialStatusResult> {
  try {
    const adminClient = await createAdminClient()

    console.log(`🔍 TRIAL CHECK: Checking trial status for developer ${developerId}`)

    // Get developer's trial and subscription info
    const { data: developer, error } = await adminClient
      .from('developers')
      .select('trial_status, trial_ends_at, subscription_status')
      .eq('id', developerId)
      .single()

    if (error || !developer) {
      console.error('❌ TRIAL CHECK: Failed to get developer:', error)
      return {
        isActive: false,
        daysRemaining: 0,
        trialEndsAt: null,
        status: 'expired',
        subscriptionStatus: null
      }
    }

    const now = new Date()
    const trialEndsAt = developer.trial_ends_at ? new Date(developer.trial_ends_at) : null
    const currentStatus = (developer.trial_status || 'active') as TrialStatus

    // If trial has expired but status is still 'active', update to 'expired'
    if (trialEndsAt && trialEndsAt < now && currentStatus === 'active') {
      console.log(`⏰ TRIAL CHECK: Trial expired for developer ${developerId}, updating status`)

      const { error: updateError } = await adminClient
        .from('developers')
        .update({
          trial_status: 'expired',
          subscription_status: developer.subscription_status === 'trialing' ? 'expired' : developer.subscription_status
        })
        .eq('id', developerId)

      if (updateError) {
        console.error('❌ TRIAL CHECK: Failed to update trial status:', updateError)
      } else {
        console.log('✅ TRIAL CHECK: Trial status updated to expired')
      }

      return {
        isActive: false,
        daysRemaining: 0,
        trialEndsAt,
        status: 'expired',
        subscriptionStatus: developer.subscription_status === 'trialing' ? 'expired' : developer.subscription_status
      }
    }

    // Calculate days remaining
    const daysRemaining = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    // Determine if trial is active
    const isActive = currentStatus === 'active' && trialEndsAt !== null && trialEndsAt > now

    console.log(`✅ TRIAL CHECK: Developer ${developerId} - Status: ${currentStatus}, Active: ${isActive}, Days remaining: ${daysRemaining}`)

    return {
      isActive,
      daysRemaining,
      trialEndsAt,
      status: currentStatus,
      subscriptionStatus: developer.subscription_status
    }

  } catch (error) {
    console.error('❌ TRIAL CHECK: Unexpected error:', error)
    return {
      isActive: false,
      daysRemaining: 0,
      trialEndsAt: null,
      status: 'expired',
      subscriptionStatus: null
    }
  }
}

/**
 * Check if developer has valid access (either active trial or active subscription)
 *
 * @param developerId - Developer's UUID
 * @returns Object with hasAccess boolean and reason if access denied
 */
export async function requireActiveTrial(developerId: string): Promise<{
  hasAccess: boolean
  reason?: 'trial_expired' | 'trial_cancelled' | 'no_subscription'
  trialStatus: TrialStatusResult
}> {
  const trialStatus = await checkTrialStatus(developerId)

  // Check if has active paid subscription (takes precedence over trial)
  if (trialStatus.subscriptionStatus === 'active' && trialStatus.status === 'converted') {
    console.log(`✅ TRIAL MIDDLEWARE: Developer ${developerId} has active subscription`)
    return {
      hasAccess: true,
      trialStatus
    }
  }

  // Check if trial is active
  if (trialStatus.isActive && trialStatus.status === 'active') {
    console.log(`✅ TRIAL MIDDLEWARE: Developer ${developerId} has active trial (${trialStatus.daysRemaining} days remaining)`)
    return {
      hasAccess: true,
      trialStatus
    }
  }

  // Trial has expired
  if (trialStatus.status === 'expired') {
    console.log(`❌ TRIAL MIDDLEWARE: Developer ${developerId} trial has expired`)
    return {
      hasAccess: false,
      reason: 'trial_expired',
      trialStatus
    }
  }

  // Trial was cancelled
  if (trialStatus.status === 'cancelled') {
    console.log(`❌ TRIAL MIDDLEWARE: Developer ${developerId} trial was cancelled`)
    return {
      hasAccess: false,
      reason: 'trial_cancelled',
      trialStatus
    }
  }

  // No valid trial or subscription
  console.log(`❌ TRIAL MIDDLEWARE: Developer ${developerId} has no valid access`)
  return {
    hasAccess: false,
    reason: 'no_subscription',
    trialStatus
  }
}

/**
 * Get trial status by user_id (for middleware integration)
 *
 * @param userId - User's UUID from auth
 * @returns TrialStatusResult or null if developer not found
 */
export async function getTrialStatusByUserId(userId: string): Promise<TrialStatusResult | null> {
  try {
    const adminClient = await createAdminClient()

    // Get developer by user_id
    const { data: developer, error } = await adminClient
      .from('developers')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (error || !developer) {
      console.error('❌ TRIAL CHECK: Developer not found for user:', userId)
      return null
    }

    return await checkTrialStatus(developer.id)

  } catch (error) {
    console.error('❌ TRIAL CHECK: Error getting trial status by user_id:', error)
    return null
  }
}

/**
 * Check if developer can access feature based on trial/subscription status
 * Ministry endpoints are always accessible (even with expired trial)
 *
 * @param developerId - Developer's UUID
 * @param feature - Feature to check access for
 * @returns boolean indicating if access is allowed
 */
export async function canAccessFeature(
  developerId: string,
  feature: 'upload' | 'properties' | 'ministry_endpoints' | 'analytics'
): Promise<{ allowed: boolean; reason?: string }> {
  // Ministry endpoints are ALWAYS accessible (compliance requirement)
  if (feature === 'ministry_endpoints') {
    return { allowed: true }
  }

  const accessCheck = await requireActiveTrial(developerId)

  if (accessCheck.hasAccess) {
    return { allowed: true }
  }

  // Access denied - provide user-friendly reason
  const reasonMessages = {
    trial_expired: 'Twój okres próbny wygasł. Upgrade aby kontynuować.',
    trial_cancelled: 'Twój trial został anulowany. Aktywuj plan aby kontynuować.',
    no_subscription: 'Brak aktywnej subskrypcji. Wybierz plan aby kontynuować.'
  }

  return {
    allowed: false,
    reason: reasonMessages[accessCheck.reason || 'no_subscription']
  }
}

/**
 * Get user-friendly error message for trial status
 */
export function getTrialErrorMessage(reason?: string): string {
  switch (reason) {
    case 'trial_expired':
      return 'Twój 14-dniowy okres próbny wygasł. Upgrade do planu Basic, Pro lub Enterprise aby kontynuować.'
    case 'trial_cancelled':
      return 'Twój trial został anulowany. Aktywuj nowy plan aby kontynuować.'
    case 'no_subscription':
      return 'Brak aktywnej subskrypcji. Wybierz plan aby kontynuować.'
    default:
      return 'Wystąpił problem z dostępem. Skontaktuj się z pomocą techniczną.'
  }
}
