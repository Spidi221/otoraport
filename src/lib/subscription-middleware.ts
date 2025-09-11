// Middleware for subscription checking in API routes

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getSubscriptionInfo, hasFeatureAccess, requireActiveSubscription } from '@/lib/subscription-manager'

export interface AuthenticatedRequest extends NextRequest {
  developerId: string
  subscription: any
}

/**
 * Middleware to check authentication and subscription status
 */
export async function withSubscriptionCheck(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: {
    requireFeature?: string
    requireActive?: boolean
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check authentication
      const session: any = await getServerSession(authOptions as any)
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized. Please log in.' },
          { status: 401 }
        )
      }

      // Get developer ID
      const { data: developer, error } = await supabaseAdmin
        .from('developers')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (error || !developer) {
        return NextResponse.json(
          { error: 'Developer not found' },
          { status: 404 }
        )
      }

      const developerId = developer.id

      // Check if subscription is required and active
      if (options.requireActive !== false) { // Default true
        const subscriptionCheck = await requireActiveSubscription(developerId)
        if (!subscriptionCheck.valid) {
          return NextResponse.json(
            { 
              error: subscriptionCheck.error,
              code: 'SUBSCRIPTION_REQUIRED',
              upgradeUrl: '/pricing'
            },
            { status: 402 } // Payment Required
          )
        }
      }

      // Check specific feature access if required
      if (options.requireFeature) {
        const hasAccess = await hasFeatureAccess(developerId, options.requireFeature as any)
        if (!hasAccess) {
          const subscription = await getSubscriptionInfo(developerId)
          return NextResponse.json(
            {
              error: `This feature requires a higher plan. Current plan: ${subscription?.plan || 'unknown'}`,
              code: 'FEATURE_RESTRICTED',
              currentPlan: subscription?.plan,
              upgradeUrl: '/pricing'
            },
            { status: 403 } // Forbidden
          )
        }
      }

      // Get subscription info for handler
      const subscription = await getSubscriptionInfo(developerId)

      // Create enhanced request object
      const enhancedRequest = Object.assign(request, {
        developerId,
        subscription
      }) as AuthenticatedRequest

      return await handler(enhancedRequest)

    } catch (error) {
      console.error('Subscription middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Check usage limits before allowing resource creation
 */
export async function checkUsageLimit(
  developerId: string,
  resource: 'projects' | 'properties',
  additionalCount: number = 1
): Promise<{ allowed: boolean, error?: string, upgradeUrl?: string }> {
  try {
    const subscription = await getSubscriptionInfo(developerId)
    if (!subscription) {
      return { allowed: false, error: 'Subscription not found' }
    }

    if (!subscription.isActive) {
      return { 
        allowed: false, 
        error: 'Subscription expired',
        upgradeUrl: '/pricing'
      }
    }

    if (resource === 'projects') {
      const limit = subscription.limits.investments
      if (limit === -1) return { allowed: true } // Unlimited

      const { count } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('developer_id', developerId)

      if ((count || 0) + additionalCount > limit) {
        return {
          allowed: false,
          error: `Plan limit reached: ${limit} investment${limit > 1 ? 's' : ''}`,
          upgradeUrl: '/pricing'
        }
      }
    }

    if (resource === 'properties') {
      const limit = subscription.limits.properties
      if (limit === -1) return { allowed: true } // Unlimited

      // For properties, we typically check per project, but this is total check
      const { data: projects } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('developer_id', developerId)

      const projectIds = projects?.map(p => p.id) || []
      const { count } = await supabaseAdmin
        .from('properties')
        .select('*', { count: 'exact' })
        .in('project_id', projectIds)

      if ((count || 0) + additionalCount > limit) {
        return {
          allowed: false,
          error: `Plan limit reached: ${limit} properties total`,
          upgradeUrl: '/pricing'
        }
      }
    }

    return { allowed: true }

  } catch (error) {
    console.error('Error checking usage limit:', error)
    return { allowed: false, error: 'System error' }
  }
}

/**
 * Response helper for subscription-related errors
 */
export function subscriptionErrorResponse(
  error: string,
  currentPlan?: string,
  requiredPlan?: string
): NextResponse {
  return NextResponse.json(
    {
      error,
      code: 'SUBSCRIPTION_ERROR',
      currentPlan,
      requiredPlan,
      upgradeUrl: '/pricing',
      supportUrl: 'mailto:support@otoraport.pl'
    },
    { status: 402 }
  )
}

/**
 * Feature gate response helper
 */
export function featureGateResponse(
  feature: string,
  currentPlan: string,
  requiredPlan: string
): NextResponse {
  return NextResponse.json(
    {
      error: `Feature '${feature}' requires ${requiredPlan} plan or higher`,
      code: 'FEATURE_GATED',
      feature,
      currentPlan,
      requiredPlan,
      upgradeUrl: '/pricing'
    },
    { status: 403 }
  )
}