/**
 * ANALYTICS ENTERPRISE API
 * Provides comprehensive analytics data for Enterprise plan users
 *
 * GET /api/analytics/enterprise
 * Query params: dateRange, propertyType, location
 * Returns: KPI metrics, trends, charts data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/api-schemas'
import { hasFeatureAccess } from '@/lib/subscription-manager'
import {
  calculateKPIMetrics,
  calculatePriceTrends,
  calculateDaysToSellDistribution,
  calculatePropertyStatusBreakdown,
  calculateCumulativeSales,
  calculateMarketComparison,
  filterPropertiesByDateRange,
  filterPropertiesByType,
  filterPropertiesByLocation,
} from '@/lib/analytics-calculations'
import type { Tables } from '@/types/database'

export const dynamic = 'force-dynamic'

// Cache duration: 10 minutes (analytics don't need to be real-time)
export const revalidate = 600

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get developer profile
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, subscription_plan, company_name')
      .eq('user_id', user.id)
      .single()

    if (devError || !developer) {
      return NextResponse.json({ error: 'Developer profile not found' }, { status: 404 })
    }

    // 3. Verify Enterprise plan access
    const hasAnalytics = await hasFeatureAccess(developer.id, 'analytics')
    if (!hasAnalytics) {
      return NextResponse.json(
        {
          error: 'Feature not available',
          message: 'Zaawansowana analityka jest dostępna tylko dla planu Enterprise.',
          upgradeRequired: true,
          currentPlan: developer.subscription_plan,
        },
        { status: 403 }
      )
    }

    // 4. Get query parameters
    const searchParams = request.nextUrl.searchParams
    const dateRange = searchParams.get('dateRange') || '6m'
    const propertyType = searchParams.get('propertyType') || 'all'
    const location = searchParams.get('location') || 'all'

    console.log(`📊 ANALYTICS: Fetching data for developer ${developer.id}, dateRange=${dateRange}, type=${propertyType}, location=${location}`)

    // 5. Fetch all properties for this developer
    const { data: allProperties, error: propsError } = await supabase
      .from('properties')
      .select('*')
      .eq('developer_id', developer.id)
      .order('created_at', { ascending: false })

    if (propsError) {
      console.error('❌ ANALYTICS: Error fetching properties:', propsError)
      return NextResponse.json({ error: propsError.message }, { status: 500 })
    }

    // 6. Fetch price history for trends
    const { data: priceHistory, error: historyError } = await supabase
      .from('price_history')
      .select('*')
      .eq('developer_id', developer.id)
      .order('changed_at', { ascending: false })

    if (historyError) {
      console.error('⚠️ ANALYTICS: Error fetching price history (non-critical):', historyError)
    }

    const properties = (allProperties || []) as Tables<'properties'>[]
    const history = (priceHistory || []) as Tables<'price_history'>[]

    // 7. Apply filters
    let filteredProperties = properties
    filteredProperties = filterPropertiesByType(filteredProperties, propertyType)
    filteredProperties = filterPropertiesByLocation(filteredProperties, location)

    // 8. Calculate date-based metrics
    const currentProperties = filterPropertiesByDateRange(filteredProperties, dateRange)

    // Calculate previous period for trends (same length as current period)
    const previousProperties = getPreviousPeriodProperties(filteredProperties, dateRange)

    // 9. Calculate all analytics
    const kpiMetrics = calculateKPIMetrics(currentProperties, previousProperties)
    const priceTrends = calculatePriceTrends(currentProperties, history, getMonthsFromRange(dateRange))
    const daysToSell = calculateDaysToSellDistribution(currentProperties)
    const propertyStatus = calculatePropertyStatusBreakdown(currentProperties)
    const cumulativeSales = calculateCumulativeSales(currentProperties, getMonthsFromRange(dateRange))
    const marketComparison = calculateMarketComparison(currentProperties)

    // 10. Build response
    const response = {
      kpi: kpiMetrics,
      priceTrends,
      daysToSell,
      propertyStatus,
      cumulativeSales,
      marketComparison,
      metadata: {
        totalProperties: currentProperties.length,
        dateRange,
        propertyType,
        location,
        generatedAt: new Date().toISOString(),
        developerName: developer.company_name || 'Developer',
      },
    }

    console.log(`✅ ANALYTICS: Successfully generated analytics for ${currentProperties.length} properties`)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=600', // Cache for 10 minutes
      },
    })

  } catch (error: unknown) {
    console.error('❌ ANALYTICS: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * Helper: Get properties from previous period for trend comparison
 * Returns properties from the period BEFORE the current period (same length)
 */
function getPreviousPeriodProperties(
  properties: Tables<'properties'>[],
  currentRange: string
): Tables<'properties'>[] {
  const now = new Date()
  let currentStartDate: Date
  let previousStartDate: Date
  let previousEndDate: Date

  switch (currentRange) {
    case '1m':
      currentStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())
      previousEndDate = currentStartDate
      break
    case '3m':
      currentStartDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      previousEndDate = currentStartDate
      break
    case '6m':
      currentStartDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      previousStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      previousEndDate = currentStartDate
      break
    case '12m':
      currentStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      previousStartDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
      previousEndDate = currentStartDate
      break
    case 'all':
    default:
      // For 'all', compare last 6 months vs previous 6 months
      currentStartDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      previousStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      previousEndDate = currentStartDate
      break
  }

  return properties.filter(p => {
    const createdDate = new Date(p.created_at || new Date())
    return createdDate >= previousStartDate && createdDate < previousEndDate
  })
}

/**
 * Helper: Convert date range string to number of months
 */
function getMonthsFromRange(dateRange: string): number {
  switch (dateRange) {
    case '1m': return 1
    case '3m': return 3
    case '6m': return 6
    case '12m': return 12
    case 'all': return 12 // Default to 12 months for 'all'
    default: return 6
  }
}
