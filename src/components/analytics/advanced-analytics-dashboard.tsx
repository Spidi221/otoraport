'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, FileText, FileSpreadsheet, Calendar, Filter, MapPin, Home, AlertCircle } from 'lucide-react'
import { KPICards, type KPIData } from './kpi-cards'
import {
  PriceTrendChart,
  DaysToSellChart,
  PropertyStatusChart,
  CumulativeSalesChart,
  MarketComparisonChart,
  OccupancyRateCard,
} from './charts'
import { exportAnalyticsToPDF, exportAnalyticsToExcel } from '@/lib/export-analytics'

// Analytics API response types
interface AnalyticsData {
  kpi: {
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
  priceTrends: Array<{ month: string; avgPrice: number; avgPricePerM2: number }>
  daysToSell: Array<{ range: string; count: number }>
  propertyStatus: Array<{ status: string; count: number; percentage: number }>
  cumulativeSales: Array<{ month: string; cumulative: number; monthly: number }>
  marketComparison: Array<{ category: string; myPrice: number; marketAvg: number }>
  metadata: {
    totalProperties: number
    dateRange: string
    propertyType: string
    location: string
    generatedAt: string
    developerName: string
  }
}

interface AdvancedAnalyticsDashboardProps {
  isEnterprise: boolean
}

export function AdvancedAnalyticsDashboard({ isEnterprise }: AdvancedAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState('6m')
  const [propertyType, setPropertyType] = useState('all')
  const [location, setLocation] = useState('all')
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch analytics data from API
  useEffect(() => {
    if (!isEnterprise) {
      setIsLoading(false)
      return
    }

    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          dateRange,
          propertyType,
          location,
        })

        const response = await fetch(`/api/analytics/enterprise?${params}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Nie udało się pobrać danych analitycznych')
        }

        const data: AnalyticsData = await response.json()
        setAnalyticsData(data)
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError(err instanceof Error ? err.message : 'Wystąpił błąd')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [isEnterprise, dateRange, propertyType, location])

  // Transform API data to KPI format
  const kpiData: KPIData[] = analyticsData ? [
    {
      label: 'Średnia cena',
      value: analyticsData.kpi.averagePrice,
      trend: analyticsData.kpi.trends.averagePrice,
      trendLabel: 'vs poprzedni okres',
      icon: 'dollar',
      format: 'currency',
    },
    {
      label: 'Wskaźnik zajętości',
      value: analyticsData.kpi.occupancyRate,
      trend: analyticsData.kpi.trends.occupancyRate,
      trendLabel: 'vs poprzedni okres',
      icon: 'target',
      format: 'percentage',
    },
    {
      label: 'Średni czas sprzedaży',
      value: analyticsData.kpi.avgDaysToSell,
      trend: analyticsData.kpi.trends.avgDaysToSell,
      trendLabel: 'vs poprzedni okres',
      icon: 'clock',
      format: 'days',
    },
    {
      label: 'Cena za m²',
      value: analyticsData.kpi.pricePerM2,
      trend: analyticsData.kpi.trends.pricePerM2,
      trendLabel: 'vs poprzedni okres',
      icon: 'building',
      format: 'currency',
    },
  ] : []

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!analyticsData) {
      console.error('No analytics data available for export')
      return
    }

    try {
      setIsExporting(format)

      // Get developer name from metadata or use default
      const developerName = analyticsData.metadata?.developerName || 'Developer'

      if (format === 'pdf') {
        await exportAnalyticsToPDF(analyticsData, developerName)
      } else {
        exportAnalyticsToExcel(analyticsData, developerName)
      }

      console.log(`✅ Successfully exported analytics to ${format.toUpperCase()}`)
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error)
      alert(`Nie udało się wyeksportować raportu do ${format.toUpperCase()}. Spróbuj ponownie.`)
    } finally {
      setIsExporting(null)
    }
  }

  const handleApplyFilters = () => {
    // Filters are automatically applied via useEffect
    console.log('Filters applied:', { dateRange, propertyType, location })
  }

  // Show upgrade prompt for non-Enterprise users
  if (!isEnterprise) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-2 border-blue-200 shadow-xl">
          <CardContent className="p-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-6">
                <FileText className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Zaawansowana Analityka
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Zaawansowana analityka jest dostępna tylko dla planu <span className="font-semibold text-blue-600">Enterprise</span>.
              <br />
              Upgrade aby uzyskać dostęp do szczegółowych raportów, porównań rynkowych i eksportu danych.
            </p>
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">
                Co zyskujesz w planie Enterprise:
              </h3>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Szczegółowe wykresy trendów cenowych
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Analiza wskaźników sprzedaży i zajętości
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Porównanie z rynkiem konkurencji
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Eksport raportów do PDF i Excel
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Zaawansowane filtry czasowe i lokalizacyjne
                </li>
              </ul>
            </div>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              Przejdź na Plan Enterprise
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters and Export */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Zaawansowana Analityka
            </h1>
            <p className="text-gray-600 text-sm">
              Szczegółowe raporty i analizy rynkowe dla Twoich nieruchomości
            </p>
            <Badge variant="default" className="mt-2 bg-blue-600">
              Plan Enterprise
            </Badge>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              disabled={isExporting === 'pdf'}
              className="border-gray-300"
            >
              {isExporting === 'pdf' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Generowanie...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Eksport PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={isExporting === 'excel'}
              className="border-gray-300"
            >
              {isExporting === 'excel' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Generowanie...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Eksport Excel
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Zakres dat
            </label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Ostatni miesiąc</SelectItem>
                <SelectItem value="3m">Ostatnie 3 miesiące</SelectItem>
                <SelectItem value="6m">Ostatnie 6 miesięcy</SelectItem>
                <SelectItem value="12m">Ostatni rok</SelectItem>
                <SelectItem value="all">Cały okres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center">
              <Home className="h-3.5 w-3.5 mr-1.5" />
              Typ nieruchomości
            </label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie typy</SelectItem>
                <SelectItem value="apartment">Mieszkania</SelectItem>
                <SelectItem value="house">Domy</SelectItem>
                <SelectItem value="commercial">Lokale komercyjne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              Lokalizacja
            </label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie lokalizacje</SelectItem>
                <SelectItem value="warsaw">Warszawa</SelectItem>
                <SelectItem value="krakow">Kraków</SelectItem>
                <SelectItem value="wroclaw">Wrocław</SelectItem>
                <SelectItem value="gdansk">Gdańsk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={handleApplyFilters}
              disabled={isLoading}
            >
              <Filter className="h-4 w-4 mr-2" />
              Zastosuj filtry
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Błąd ładowania danych</h3>
                <p className="text-sm text-red-700">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Odśwież stronę
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <>
          <KPICards
            data={[
              { label: '', value: 0, icon: 'dollar', format: 'currency' },
              { label: '', value: 0, icon: 'target', format: 'percentage' },
              { label: '', value: 0, icon: 'clock', format: 'days' },
              { label: '', value: 0, icon: 'building', format: 'currency' },
            ]}
            loading={true}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2"><CardContent className="p-6 h-96 flex items-center justify-center"><div className="animate-pulse text-gray-400">Ładowanie wykresów...</div></CardContent></Card>
            <Card><CardContent className="p-6 h-80 flex items-center justify-center"><div className="animate-pulse text-gray-400">Ładowanie...</div></CardContent></Card>
            <Card><CardContent className="p-6 h-80 flex items-center justify-center"><div className="animate-pulse text-gray-400">Ładowanie...</div></CardContent></Card>
          </div>
        </>
      )}

      {/* Data Display */}
      {!isLoading && !error && analyticsData && (
        <>
          {/* KPI Cards */}
          <KPICards data={kpiData} />

          {/* No Data Warning */}
          {analyticsData.metadata.totalProperties === 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">Brak danych do wyświetlenia</h3>
                    <p className="text-sm text-yellow-700">
                      Nie znaleziono nieruchomości pasujących do wybranych filtrów.
                      Spróbuj zmienić zakres dat lub filtry.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts Grid - Two Columns */}
          {analyticsData.metadata.totalProperties > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Price Trends */}
              <div className="lg:col-span-2">
                <PriceTrendChart data={analyticsData.priceTrends} />
              </div>

              {/* Days to Sell */}
              <DaysToSellChart data={analyticsData.daysToSell} />

              {/* Property Status */}
              <PropertyStatusChart data={analyticsData.propertyStatus} />

              {/* Cumulative Sales */}
              <CumulativeSalesChart data={analyticsData.cumulativeSales} />

              {/* Occupancy Rate */}
              <OccupancyRateCard occupancyRate={analyticsData.kpi.occupancyRate} />

              {/* Market Comparison */}
              <div className="lg:col-span-2">
                <MarketComparisonChart data={analyticsData.marketComparison} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer Info */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-200 p-2 mt-0.5">
              <Download className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Eksport raportów
              </h3>
              <p className="text-sm text-gray-700">
                Raporty zawierają pełną analizę rynku, trendy cen, wskaźniki sprzedaży i porównanie z konkurencją.
                Eksportuj dane do PDF dla prezentacji lub Excel dla dalszej analizy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
