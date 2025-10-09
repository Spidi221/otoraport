'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Chart color palette - sophisticated blues and grays
const CHART_COLORS = {
  primary: '#2563eb', // blue-600
  secondary: '#60a5fa', // blue-400
  tertiary: '#93c5fd', // blue-300
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  gray: '#6b7280', // gray-500
}

const STATUS_COLORS = {
  available: '#3b82f6', // blue-500
  reserved: '#f59e0b', // amber-500
  sold: '#10b981', // green-500
}

// Custom tooltip component for professional look
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-semibold" style={{ color: entry.color }}>
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// Price Trends Line Chart
interface PriceTrendData {
  month: string
  avgPrice: number
  avgPricePerM2: number
}

export function PriceTrendChart({ data }: { data: PriceTrendData[] }) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}k zł`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trendy Cen Nieruchomości</CardTitle>
        <CardDescription>
          Średnia cena i cena za m² w ostatnich miesiącach
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.1} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPricePerM2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.1} />
                <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Line
              type="monotone"
              dataKey="avgPrice"
              name="Średnia cena"
              stroke={CHART_COLORS.primary}
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.primary, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="avgPricePerM2"
              name="Cena za m²"
              stroke={CHART_COLORS.secondary}
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.secondary, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Days to Sell Bar Chart
interface DaysToSellData {
  range: string
  count: number
}

export function DaysToSellChart({ data }: { data: DaysToSellData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rozkład Czasu Sprzedaży</CardTitle>
        <CardDescription>
          Ilość nieruchomości według czasu sprzedaży
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.primary} />
                <stop offset="100%" stopColor={CHART_COLORS.secondary} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="range"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              name="Liczba nieruchomości"
              fill="url(#barGradient)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Property Status Pie Chart
interface PropertyStatusData {
  status: string
  count: number
  percentage: number
}

export function PropertyStatusChart({ data }: { data: PropertyStatusData[] }) {
  const getColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('dostępn') || statusLower.includes('available')) {
      return STATUS_COLORS.available
    }
    if (statusLower.includes('rezerwacja') || statusLower.includes('reserved')) {
      return STATUS_COLORS.reserved
    }
    if (statusLower.includes('sprzeda') || statusLower.includes('sold')) {
      return STATUS_COLORS.sold
    }
    return CHART_COLORS.gray
  }

  const RADIAN = Math.PI / 180
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null // Don't show label for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Nieruchomości</CardTitle>
        <CardDescription>
          Podział według dostępności i sprzedaży
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="count"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {data.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        Liczba: <span className="font-semibold">{data.count}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Udział: <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-700">
                  {entry.payload.status} ({entry.payload.count})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Cumulative Sales Area Chart
interface CumulativeSalesData {
  month: string
  cumulative: number
  monthly: number
}

export function CumulativeSalesChart({ data }: { data: CumulativeSalesData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprzedaż Narastająco</CardTitle>
        <CardDescription>
          Łączna liczba sprzedanych nieruchomości w czasie
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Area
              type="monotone"
              dataKey="cumulative"
              name="Sprzedaż narastająco"
              stroke={CHART_COLORS.success}
              strokeWidth={2}
              fill="url(#colorCumulative)"
            />
            <Bar
              dataKey="monthly"
              name="Sprzedaż miesięczna"
              fill={CHART_COLORS.tertiary}
              radius={[4, 4, 0, 0]}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Market Comparison Chart
interface MarketComparisonData {
  category: string
  myPrice: number
  marketAvg: number
}

export function MarketComparisonChart({ data }: { data: MarketComparisonData[] }) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}k`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Porównanie z Rynkiem</CardTitle>
        <CardDescription>
          Twoje ceny vs średnia rynkowa (placeholder)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            layout="horizontal"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={formatCurrency}
            />
            <YAxis
              type="category"
              dataKey="category"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              width={100}
            />
            <Tooltip content={<CustomTooltip formatter={(val: number) => `${formatCurrency(val)} zł`} />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Bar
              dataKey="myPrice"
              name="Twoje ceny"
              fill={CHART_COLORS.primary}
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="marketAvg"
              name="Średnia rynkowa"
              fill={CHART_COLORS.gray}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Occupancy Rate Gauge (simplified as progress indicator)
export function OccupancyRateCard({ occupancyRate }: { occupancyRate: number }) {
  const getColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getTextColor = (rate: number) => {
    if (rate >= 80) return 'text-green-700'
    if (rate >= 50) return 'text-amber-700'
    return 'text-red-700'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wskaźnik Zajętości</CardTitle>
        <CardDescription>
          Procent sprzedanych nieruchomości
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 mb-4">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="#e5e7eb"
                strokeWidth="16"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke={occupancyRate >= 80 ? '#10b981' : occupancyRate >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${(occupancyRate / 100) * 502.65} 502.65`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${getTextColor(occupancyRate)}`}>
                {occupancyRate.toFixed(0)}%
              </span>
              <span className="text-sm text-gray-500 mt-1">zajętość</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full mt-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Niski</div>
              <div className="h-2 bg-red-500 rounded"></div>
              <div className="text-xs text-gray-600 mt-1">&lt;50%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Średni</div>
              <div className="h-2 bg-amber-500 rounded"></div>
              <div className="text-xs text-gray-600 mt-1">50-80%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Wysoki</div>
              <div className="h-2 bg-green-500 rounded"></div>
              <div className="text-xs text-gray-600 mt-1">&gt;80%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
