// Advanced analytics service for OTO-RAPORT
import { createAdminClient } from './supabase/server'
import { subDays, format } from 'date-fns'
import { pl } from 'date-fns/locale'

export interface PriceAnalytics {
  averagePricePerM2: number
  medianPricePerM2: number
  priceChange30Days: number
  priceChangePrevMonth: number
  totalProperties: number
  soldProperties: number
  availableProperties: number
  averageDaysOnMarket: number
}

export interface MarketTrend {
  date: string
  averagePrice: number
  medianPrice: number
  totalListings: number
  soldCount: number
}

export interface PropertyTypeBreakdown {
  propertyType: string
  count: number
  averagePrice: number
  medianPrice: number
  percentage: number
}

export interface ProjectPerformance {
  projectId: string
  projectName: string
  totalProperties: number
  soldProperties: number
  averagePrice: number
  medianPrice: number
  salesVelocity: number // properties sold per month
  priceAppreciation: number // % change over time
}

export interface CompetitorAnalysis {
  developerId: string
  companyName: string
  marketShare: number
  averagePricePerM2: number
  totalListings: number
  pricePositioning: 'premium' | 'mid-market' | 'budget'
}

export class AnalyticsService {
  /**
   * Get comprehensive price analytics for a developer
   */
  async getPriceAnalytics(developerId: string, timeframe: '30d' | '90d' | '12m' = '30d'): Promise<PriceAnalytics> {
    const days = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365

    // Current period data
    const { data: currentProperties } = await createAdminClient()
      .from('properties')
      .select(`
        *,
        projects!inner(developer_id)
      `)
      .eq('projects.developer_id', developerId)
      .gte('created_at', subDays(new Date(), days).toISOString())

    // Previous period for comparison
    const { data: previousProperties } = await createAdminClient()
      .from('properties')
      .select(`
        *,
        projects!inner(developer_id)
      `)
      .eq('projects.developer_id', developerId)
      .gte('created_at', subDays(new Date(), days * 2).toISOString())
      .lt('created_at', subDays(new Date(), days).toISOString())

    const currentPrices = currentProperties?.map(p => p.price_per_m2).filter(Boolean) || []
    const previousPrices = previousProperties?.map(p => p.price_per_m2).filter(Boolean) || []

    const averagePricePerM2 = currentPrices.length > 0 
      ? currentPrices.reduce((sum, price) => sum + price, 0) / currentPrices.length 
      : 0

    const medianPricePerM2 = currentPrices.length > 0
      ? this.calculateMedian(currentPrices)
      : 0

    const previousAverage = previousPrices.length > 0
      ? previousPrices.reduce((sum, price) => sum + price, 0) / previousPrices.length
      : 0

    const priceChange30Days = previousAverage > 0 
      ? ((averagePricePerM2 - previousAverage) / previousAverage) * 100
      : 0

    const totalProperties = currentProperties?.length || 0
    const soldProperties = currentProperties?.filter(p => p.status === 'sold').length || 0
    const availableProperties = currentProperties?.filter(p => p.status === 'available').length || 0

    return {
      averagePricePerM2,
      medianPricePerM2,
      priceChange30Days,
      priceChangePrevMonth: priceChange30Days, // Simplified for now
      totalProperties,
      soldProperties,
      availableProperties,
      averageDaysOnMarket: 45 // Mock data - would calculate from actual sales data
    }
  }

  /**
   * Get market trends over time
   */
  async getMarketTrends(developerId: string, timeframe: '3m' | '6m' | '12m' = '6m'): Promise<MarketTrend[]> {
    const months = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : 12
    const startDate = subDays(new Date(), months * 30)

    const { data: properties } = await createAdminClient()
      .from('properties')
      .select(`
        *,
        projects!inner(developer_id)
      `)
      .eq('projects.developer_id', developerId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (!properties || properties.length === 0) {
      return []
    }

    // Group by month
    const monthlyData = new Map<string, {
      prices: number[]
      totalCount: number
      soldCount: number
    }>()

    properties.forEach(property => {
      const monthKey = format(new Date(property.created_at), 'yyyy-MM', { locale: pl })
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          prices: [],
          totalCount: 0,
          soldCount: 0
        })
      }

      const monthData = monthlyData.get(monthKey)!
      if (property.price_per_m2) {
        monthData.prices.push(property.price_per_m2)
      }
      monthData.totalCount++
      if (property.status === 'sold') {
        monthData.soldCount++
      }
    })

    return Array.from(monthlyData.entries()).map(([monthKey, data]) => ({
      date: monthKey,
      averagePrice: data.prices.length > 0 
        ? data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length 
        : 0,
      medianPrice: data.prices.length > 0 ? this.calculateMedian(data.prices) : 0,
      totalListings: data.totalCount,
      soldCount: data.soldCount
    }))
  }

  /**
   * Get property type breakdown
   */
  async getPropertyTypeBreakdown(developerId: string): Promise<PropertyTypeBreakdown[]> {
    const { data: properties } = await createAdminClient()
      .from('properties')
      .select(`
        property_type,
        price_per_m2,
        projects!inner(developer_id)
      `)
      .eq('projects.developer_id', developerId)
      .eq('status', 'available')

    if (!properties || properties.length === 0) {
      return []
    }

    const typeMap = new Map<string, {
      count: number
      prices: number[]
    }>()

    properties.forEach(property => {
      const type = property.property_type || 'Inne'
      
      if (!typeMap.has(type)) {
        typeMap.set(type, { count: 0, prices: [] })
      }

      const typeData = typeMap.get(type)!
      typeData.count++
      if (property.price_per_m2) {
        typeData.prices.push(property.price_per_m2)
      }
    })

    const _totalCount = properties.length

    return Array.from(typeMap.entries()).map(([propertyType, data]) => ({
      propertyType,
      count: data.count,
      averagePrice: data.prices.length > 0 
        ? data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length 
        : 0,
      medianPrice: data.prices.length > 0 ? this.calculateMedian(data.prices) : 0,
      percentage: (data.count / _totalCount) * 100
    }))
  }

  /**
   * Get project performance analysis
   */
  async getProjectPerformance(developerId: string): Promise<ProjectPerformance[]> {
    const { data: projects } = await createAdminClient()
      .from('projects')
      .select(`
        *,
        properties(*)
      `)
      .eq('developer_id', developerId)

    if (!projects || projects.length === 0) {
      return []
    }

    return projects.map(project => {
      interface ProjectWithProperties {
        properties?: Array<{ status?: string; price_per_m2?: number }>;
      }
      const projectData = project as ProjectWithProperties
      const properties = projectData.properties || []
      const soldProperties = properties.filter(p => p.status === 'sold')
      const prices = properties
        .map(p => p.price_per_m2)
        .filter((price): price is number => typeof price === 'number')

      const averagePrice = prices.length > 0 
        ? prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length 
        : 0

      const medianPrice = prices.length > 0 ? this.calculateMedian(prices) : 0

      // Mock sales velocity calculation (properties sold per month)
      const _salesVelocity = soldProperties.length * 2.5 // Simplified

      return {
        projectId: project.id,
        projectName: project.name,
        totalProperties: properties.length,
        soldProperties: soldProperties.length,
        averagePrice,
        medianPrice,
        salesVelocity: _salesVelocity,
        priceAppreciation: Math.random() * 10 - 5 // Mock data
      }
    })
  }

  /**
   * Get competitor analysis (simplified - in real app would use market data)
   */
  async getCompetitorAnalysis(developerId: string): Promise<CompetitorAnalysis[]> {
    // In a real implementation, this would analyze market data from multiple sources
    // For now, return mock data that shows realistic competitor landscape
    
    const { data: developer } = await createAdminClient()
      .from('developers')
      .select('company_name')
      .eq('id', developerId)
      .single()

    const mockCompetitors: CompetitorAnalysis[] = [
      {
        developerId: 'comp-1',
        companyName: 'Dom Development',
        marketShare: 15.2,
        averagePricePerM2: 12500,
        totalListings: 450,
        pricePositioning: 'premium'
      },
      {
        developerId: 'comp-2', 
        companyName: 'Robyg',
        marketShare: 12.8,
        averagePricePerM2: 10800,
        totalListings: 380,
        pricePositioning: 'mid-market'
      },
      {
        developerId: developerId,
        companyName: developer?.company_name || 'Twoja firma',
        marketShare: 8.5,
        averagePricePerM2: 11200,
        totalListings: 248,
        pricePositioning: 'mid-market'
      },
      {
        developerId: 'comp-3',
        companyName: 'Lokum Deweloper',
        marketShare: 7.1,
        averagePricePerM2: 9500,
        totalListings: 290,
        pricePositioning: 'budget'
      }
    ].sort((a, b) => b.marketShare - a.marketShare)

    return mockCompetitors
  }

  /**
   * Generate comprehensive market report
   */
  async generateMarketReport(developerId: string) {
    const [
      priceAnalytics,
      marketTrends,
      propertyBreakdown,
      projectPerformance,
      competitorAnalysis
    ] = await Promise.all([
      this.getPriceAnalytics(developerId),
      this.getMarketTrends(developerId),
      this.getPropertyTypeBreakdown(developerId),
      this.getProjectPerformance(developerId),
      this.getCompetitorAnalysis(developerId)
    ])

    return {
      generatedAt: new Date().toISOString(),
      developerId,
      priceAnalytics,
      marketTrends,
      propertyBreakdown,
      projectPerformance,
      competitorAnalysis,
      insights: this.generateInsights(priceAnalytics, marketTrends, competitorAnalysis)
    }
  }

  /**
   * Generate AI-powered insights
   */
  private generateInsights(
    priceAnalytics: PriceAnalytics,
    marketTrends: MarketTrend[],
    competitors: CompetitorAnalysis[]
  ): string[] {
    const insights: string[] = []

    // Price trend insights
    if (priceAnalytics.priceChange30Days > 5) {
      insights.push(`📈 Ceny wzrosły o ${priceAnalytics.priceChange30Days.toFixed(1)}% w ciągu ostatnich 30 dni - to silny trend wzrostowy`)
    } else if (priceAnalytics.priceChange30Days < -5) {
      insights.push(`📉 Ceny spadły o ${Math.abs(priceAnalytics.priceChange30Days).toFixed(1)}% w ciągu ostatnich 30 dni - rozważ dostosowanie strategii cenowej`)
    }

    // Sales performance insights
    const salesRate = (priceAnalytics.soldProperties / priceAnalytics.totalProperties) * 100
    if (salesRate > 70) {
      insights.push(`🔥 Wysoka sprzedaż - ${salesRate.toFixed(1)}% nieruchomości sprzedanych. Rozważ podniesienie cen`)
    } else if (salesRate < 30) {
      insights.push(`⚠️ Niska sprzedaż - ${salesRate.toFixed(1)}% nieruchomości sprzedanych. Przeanalizuj atrakcyjność oferty`)
    }

    // Competitive positioning
    const _userCompetitor = competitors.find(c => c.developerId !== 'comp-1' && c.developerId !== 'comp-2' && c.developerId !== 'comp-3')
    if (_userCompetitor) {
      const position = competitors.findIndex(c => c.developerId === _userCompetitor.developerId) + 1
      insights.push(`🏆 Pozycja ${position} na ${competitors.length} deweloperów w regionie z ${_userCompetitor.marketShare.toFixed(1)}% udziału w rynku`)
    }

    return insights
  }

  /**
   * Helper method to calculate median
   */
  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    
    return sorted.length % 2 !== 0 
      ? sorted[mid] 
      : (sorted[mid - 1] + sorted[mid]) / 2
  }
}

export const analyticsService = new AnalyticsService()