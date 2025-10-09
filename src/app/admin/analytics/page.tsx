/**
 * Admin Analytics Dashboard Page
 * Task #60.2 - Build Responsive /admin/analytics Dashboard Page
 *
 * Displays comprehensive analytics including:
 * - KPI cards (MRR, ARR, users, conversions)
 * - User growth chart
 * - Revenue growth chart
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/loading'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Users, CreditCard, UserCheck, Activity } from 'lucide-react'

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

interface AnalyticsData {
  kpis: AnalyticsKPIs
  userGrowth: MonthlyData[]
  revenueGrowth: MonthlyData[]
}

/**
 * Format number as Polish currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format percentage
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Format month for display (YYYY-MM -> Sty 2025)
 */
function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']
  return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`
}

/**
 * KPI Card Component
 */
interface KPICardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: 'up' | 'down'
  subtitle?: string
  color?: string
}

function KPICard({ title, value, icon, trend, subtitle, color = 'blue' }: KPICardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend && (
              trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )
            )}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/admin/analytics')
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data')
        }
        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (err) {
        console.error('❌ Error fetching analytics:', err)
        setError('Nie udało się załadować danych analitycznych')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return <LoadingState message="Ładowanie analityki..." />
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <p className="text-sm text-red-800">{error || 'Brak danych'}</p>
      </div>
    )
  }

  const { kpis, userGrowth, revenueGrowth } = data

  // Format chart data
  const userGrowthChartData = userGrowth.map(item => ({
    month: formatMonth(item.month),
    users: item.count || 0
  }))

  const revenueGrowthChartData = revenueGrowth.map(item => ({
    month: formatMonth(item.month),
    mrr: item.mrr || 0,
    arr: item.arr || 0
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analityka i Raporty</h1>
          <p className="text-muted-foreground mt-1">
            Kompleksowe dane dotyczące przychodów, użytkowników i konwersji
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Panel Administracyjny
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Całkowita liczba użytkowników"
          value={kpis.totalUsers}
          icon={<Users className="h-5 w-5" />}
          subtitle={`${kpis.activeSubscriptions} aktywnych subskrypcji`}
          color="blue"
        />

        <KPICard
          title="MRR (Miesięczne przychody)"
          value={formatCurrency(kpis.mrr)}
          icon={<CreditCard className="h-5 w-5" />}
          subtitle={`ARR: ${formatCurrency(kpis.arr)}`}
          color="green"
          trend="up"
        />

        <KPICard
          title="Aktywne subskrypcje"
          value={kpis.activeSubscriptions}
          icon={<Activity className="h-5 w-5" />}
          subtitle={`${kpis.trialUsers} użytkowników trial`}
          color="purple"
        />

        <KPICard
          title="Konwersja trial"
          value={formatPercentage(kpis.trialConversionRate)}
          icon={<UserCheck className="h-5 w-5" />}
          subtitle={`Churn: ${formatPercentage(kpis.churnRate)}`}
          color="orange"
          trend={kpis.trialConversionRate > 50 ? 'up' : 'down'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Wzrost liczby użytkowników</CardTitle>
            <p className="text-sm text-muted-foreground">
              Miesięczne rejestracje za ostatnie 12 miesięcy
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value} użytkowników`, 'Nowi użytkownicy']}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Wzrost przychodów (MRR)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Miesięczne przychody cykliczne za ostatnie 12 miesięcy
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueGrowthChartData}>
                <defs>
                  <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value.toLocaleString('pl-PL')} zł`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'mrr') {
                      return [formatCurrency(value), 'MRR']
                    }
                    return [formatCurrency(value), 'ARR']
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorMRR)"
                  name="MRR (miesięczny)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Współczynnik rezygnacji (Churn)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatPercentage(kpis.churnRate)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {kpis.churnRate < 5
                ? 'Świetny wynik! Churn poniżej 5%'
                : kpis.churnRate < 10
                ? 'Dobry wynik, można poprawić'
                : 'Wysoki churn - wymaga uwagi'}
            </p>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  kpis.churnRate < 5
                    ? 'bg-green-500'
                    : kpis.churnRate < 10
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(kpis.churnRate * 10, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wskaźnik konwersji Trial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {formatPercentage(kpis.trialConversionRate)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {kpis.trialConversionRate > 50
                ? 'Doskonały wskaźnik konwersji!'
                : kpis.trialConversionRate > 30
                ? 'Dobry wynik, można optymalizować'
                : 'Niski wskaźnik - wymaga optymalizacji'}
            </p>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  kpis.trialConversionRate > 50
                    ? 'bg-green-500'
                    : kpis.trialConversionRate > 30
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(kpis.trialConversionRate, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ARR (Roczne przychody)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(kpis.arr)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Prognozowane roczne przychody cykliczne
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Obliczone na podstawie MRR: {formatCurrency(kpis.mrr)} × 12
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
