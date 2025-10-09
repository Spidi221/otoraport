/**
 * DASHBOARD STATS API - Get aggregated statistics for dashboard cards
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/api-schemas'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (devError || !developer) {
      return NextResponse.json({ error: 'Developer profile not found' }, { status: 404 })
    }

    // Get all properties for this developer
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('*')
      .eq('developer_id', developer.id)

    if (propsError) {
      console.error('❌ STATS API: Error fetching properties:', propsError)
      return NextResponse.json({ error: propsError.message }, { status: 500 })
    }

    const allProperties = properties || []

    // Calculate current month boundaries
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)

    // Calculate previous month boundaries for comparison
    const lastMonth = subMonths(now, 1)
    const lastMonthStart = startOfMonth(lastMonth)
    const lastMonthEnd = endOfMonth(lastMonth)

    // Total properties
    const totalProperties = allProperties.length

    // Available properties
    const availableProperties = allProperties.filter(p => p.status === 'available').length

    // Sold properties this month
    const soldThisMonth = allProperties.filter(p => {
      if (p.status !== 'sold') return false
      if (!p.updated_at) return false
      const updatedDate = new Date(p.updated_at)
      return updatedDate >= currentMonthStart && updatedDate <= currentMonthEnd
    }).length

    // Sold properties last month (for trend)
    const soldLastMonth = allProperties.filter(p => {
      if (p.status !== 'sold') return false
      if (!p.updated_at) return false
      const updatedDate = new Date(p.updated_at)
      return updatedDate >= lastMonthStart && updatedDate <= lastMonthEnd
    }).length

    // Calculate average price per m² (only available properties with valid data)
    const validProperties = allProperties.filter(p =>
      p.status === 'available' &&
      p.price &&
      p.area &&
      p.price > 0 &&
      p.area > 0
    )

    const avgPricePerM2 = validProperties.length > 0
      ? Math.round(validProperties.reduce((sum, p) => sum + (p.price / p.area), 0) / validProperties.length)
      : 0

    // Calculate last month's average for trend
    const lastMonthProperties = allProperties.filter(p => {
      if (p.status !== 'available' || !p.price || !p.area) return false
      if (!p.created_at) return false
      const createdDate = new Date(p.created_at)
      return createdDate >= lastMonthStart && createdDate <= lastMonthEnd
    })

    const lastMonthAvgPrice = lastMonthProperties.length > 0
      ? Math.round(lastMonthProperties.reduce((sum, p) => sum + (p.price / p.area), 0) / lastMonthProperties.length)
      : avgPricePerM2

    // Calculate trends
    const soldTrend = soldLastMonth === 0 ? 0 : ((soldThisMonth - soldLastMonth) / soldLastMonth) * 100
    const priceTrend = lastMonthAvgPrice === 0 ? 0 : ((avgPricePerM2 - lastMonthAvgPrice) / lastMonthAvgPrice) * 100

    // Calculate total properties trend (comparing current month additions)
    const newThisMonth = allProperties.filter(p => {
      if (!p.created_at) return false
      const createdDate = new Date(p.created_at)
      return createdDate >= currentMonthStart && createdDate <= currentMonthEnd
    }).length

    const newLastMonth = allProperties.filter(p => {
      if (!p.created_at) return false
      const createdDate = new Date(p.created_at)
      return createdDate >= lastMonthStart && createdDate <= lastMonthEnd
    }).length

    const totalTrend = newLastMonth === 0 ? 0 : ((newThisMonth - newLastMonth) / newLastMonth) * 100

    return NextResponse.json({
      stats: {
        totalProperties: {
          value: totalProperties,
          trend: totalTrend,
          label: 'Wszystkie nieruchomości'
        },
        availableProperties: {
          value: availableProperties,
          trend: 0, // Can calculate if needed
          label: 'Dostępne'
        },
        soldThisMonth: {
          value: soldThisMonth,
          trend: soldTrend,
          label: 'Sprzedane w tym miesiącu'
        },
        avgPricePerM2: {
          value: avgPricePerM2,
          trend: priceTrend,
          label: 'Średnia cena za m²'
        }
      },
      lastUpdated: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error('❌ STATS API: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
