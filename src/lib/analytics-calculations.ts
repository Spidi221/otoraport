/**
 * Analytics Calculations Library
 * Pure functions for calculating analytics metrics from property data
 *
 * All functions are stateless and testable
 */

import { Tables } from '@/types/database'

type Property = Tables<'properties'>
type PriceHistory = Tables<'price_history'>

// KPI Data Types
export interface KPIMetrics {
  averagePrice: number
  occupancyRate: number
  avgDaysToSell: number
  pricePerM2: number
  trends: {
    averagePrice: number
    occupancyRate: number
    avgDaysToSell: number
    pricePerM2: number
  }
}

// Price Trend Types
export interface PriceTrendData {
  month: string
  avgPrice: number
  avgPricePerM2: number
}

// Days to Sell Distribution
export interface DaysToSellData {
  range: string
  count: number
}

// Property Status Breakdown
export interface PropertyStatusData {
  status: string
  count: number
  percentage: number
}

// Cumulative Sales
export interface CumulativeSalesData {
  month: string
  cumulative: number
  monthly: number
}

// Market Comparison
export interface MarketComparisonData {
  category: string
  myPrice: number
  marketAvg: number
}

/**
 * Calculate KPI metrics with period-over-period trends
 * Compares current period vs previous period of same length
 */
export function calculateKPIMetrics(
  currentProperties: Property[],
  previousProperties: Property[]
): KPIMetrics {
  // Current period calculations
  const avgPrice = calculateAveragePrice(currentProperties)
  const occupancy = calculateOccupancyRate(currentProperties)
  const avgDays = calculateAverageDaysToSell(currentProperties)
  const priceM2 = calculateAveragePricePerM2(currentProperties)

  // Previous period calculations
  const prevAvgPrice = calculateAveragePrice(previousProperties)
  const prevOccupancy = calculateOccupancyRate(previousProperties)
  const prevAvgDays = calculateAverageDaysToSell(previousProperties)
  const prevPriceM2 = calculateAveragePricePerM2(previousProperties)

  // Calculate percentage changes
  const trends = {
    averagePrice: calculatePercentageChange(prevAvgPrice, avgPrice),
    occupancyRate: calculatePercentageChange(prevOccupancy, occupancy),
    avgDaysToSell: calculatePercentageChange(prevAvgDays, avgDays),
    pricePerM2: calculatePercentageChange(prevPriceM2, priceM2),
  }

  return {
    averagePrice: avgPrice,
    occupancyRate: occupancy,
    avgDaysToSell: avgDays,
    pricePerM2: priceM2,
    trends,
  }
}

/**
 * Calculate average final price across properties
 */
export function calculateAveragePrice(properties: Property[]): number {
  if (properties.length === 0) return 0
  const total = properties.reduce((sum, p) => sum + (p.final_price || 0), 0)
  return Math.round(total / properties.length)
}

/**
 * Calculate occupancy rate (sold + reserved / total * 100)
 */
export function calculateOccupancyRate(properties: Property[]): number {
  if (properties.length === 0) return 0
  const occupied = properties.filter(
    p => p.status === 'sold' || p.status === 'reserved'
  ).length
  return Math.round((occupied / properties.length) * 100 * 10) / 10 // Round to 1 decimal
}

/**
 * Calculate average days to sell for sold properties
 * Uses created_at and updated_at as proxy for sold_date
 */
export function calculateAverageDaysToSell(properties: Property[]): number {
  const soldProperties = properties.filter(p => p.status === 'sold')
  if (soldProperties.length === 0) return 0

  const totalDays = soldProperties.reduce((sum, p) => {
    const createdDate = new Date(p.created_at || new Date())
    const soldDate = new Date(p.updated_at || new Date())
    const diffDays = Math.floor((soldDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    return sum + Math.max(0, diffDays) // Ensure non-negative
  }, 0)

  return Math.round(totalDays / soldProperties.length)
}

/**
 * Calculate average price per m²
 */
export function calculateAveragePricePerM2(properties: Property[]): number {
  if (properties.length === 0) return 0
  const total = properties.reduce((sum, p) => sum + (p.price_per_m2 || 0), 0)
  return Math.round(total / properties.length)
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return Math.round(((newValue - oldValue) / oldValue) * 100 * 10) / 10
}

/**
 * Generate price trend data by month for the last N months
 */
export function calculatePriceTrends(
  properties: Property[],
  priceHistory: PriceHistory[],
  months: number = 6
): PriceTrendData[] {
  const trends: PriceTrendData[] = []
  const now = new Date()

  // Generate month labels and aggregate data
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = monthDate.toISOString().slice(0, 7) // YYYY-MM format

    // Filter properties created/updated in this month
    const monthProperties = properties.filter(p => {
      const createdMonth = (p.created_at || '').slice(0, 7)
      const updatedMonth = (p.updated_at || '').slice(0, 7)
      return createdMonth === monthKey || updatedMonth === monthKey
    })

    // Also check price history for this month
    const monthPriceChanges = priceHistory.filter(ph =>
      (ph.changed_at || '').slice(0, 7) === monthKey
    )

    // Combine properties with their price history
    const allPrices = [
      ...monthProperties.map(p => p.final_price),
      ...monthPriceChanges.map(ph => ph.new_final_price || 0),
    ].filter(price => price > 0)

    const allPricesPerM2 = [
      ...monthProperties.map(p => p.price_per_m2),
      ...monthPriceChanges.map(ph => ph.new_price_per_m2 || 0),
    ].filter(price => price > 0)

    const avgPrice = allPrices.length > 0
      ? Math.round(allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length)
      : 0

    const avgPricePerM2 = allPricesPerM2.length > 0
      ? Math.round(allPricesPerM2.reduce((sum, p) => sum + p, 0) / allPricesPerM2.length)
      : 0

    // Format month label (e.g., "Sty 24", "Lut 24")
    const monthLabel = formatMonthLabel(monthDate)

    trends.push({
      month: monthLabel,
      avgPrice,
      avgPricePerM2,
    })
  }

  return trends
}

/**
 * Calculate days to sell distribution
 */
export function calculateDaysToSellDistribution(properties: Property[]): DaysToSellData[] {
  const soldProperties = properties.filter(p => p.status === 'sold')

  const ranges = [
    { range: '0-30 dni', min: 0, max: 30, count: 0 },
    { range: '31-60 dni', min: 31, max: 60, count: 0 },
    { range: '61-90 dni', min: 61, max: 90, count: 0 },
    { range: '91-120 dni', min: 91, max: 120, count: 0 },
    { range: '>120 dni', min: 121, max: Infinity, count: 0 },
  ]

  soldProperties.forEach(p => {
    const createdDate = new Date(p.created_at || new Date())
    const soldDate = new Date(p.updated_at || new Date())
    const days = Math.floor((soldDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

    const range = ranges.find(r => days >= r.min && days <= r.max)
    if (range) {
      range.count++
    }
  })

  return ranges.map(({ range, count }) => ({ range, count }))
}

/**
 * Calculate property status breakdown with percentages
 */
export function calculatePropertyStatusBreakdown(properties: Property[]): PropertyStatusData[] {
  const total = properties.length
  if (total === 0) {
    return [
      { status: 'Dostępne', count: 0, percentage: 0 },
      { status: 'Zarezerwowane', count: 0, percentage: 0 },
      { status: 'Sprzedane', count: 0, percentage: 0 },
    ]
  }

  const available = properties.filter(p => p.status === 'available' || !p.status).length
  const reserved = properties.filter(p => p.status === 'reserved').length
  const sold = properties.filter(p => p.status === 'sold').length

  return [
    { status: 'Dostępne', count: available, percentage: Math.round((available / total) * 100) },
    { status: 'Zarezerwowane', count: reserved, percentage: Math.round((reserved / total) * 100) },
    { status: 'Sprzedane', count: sold, percentage: Math.round((sold / total) * 100) },
  ]
}

/**
 * Calculate cumulative sales over time
 */
export function calculateCumulativeSales(
  properties: Property[],
  months: number = 6
): CumulativeSalesData[] {
  const soldProperties = properties.filter(p => p.status === 'sold')
  const salesByMonth: Record<string, number> = {}
  const now = new Date()

  // Count sales by month
  soldProperties.forEach(p => {
    const soldMonth = (p.updated_at || p.created_at || '').slice(0, 7)
    salesByMonth[soldMonth] = (salesByMonth[soldMonth] || 0) + 1
  })

  const result: CumulativeSalesData[] = []
  let cumulative = 0

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = monthDate.toISOString().slice(0, 7)
    const monthly = salesByMonth[monthKey] || 0
    cumulative += monthly

    result.push({
      month: formatMonthLabel(monthDate),
      cumulative,
      monthly,
    })
  }

  return result
}

/**
 * Calculate market comparison data
 * For now uses placeholder market data (1.08x multiplier)
 * TODO: Replace with real market data API in future
 */
export function calculateMarketComparison(properties: Property[]): MarketComparisonData[] {
  // Group properties by number of rooms
  const byRooms: Record<string, number[]> = {}

  properties.forEach(p => {
    const rooms = p.rooms || 0
    const key = rooms === 1 ? '1-pokojowe' : rooms === 2 ? '2-pokojowe' : rooms === 3 ? '3-pokojowe' : '4-pokojowe'
    if (!byRooms[key]) byRooms[key] = []
    byRooms[key].push(p.final_price)
  })

  // Calculate averages
  const categories = ['1-pokojowe', '2-pokojowe', '3-pokojowe', '4-pokojowe']
  const result: MarketComparisonData[] = []

  categories.forEach(category => {
    const prices = byRooms[category] || []
    if (prices.length > 0) {
      const myPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
      // Placeholder: Market average is 8% lower than your prices (you're slightly above market)
      const marketAvg = Math.round(myPrice * 0.92)

      result.push({ category, myPrice, marketAvg })
    }
  })

  return result.length > 0 ? result : [
    { category: '1-pokojowe', myPrice: 0, marketAvg: 0 },
    { category: '2-pokojowe', myPrice: 0, marketAvg: 0 },
    { category: '3-pokojowe', myPrice: 0, marketAvg: 0 },
    { category: '4-pokojowe', myPrice: 0, marketAvg: 0 },
  ]
}

/**
 * Format month label for charts (e.g., "Sty 24", "Lut 24")
 */
function formatMonthLabel(date: Date): string {
  const monthNames = [
    'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
    'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'
  ]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear().toString().slice(-2)
  return `${month} ${year}`
}

/**
 * Filter properties by date range
 */
export function filterPropertiesByDateRange(
  properties: Property[],
  dateRange: string
): Property[] {
  const now = new Date()
  let startDate: Date

  switch (dateRange) {
    case '1m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      break
    case '3m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      break
    case '6m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      break
    case '12m':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      break
    case 'all':
    default:
      return properties
  }

  return properties.filter(p => {
    const createdDate = new Date(p.created_at || new Date())
    return createdDate >= startDate
  })
}

/**
 * Filter properties by type
 */
export function filterPropertiesByType(
  properties: Property[],
  propertyType: string
): Property[] {
  if (propertyType === 'all') return properties
  return properties.filter(p => p.property_type === propertyType)
}

/**
 * Filter properties by location
 */
export function filterPropertiesByLocation(
  properties: Property[],
  location: string
): Property[] {
  if (location === 'all') return properties
  return properties.filter(p =>
    p.wojewodztwo?.toLowerCase().includes(location.toLowerCase()) ||
    p.miejscowosc?.toLowerCase().includes(location.toLowerCase())
  )
}
