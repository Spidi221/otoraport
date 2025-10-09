'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Building2, Target, Clock, DollarSign, Minus } from 'lucide-react'
import { Skeleton } from '@/components/ui/loading'

export interface KPIData {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon: 'building' | 'target' | 'clock' | 'dollar'
  format?: 'number' | 'currency' | 'percentage' | 'days'
}

interface KPICardsProps {
  data: KPIData[]
  loading?: boolean
}

function KPICard({ data, loading }: { data: KPIData; loading?: boolean }) {
  const iconMap = {
    building: Building2,
    target: Target,
    clock: Clock,
    dollar: DollarSign,
  }

  const Icon = iconMap[data.icon]

  const formatValue = (value: string | number, format?: string) => {
    if (typeof value === 'string') return value

    switch (format) {
      case 'currency':
        return `${value.toLocaleString('pl-PL')} zł`
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'days':
        return `${value} dni`
      default:
        return value.toLocaleString('pl-PL')
    }
  }

  const getTrendColor = (trend?: number) => {
    if (!trend) return 'text-gray-500'
    return trend > 0 ? 'text-green-600' : 'text-red-600'
  }

  const TrendIcon = !data.trend ? Minus : data.trend > 0 ? TrendingUp : TrendingDown

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-9 w-28 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-3">
              {data.label}
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatValue(data.value, data.format)}
            </p>
            {data.trend !== undefined && (
              <div className={`flex items-center gap-1.5 text-sm font-medium ${getTrendColor(data.trend)}`}>
                <TrendIcon className="h-4 w-4" />
                <span>
                  {data.trend > 0 ? '+' : ''}{data.trend.toFixed(1)}%
                </span>
                {data.trendLabel && (
                  <span className="text-gray-500 font-normal ml-1">
                    {data.trendLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-3">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function KPICards({ data, loading = false }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((kpi, index) => (
        <KPICard key={index} data={kpi} loading={loading} />
      ))}
    </div>
  )
}
