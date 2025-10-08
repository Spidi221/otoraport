/**
 * Subscription Limits Middleware
 * Enforces property and project limits based on subscription plans
 */

import { createAdminClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_PLANS, type SubscriptionPlanType } from '@/lib/subscription-plans'

/**
 * Standardized error response for limit violations
 */
export interface LimitExceededResponse {
  error: 'property_limit_exceeded' | 'project_limit_exceeded'
  currentUsage: {
    properties?: number
    projects?: number
    limit: number | null // null = unlimited
  }
  message: string // Polish language, helpful
  upgradeUrl: string
  planRecommendation?: 'pro' | 'enterprise'
}

/**
 * Result of limit enforcement check
 */
export interface LimitCheckResult {
  allowed: boolean
  error?: LimitExceededResponse
}

/**
 * Enforce property limit for a developer
 * Checks if adding newPropertiesCount would exceed the subscription plan limit
 *
 * @param developerId - The developer's UUID
 * @param newPropertiesCount - Number of properties to be added
 * @returns LimitCheckResult with allowed status and optional error
 */
export async function enforcePropertyLimit(
  developerId: string,
  newPropertiesCount: number
): Promise<LimitCheckResult> {
  try {
    const adminClient = await createAdminClient()

    // Get developer's subscription plan
    const { data: developer, error: devError } = await adminClient
      .from('developers')
      .select('subscription_plan')
      .eq('id', developerId)
      .single()

    if (devError || !developer) {
      console.error('❌ LIMIT ENFORCEMENT: Failed to get developer:', devError)
      // Fail open - allow if we can't check (logged for monitoring)
      return { allowed: true }
    }

    const planType = (developer.subscription_plan || 'basic') as SubscriptionPlanType
    const plan = SUBSCRIPTION_PLANS[planType]

    // Get current properties count
    const { data: properties, error: propsError } = await adminClient
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('developer_id', developerId)

    if (propsError) {
      console.error('❌ LIMIT ENFORCEMENT: Failed to count properties:', propsError)
      // Fail open - allow if we can't check
      return { allowed: true }
    }

    const currentPropertiesCount = properties?.length || 0
    const futurePropertiesCount = currentPropertiesCount + newPropertiesCount

    // Check if unlimited
    if (plan.propertiesLimit === null) {
      console.log(`✅ LIMIT CHECK: Unlimited properties for ${planType} plan`)
      return { allowed: true }
    }

    // Check if would exceed limit
    if (futurePropertiesCount > plan.propertiesLimit) {
      const recommendedPlan: 'pro' | 'enterprise' = planType === 'basic' ? 'pro' : 'enterprise'

      const message = `Osiągnąłeś limit ${plan.propertiesLimit} mieszkań dla planu ${plan.displayName}. ` +
        `Masz obecnie ${currentPropertiesCount} mieszkań. ` +
        `Próbujesz dodać ${newPropertiesCount} mieszkań (łącznie: ${futurePropertiesCount}). ` +
        `Przejdź na plan ${recommendedPlan === 'pro' ? 'Pro' : 'Enterprise'} dla ${recommendedPlan === 'pro' ? 'unlimited mieszkań' : 'unlimited wszystkiego'}.`

      console.log(`⛔ LIMIT EXCEEDED: Developer ${developerId} - ${currentPropertiesCount} + ${newPropertiesCount} > ${plan.propertiesLimit}`)

      const error: LimitExceededResponse = {
        error: 'property_limit_exceeded',
        currentUsage: {
          properties: currentPropertiesCount,
          limit: plan.propertiesLimit
        },
        message,
        upgradeUrl: '/dashboard/settings#subscription',
        planRecommendation: recommendedPlan
      }

      return { allowed: false, error }
    }

    console.log(`✅ LIMIT CHECK: Within limits - ${futurePropertiesCount}/${plan.propertiesLimit} properties`)
    return { allowed: true }

  } catch (error) {
    console.error('❌ LIMIT ENFORCEMENT: Unexpected error:', error)
    // Fail open - allow if error occurs (logged for monitoring)
    return { allowed: true }
  }
}

/**
 * Enforce project limit for a developer
 * Checks if developer can add a new project based on their subscription plan
 *
 * @param developerId - The developer's UUID
 * @returns LimitCheckResult with allowed status and optional error
 */
export async function enforceProjectLimit(
  developerId: string
): Promise<LimitCheckResult> {
  try {
    const adminClient = await createAdminClient()

    // Get developer's subscription plan
    const { data: developer, error: devError } = await adminClient
      .from('developers')
      .select('subscription_plan')
      .eq('id', developerId)
      .single()

    if (devError || !developer) {
      console.error('❌ LIMIT ENFORCEMENT: Failed to get developer:', devError)
      // Fail open - allow if we can't check
      return { allowed: true }
    }

    const planType = (developer.subscription_plan || 'basic') as SubscriptionPlanType
    const plan = SUBSCRIPTION_PLANS[planType]

    // Get current active projects count
    const { data: projects, error: projError } = await adminClient
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('developer_id', developerId)

    if (projError) {
      console.error('❌ LIMIT ENFORCEMENT: Failed to count projects:', projError)
      // Fail open - allow if we can't check
      return { allowed: true }
    }

    const currentProjectsCount = projects?.length || 0

    // Check if unlimited
    if (plan.projectsLimit === null) {
      console.log(`✅ LIMIT CHECK: Unlimited projects for ${planType} plan`)
      return { allowed: true }
    }

    // Check if would exceed limit
    if (currentProjectsCount >= plan.projectsLimit) {
      const recommendedPlan: 'pro' | 'enterprise' = planType === 'basic' ? 'pro' : 'enterprise'

      let message = `Osiągnąłeś limit ${plan.projectsLimit} ${plan.projectsLimit === 1 ? 'projektu' : 'projektów'} dla planu ${plan.displayName}. `

      if (planType === 'pro') {
        message += `Możesz dodać kolejny projekt za +50 zł/miesiąc lub przejść na plan Enterprise dla unlimited projektów.`
      } else {
        message += `Przejdź na plan ${recommendedPlan === 'pro' ? 'Pro (2 projekty)' : 'Enterprise (unlimited)'}.`
      }

      console.log(`⛔ LIMIT EXCEEDED: Developer ${developerId} - ${currentProjectsCount} >= ${plan.projectsLimit} projects`)

      const error: LimitExceededResponse = {
        error: 'project_limit_exceeded',
        currentUsage: {
          projects: currentProjectsCount,
          limit: plan.projectsLimit
        },
        message,
        upgradeUrl: '/dashboard/settings#subscription',
        planRecommendation: recommendedPlan
      }

      return { allowed: false, error }
    }

    console.log(`✅ LIMIT CHECK: Within limits - ${currentProjectsCount}/${plan.projectsLimit} projects`)
    return { allowed: true }

  } catch (error) {
    console.error('❌ LIMIT ENFORCEMENT: Unexpected error:', error)
    // Fail open - allow if error occurs
    return { allowed: true }
  }
}

/**
 * Log limit violation for analytics
 * @param developerId - Developer UUID
 * @param limitType - Type of limit exceeded
 * @param details - Additional details about the violation
 */
export async function logLimitViolation(
  developerId: string,
  limitType: 'property' | 'project',
  details: {
    current: number
    limit: number
    attempted: number
    plan: string
  }
): Promise<void> {
  try {
    console.log(`📊 ANALYTICS: Limit violation logged`, {
      developerId,
      limitType,
      ...details,
      timestamp: new Date().toISOString()
    })

    // TODO: In the future, could store this in a dedicated analytics table
    // For now, just console logging is sufficient for monitoring

  } catch (error) {
    console.error('⚠️ ANALYTICS: Failed to log limit violation:', error)
    // Don't throw - logging failure shouldn't block the operation
  }
}
