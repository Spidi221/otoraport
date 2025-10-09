'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Building2, CheckCircle, TrendingUp, TrendingDown, DollarSign, Home } from 'lucide-react'
import { Skeleton } from '@/components/ui/loading'

interface StatValue {
  value: number
  trend: number
  label: string
}

interface DashboardStats {
  totalProperties: StatValue
  availableProperties: StatValue
  soldThisMonth: StatValue
  avgPricePerM2: StatValue
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  trend: number
  format?: 'number' | 'currency'
  loading?: boolean
}

function StatCard({ icon, label, value, trend, format = 'number', loading }: StatCardProps) {
  const formattedValue = format === 'currency'
    ? `${value.toLocaleString('pl-PL')} zł`
    : value.toLocaleString('pl-PL')

  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : null

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-foreground mb-1">
            {formattedValue}
          </p>
          {trend !== 0 && (
            <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
              {TrendIcon && <TrendIcon className="h-3 w-3" />}
              <span>{Math.abs(trend).toFixed(1)}%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className="rounded-full bg-primary/10 p-3">
          {icon}
        </div>
      </div>
    </Card>
  )
}

export function StatisticsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/dashboard/stats')

        if (!response.ok) {
          throw new Error('Failed to fetch statistics')
        }

        const data = await response.json()
        setStats(data.stats)
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
        setError('Failed to load statistics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (error) {
    return (
      <div className="mb-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">
            ⚠️ {error}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="h-6 w-6 text-primary" />}
          label={stats?.totalProperties.label || 'Wszystkie nieruchomości'}
          value={stats?.totalProperties.value || 0}
          trend={stats?.totalProperties.trend || 0}
          loading={isLoading}
        />
        <StatCard
          icon={<Home className="h-6 w-6 text-green-600" />}
          label={stats?.availableProperties.label || 'Dostępne'}
          value={stats?.availableProperties.value || 0}
          trend={stats?.availableProperties.trend || 0}
          loading={isLoading}
        />
        <StatCard
          icon={<CheckCircle className="h-6 w-6 text-blue-600" />}
          label={stats?.soldThisMonth.label || 'Sprzedane w tym miesiącu'}
          value={stats?.soldThisMonth.value || 0}
          trend={stats?.soldThisMonth.trend || 0}
          loading={isLoading}
        />
        <StatCard
          icon={<DollarSign className="h-6 w-6 text-yellow-600" />}
          label={stats?.avgPricePerM2.label || 'Średnia cena za m²'}
          value={stats?.avgPricePerM2.value || 0}
          trend={stats?.avgPricePerM2.trend || 0}
          format="currency"
          loading={isLoading}
        />
      </div>
    </div>
  )
}
