'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Download,
  Calendar,
  MapPin
} from 'lucide-react'
import { PriceAnalytics, MarketTrend, PropertyTypeBreakdown, ProjectPerformance, CompetitorAnalysis } from '@/lib/analytics'
import { toast } from 'sonner'

interface AnalyticsDashboardProps {
  developerId: string
}

export default function AnalyticsDashboard({ }: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '12m'>('30d')
  const [loading, setLoading] = useState(true)
  const [priceAnalytics, setPriceAnalytics] = useState<PriceAnalytics | null>(null)
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([])
  const [propertyBreakdown, setPropertyBreakdown] = useState<PropertyTypeBreakdown[]>([])
  const [projectPerformance, setProjectPerformance] = useState<ProjectPerformance[]>([])
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis[]>([])

  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Load all analytics data
      const [overviewRes, trendsRes, breakdownRes, projectsRes, competitorsRes] = await Promise.all([
        fetch(`/api/analytics?type=overview&timeframe=${timeframe}`),
        fetch(`/api/analytics?type=trends&timeframe=${timeframe}`),
        fetch(`/api/analytics?type=breakdown`),
        fetch(`/api/analytics?type=projects`),
        fetch(`/api/analytics?type=competitors`)
      ])

      const [overview, trends, breakdown, projects, competitors] = await Promise.all([
        overviewRes.json(),
        trendsRes.json(),
        breakdownRes.json(),
        projectsRes.json(),
        competitorsRes.json()
      ])

      if (overview.success) setPriceAnalytics(overview.data)
      if (trends.success) setMarketTrends(trends.data)
      if (breakdown.success) setPropertyBreakdown(breakdown.data)
      if (projects.success) setProjectPerformance(projects.data)
      if (competitors.success) setCompetitorAnalysis(competitors.data)

    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
    setLoading(false)
  }

  const exportReport = async (format: 'pdf' | 'excel' | 'json') => {
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, reportType: 'full' })
      })
      
      const result = await response.json()
      if (result.success) {
        // In production, would trigger download
        toast.success(`Raport ${format.toUpperCase()} zostanie wygenerowany za chwilę`)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatPercentage = (value: number, showSign: boolean = true) => {
    const sign = showSign && value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analityka i raporty</h2>
          <div className="animate-pulse bg-gray-200 rounded-md w-32 h-10"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">📊 Analityka i raporty</h2>
          <p className="text-gray-600">Zaawansowana analiza rynku i wydajności sprzedaży</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as '30d' | '90d' | '12m')}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="30d">Ostatnie 30 dni</option>
            <option value="90d">Ostatnie 90 dni</option>
            <option value="12m">Ostatnie 12 miesięcy</option>
          </select>
          
          <Button 
            variant="outline" 
            onClick={() => exportReport('pdf')}
            className="hidden sm:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Eksportuj PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {priceAnalytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Średnia cena za m²
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(priceAnalytics.averagePricePerM2)}
              </div>
              <div className="flex items-center mt-2">
                {priceAnalytics.priceChange30Days >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${
                  priceAnalytics.priceChange30Days >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(priceAnalytics.priceChange30Days)} vs poprzedni okres
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Sprzedaż
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {priceAnalytics.soldProperties}/{priceAnalytics.totalProperties}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {((priceAnalytics.soldProperties / priceAnalytics.totalProperties) * 100).toFixed(1)}% wskaźnik sprzedaży
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Dostępne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {priceAnalytics.availableProperties}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                nieruchomości w ofercie
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Średni czas sprzedaży
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {priceAnalytics.averageDaysOnMarket}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                dni na rynku
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trendy rynkowe</TabsTrigger>
          <TabsTrigger value="breakdown">Rodzaje nieruchomości</TabsTrigger>
          <TabsTrigger value="projects">Wydajność projektów</TabsTrigger>
          <TabsTrigger value="competitors">Konkurencja</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trendy cen na rynku</CardTitle>
            </CardHeader>
            <CardContent>
              {marketTrends.length > 0 ? (
                <div className="space-y-4">
                  {/* Simple trend visualization */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {marketTrends.slice(-3).map((trend) => (
                      <div key={trend.date} className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-600 mb-2">{trend.date}</div>
                        <div className="text-xl font-bold">{formatPrice(trend.averagePrice)}</div>
                        <div className="text-sm text-gray-500">{trend.totalListings} ofert</div>
                        <div className="text-sm text-green-600">{trend.soldCount} sprzedanych</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-gray-500 py-8">
                    📈 Interaktywny wykres zostanie zaimplementowany z biblioteką Chart.js
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Brak danych do analizy trendów
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rozkład typów nieruchomości</CardTitle>
            </CardHeader>
            <CardContent>
              {propertyBreakdown.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {propertyBreakdown.map((type) => (
                    <div key={type.propertyType} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{type.propertyType}</h4>
                        <Badge variant="outline">{formatPercentage(type.percentage, false)}</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ilość:</span>
                          <span className="font-medium">{type.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Średnia cena:</span>
                          <span className="font-medium">{formatPrice(type.averagePrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mediana:</span>
                          <span className="font-medium">{formatPrice(type.medianPrice)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Brak danych o typach nieruchomości
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wydajność projektów deweloperskich</CardTitle>
            </CardHeader>
            <CardContent>
              {projectPerformance.length > 0 ? (
                <div className="space-y-4">
                  {projectPerformance.map((project) => (
                    <div key={project.projectId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium">{project.projectName}</h4>
                        <Badge className="bg-blue-100 text-blue-800">
                          {project.totalProperties} lokali
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600 mb-1">Sprzedano</div>
                          <div className="text-xl font-bold text-green-600">
                            {project.soldProperties}
                          </div>
                          <div className="text-gray-500">
                            {((project.soldProperties / project.totalProperties) * 100).toFixed(1)}%
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-600 mb-1">Średnia cena</div>
                          <div className="font-bold">
                            {formatPrice(project.averagePrice)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-600 mb-1">Tempo sprzedaży</div>
                          <div className="font-bold">
                            {project.salesVelocity.toFixed(1)}
                          </div>
                          <div className="text-gray-500">lokali/miesiąc</div>
                        </div>
                        
                        <div>
                          <div className="text-gray-600 mb-1">Wzrost ceny</div>
                          <div className={`font-bold ${project.priceAppreciation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(project.priceAppreciation)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Brak danych o projektach
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analiza konkurencji</CardTitle>
            </CardHeader>
            <CardContent>
              {competitorAnalysis.length > 0 ? (
                <div className="space-y-3">
                  {competitorAnalysis.map((competitor, index) => (
                    <div 
                      key={competitor.developerId} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        competitor.developerId !== 'comp-1' && 
                        competitor.developerId !== 'comp-2' && 
                        competitor.developerId !== 'comp-3' 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border border-gray-200 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{competitor.companyName}</div>
                          <div className="text-sm text-gray-500">
                            {competitor.totalListings} ofert • {formatPrice(competitor.averagePricePerM2)}/m²
                          </div>
                        </div>
                        {competitor.developerId !== 'comp-1' && 
                         competitor.developerId !== 'comp-2' && 
                         competitor.developerId !== 'comp-3' && (
                          <Badge className="bg-blue-600 text-white ml-2">Twoja pozycja</Badge>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatPercentage(competitor.marketShare, false)}</div>
                        <Badge 
                          variant={
                            competitor.pricePositioning === 'premium' ? 'default' :
                            competitor.pricePositioning === 'mid-market' ? 'secondary' : 
                            'outline'
                          }
                          className="mt-1"
                        >
                          {competitor.pricePositioning === 'premium' ? 'Premium' :
                           competitor.pricePositioning === 'mid-market' ? 'Średnia półka' :
                           'Budżetowy'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Brak danych konkurencyjnych
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Eksport raportów</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => exportReport('pdf')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Pobierz PDF
            </Button>
            <Button onClick={() => exportReport('excel')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Eksportuj Excel
            </Button>
            <Button onClick={() => exportReport('json')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Dane JSON
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Raporty zawierają pełną analizę rynku, trendy cen, wydajność projektów i pozycję konkurencyjną.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}