/**
 * Admin Analytics API
 * Task #60.1 - Design and Implement GET /api/admin/analytics Endpoint
 *
 * Returns comprehensive analytics data including:
 * - KPIs (MRR, ARR, user counts, conversion rates)
 * - User growth over time
 * - Revenue growth over time
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/require-admin'
import { createAdminClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans'

export const dynamic = 'force-dynamic'

interface MonthlyData {
  month: string
  count?: number
  mrr?: number
  arr?: number
}

interface AnalyticsKPIs {
  mrr: number
  arr: number
  totalUsers: number
  activeSubscriptions: number
  trialUsers: number
  churnRate: number
  trialConversionRate: number
}

interface AnalyticsResponse {
  kpis: AnalyticsKPIs
  userGrowth: MonthlyData[]
  revenueGrowth: MonthlyData[]
}

/**
 * Calculate MRR for a given developer based on their subscription plan
 */
function calculateDeveloperMRR(
  subscriptionPlan: string | null,
  additionalProjectsCount: number = 0
): number {
  if (!subscriptionPlan) return 0

  const plan = SUBSCRIPTION_PLANS[subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS]
  if (!plan) return 0

  let mrr = plan.price / 100 // Convert from grosze to PLN

  // Add additional project fees for Pro plan
  if (subscriptionPlan === 'pro' && additionalProjectsCount > 0 && plan.additionalProjectFee) {
    mrr += (additionalProjectsCount * plan.additionalProjectFee) / 100
  }

  return mrr
}

export async function GET(request: NextRequest) {
  // Require admin access
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  try {
    const supabase = createAdminClient()
    const now = new Date()

    // Calculate date range for last 12 months
    const twelveMonthsAgo = new Date(now)
    twelveMonthsAgo.setMonth(now.getMonth() - 12)

    // ============ KPI CALCULATIONS ============

    // Fetch all developers with subscription data
    const { data: developers, error: devsError } = await supabase
      .from('developers')
      .select('subscription_plan, subscription_status, trial_status, additional_projects_count, created_at')

    if (devsError) {
      throw new Error(`Failed to fetch developers: ${devsError.message}`)
    }

    const totalUsers = developers?.length || 0

    // Active subscriptions: subscription_status = 'active' or 'trialing'
    const activeSubscriptions = developers?.filter(
      d => d.subscription_status === 'active' || d.subscription_status === 'trialing'
    ).length || 0

    // Trial users: trial_status = 'active'
    const trialUsers = developers?.filter(
      d => d.trial_status === 'active'
    ).length || 0

    // Calculate MRR: Sum of all active subscriptions
    let mrr = 0
    developers?.forEach(dev => {
      if (dev.subscription_status === 'active') {
        mrr += calculateDeveloperMRR(
          dev.subscription_plan,
          dev.additional_projects_count || 0
        )
      }
    })

    // ARR = MRR * 12
    const arr = mrr * 12

    // Calculate Churn Rate
    // Get users who cancelled in the last 30 days
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const { data: cancelledLast30Days } = await supabase
      .from('developers')
      .select('id')
      .eq('subscription_status', 'cancelled')
      .gte('updated_at', thirtyDaysAgo.toISOString())

    const cancelledCount = cancelledLast30Days?.length || 0

    // Active users at start of month (30 days ago)
    const { data: activeStartOfMonth } = await supabase
      .from('developers')
      .select('id')
      .in('subscription_status', ['active', 'trialing'])
      .lte('created_at', thirtyDaysAgo.toISOString())

    const activeStartCount = activeStartOfMonth?.length || 0
    const churnRate = activeStartCount > 0 ? (cancelledCount / activeStartCount) * 100 : 0

    // Trial Conversion Rate
    const allTrials = developers?.filter(
      d => d.trial_status !== null && d.trial_status !== 'active'
    ).length || 0

    const convertedTrials = developers?.filter(
      d => d.trial_status === 'converted'
    ).length || 0

    const trialConversionRate = allTrials > 0 ? (convertedTrials / allTrials) * 100 : 0

    // ============ USER GROWTH OVER TIME ============

    // Get user signups grouped by month for last 12 months
    const { data: userGrowthData, error: growthError } = await supabase
      .from('developers')
      .select('created_at')
      .gte('created_at', twelveMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    if (growthError) {
      console.error('Error fetching user growth data:', growthError)
    }

    // Group by month
    const userGrowthMap = new Map<string, number>()
    userGrowthData?.forEach(dev => {
      const date = new Date(dev.created_at || '')
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      userGrowthMap.set(monthKey, (userGrowthMap.get(monthKey) || 0) + 1)
    })

    // Fill in missing months with 0
    const userGrowth: MonthlyData[] = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(now.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      userGrowth.push({
        month: monthKey,
        count: userGrowthMap.get(monthKey) || 0
      })
    }

    // ============ REVENUE GROWTH OVER TIME ============

    // For revenue growth, we need to calculate MRR for each month
    // This is a simplified approach - in production, you'd track historical subscription changes

    // Get all subscription changes from payments table (if available)
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount, created_at, developer_id')
      .eq('status', 'succeeded')
      .gte('created_at', twelveMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group payments by month
    const revenueMap = new Map<string, number>()
    paymentsData?.forEach(payment => {
      const date = new Date(payment.created_at || '')
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const amountPLN = payment.amount / 100 // Convert grosze to PLN
      revenueMap.set(monthKey, (revenueMap.get(monthKey) || 0) + amountPLN)
    })

    // For months without payment data, estimate MRR based on active subscriptions
    // This is simplified - in production you'd track subscription history
    const revenueGrowth: MonthlyData[] = []
    let cumulativeMRR = 0

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(now.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      const monthlyRevenue = revenueMap.get(monthKey) || 0

      // Use actual revenue if available, otherwise estimate
      const monthMRR = monthlyRevenue > 0 ? monthlyRevenue : cumulativeMRR

      // Update cumulative MRR (simple growth estimation)
      if (monthlyRevenue > 0) {
        cumulativeMRR = monthlyRevenue
      }

      revenueGrowth.push({
        month: monthKey,
        mrr: Math.round(monthMRR * 100) / 100, // Round to 2 decimals
        arr: Math.round(monthMRR * 12 * 100) / 100
      })
    }

    // If no payment history, use current MRR for recent months
    if (revenueGrowth.every(r => r.mrr === 0)) {
      // Estimate historical MRR based on current MRR and user growth
      const currentMRR = mrr
      revenueGrowth.forEach((month, index) => {
        // Simple linear growth estimation
        const growthFactor = (index + 1) / 12
        month.mrr = Math.round(currentMRR * growthFactor * 100) / 100
        month.arr = Math.round(month.mrr * 12 * 100) / 100
      })
    }

    // ============ BUILD RESPONSE ============

    const response: AnalyticsResponse = {
      kpis: {
        mrr: Math.round(mrr * 100) / 100, // Round to 2 decimals
        arr: Math.round(arr * 100) / 100,
        totalUsers,
        activeSubscriptions,
        trialUsers,
        churnRate: Math.round(churnRate * 100) / 100,
        trialConversionRate: Math.round(trialConversionRate * 100) / 100
      },
      userGrowth,
      revenueGrowth
    }

    // Log admin action
    await logAdminAction(
      adminCheck.user.id,
      'view_analytics_dashboard',
      null,
      { kpis: response.kpis },
      request
    )

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ ADMIN ANALYTICS API: Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
