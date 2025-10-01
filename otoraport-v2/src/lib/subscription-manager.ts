// Subscription management and feature gating system

import { createAdminClient } from '@/lib/supabase/server'

export interface PlanLimits {
  investments: number // Max number of projects
  properties: number // Max properties per project (-1 = unlimited)
  presentationPages: boolean
  analytics: boolean
  apiAccess: boolean
  customDomain: boolean
  whiteLabel: boolean
  prioritySupport: boolean
  emailReports: boolean
}

export interface SubscriptionInfo {
  plan: 'basic' | 'pro' | 'enterprise' | 'trial'
  status: 'trial' | 'active' | 'cancelled' | 'expired'
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  isActive: boolean
  limits: PlanLimits
}

// Plan configurations matching the business model from claude.md
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  trial: {
    investments: 1, // 1 project for trial
    properties: 10, // 10 properties max in trial
    presentationPages: false,
    analytics: false,
    apiAccess: false,
    customDomain: false,
    whiteLabel: false,
    prioritySupport: false,
    emailReports: false
  },
  basic: {
    investments: 2, // Up to 2 investments
    properties: -1, // Unlimited properties per project
    presentationPages: false,
    analytics: false,
    apiAccess: false,
    customDomain: false,
    whiteLabel: false,
    prioritySupport: false,
    emailReports: true
  },
  pro: {
    investments: 10, // Up to 10 investments
    properties: -1, // Unlimited properties per project
    presentationPages: true, // Key Pro feature
    analytics: true,
    apiAccess: false,
    customDomain: false,
    whiteLabel: false,
    prioritySupport: true,
    emailReports: true
  },
  enterprise: {
    investments: -1, // Unlimited investments
    properties: -1, // Unlimited properties
    presentationPages: true,
    analytics: true,
    apiAccess: true, // Enterprise only
    customDomain: true, // Enterprise only
    whiteLabel: true, // Enterprise only
    prioritySupport: true,
    emailReports: true
  }
}

/**
 * Get subscription information for a developer
 */
export async function getSubscriptionInfo(developerId: string): Promise<SubscriptionInfo | null> {
  try {
    const { data: developer, error } = await createAdminClient()
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single()

    if (error || !developer) {
      return null
    }

    const plan = developer.subscription_plan || 'trial'
    const status = developer.subscription_status || 'trial'
    const trialEndsAt = developer.subscription_end_date
    const subscriptionEndsAt = developer.subscription_end_date

    // Check if subscription is active
    const now = new Date()
    const endDate = subscriptionEndsAt ? new Date(subscriptionEndsAt) : null
    const isActive = status === 'active' || (status === 'trial' && endDate && endDate > now)

    return {
      plan,
      status,
      trialEndsAt: status === 'trial' ? trialEndsAt : null,
      subscriptionEndsAt: status === 'active' ? subscriptionEndsAt : null,
      isActive,
      limits: PLAN_LIMITS[plan] || PLAN_LIMITS.trial
    }

  } catch (error) {
    console.error('Error getting subscription info:', error)
    return null
  }
}

/**
 * Check if developer can create a new project
 */
export async function canCreateProject(developerId: string): Promise<{ allowed: boolean, reason?: string }> {
  try {
    const subscription = await getSubscriptionInfo(developerId)
    if (!subscription) {
      return { allowed: false, reason: 'Subscription not found' }
    }

    if (!subscription.isActive) {
      return { allowed: false, reason: 'Subscription expired' }
    }

    // Check project limit
    if (subscription.limits.investments === -1) {
      return { allowed: true } // Unlimited
    }

    const { count: projectsCount } = await createAdminClient()
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('developer_id', developerId)

    if ((projectsCount || 0) >= subscription.limits.investments) {
      return { 
        allowed: false, 
        reason: `Plan limit reached: ${subscription.limits.investments} investment${subscription.limits.investments > 1 ? 's' : ''}. Upgrade to add more.` 
      }
    }

    return { allowed: true }

  } catch (error) {
    console.error('Error checking project creation:', error)
    return { allowed: false, reason: 'System error' }
  }
}

/**
 * Check if developer can add properties to a project
 */
export async function canAddProperties(developerId: string, projectId: string, additionalCount: number = 1): Promise<{ allowed: boolean, reason?: string }> {
  try {
    const subscription = await getSubscriptionInfo(developerId)
    if (!subscription) {
      return { allowed: false, reason: 'Subscription not found' }
    }

    if (!subscription.isActive) {
      return { allowed: false, reason: 'Subscription expired' }
    }

    // Check properties limit (if applicable)
    if (subscription.limits.properties === -1) {
      return { allowed: true } // Unlimited
    }

    const { count: propertiesCount } = await createAdminClient()
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId)

    if ((propertiesCount || 0) + additionalCount > subscription.limits.properties) {
      return { 
        allowed: false, 
        reason: `Plan limit reached: ${subscription.limits.properties} properties per project. Upgrade for unlimited.` 
      }
    }

    return { allowed: true }

  } catch (error) {
    console.error('Error checking properties limit:', error)
    return { allowed: false, reason: 'System error' }
  }
}

/**
 * Check if developer has access to a specific feature
 */
export async function hasFeatureAccess(developerId: string, feature: keyof PlanLimits): Promise<boolean> {
  try {
    const subscription = await getSubscriptionInfo(developerId)
    if (!subscription || !subscription.isActive) {
      return false
    }

    return subscription.limits[feature] === true

  } catch (error) {
    console.error('Error checking feature access:', error)
    return false
  }
}

/**
 * Get usage stats for a developer
 */
export async function getUsageStats(developerId: string): Promise<{
  projects: { current: number, limit: number | -1 }
  properties: { current: number, limit: number | -1 }
  subscription: SubscriptionInfo | null
}> {
  try {
    const subscription = await getSubscriptionInfo(developerId)
    
    // Get current usage
    const { count: projectsCount } = await createAdminClient()
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('developer_id', developerId)

    // Get projects to count total properties
    const { data: projects } = await createAdminClient()
      .from('projects')
      .select('id')
      .eq('developer_id', developerId)

    const projectIds = projects?.map(p => p.id) || []
    const { count: propertiesCount } = await createAdminClient()
      .from('properties')
      .select('*', { count: 'exact' })
      .in('project_id', projectIds)

    return {
      projects: {
        current: projectsCount || 0,
        limit: subscription?.limits.investments || 0
      },
      properties: {
        current: propertiesCount || 0,
        limit: subscription?.limits.properties || 0
      },
      subscription
    }

  } catch (error) {
    console.error('Error getting usage stats:', error)
    return {
      projects: { current: 0, limit: 0 },
      properties: { current: 0, limit: 0 },
      subscription: null
    }
  }
}

/**
 * Middleware function to check subscription before API calls
 */
export async function requireActiveSubscription(developerId: string): Promise<{ valid: boolean, error?: string }> {
  // 🔧 DEVELOPMENT MODE: Bypass dla whitelisted emails
  if (process.env.NODE_ENV === 'development') {
    const { data: developer } = await createAdminClient()
      .from('developers')
      .select('email')
      .eq('id', developerId)
      .single()

    const DEV_WHITELIST = process.env.DEV_WHITELIST_EMAILS?.split(',').map(e => e.trim()) || []
    if (developer?.email && DEV_WHITELIST.includes(developer.email)) {
      console.log(`🔓 DEV MODE: Bypassing subscription check for ${developer.email}`)
      return { valid: true }
    }
  }

  // ✅ PRODUCTION LOGIC: Normalna walidacja dla pozostałych
  const subscription = await getSubscriptionInfo(developerId)

  if (!subscription) {
    return { valid: false, error: 'Subscription not found' }
  }

  if (!subscription.isActive) {
    return {
      valid: false,
      error: subscription.status === 'expired'
        ? 'Subscription expired. Please renew to continue.'
        : 'Subscription inactive. Please check your payment method.'
    }
  }

  return { valid: true }
}

/**
 * Get upgrade suggestions based on current usage
 */
export async function getUpgradeSuggestions(developerId: string): Promise<{
  shouldUpgrade: boolean
  currentPlan: string
  suggestedPlan: string
  reasons: string[]
}> {
  try {
    const usage = await getUsageStats(developerId)
    if (!usage.subscription) {
      return { shouldUpgrade: false, currentPlan: 'unknown', suggestedPlan: 'basic', reasons: [] }
    }

    const reasons: string[] = []
    let suggestedPlan = usage.subscription.plan

    // Check if user is hitting limits
    if (usage.projects.limit !== -1 && usage.projects.current >= usage.projects.limit * 0.8) {
      reasons.push(`Using ${usage.projects.current}/${usage.projects.limit} investment slots`)
      if (usage.subscription.plan === 'basic') suggestedPlan = 'pro'
      if (usage.subscription.plan === 'pro') suggestedPlan = 'enterprise'
    }

    if (usage.properties.limit !== -1 && usage.properties.current >= usage.properties.limit * 0.8) {
      reasons.push(`Using ${usage.properties.current}/${usage.properties.limit} property slots`)
    }

    // Suggest Pro if user might benefit from presentation pages
    if (usage.subscription.plan === 'basic' && usage.properties.current > 20) {
      reasons.push('With 20+ properties, presentation pages could help showcase your portfolio')
      suggestedPlan = 'pro'
    }

    // Suggest Enterprise if user has many projects
    if (usage.subscription.plan === 'pro' && usage.projects.current > 5) {
      reasons.push('Large portfolio could benefit from API access and white-label features')
      suggestedPlan = 'enterprise'
    }

    return {
      shouldUpgrade: reasons.length > 0 && suggestedPlan !== usage.subscription.plan,
      currentPlan: usage.subscription.plan,
      suggestedPlan,
      reasons
    }

  } catch (error) {
    console.error('Error getting upgrade suggestions:', error)
    return { shouldUpgrade: false, currentPlan: 'unknown', suggestedPlan: 'basic', reasons: [] }
  }
}