'use client';

import { TrendingUp, DollarSign, Users, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface RevenueData {
  currentMRR: number;
  previousMRR: number;
  arr: number;
  activeSubscriptions: number;
  previousActiveSubscriptions: number;
  churnRate: number;
  mrrTrend: Array<{ month: string; revenue: number }>;
  revenueByPlan: Array<{ plan: string; revenue: number }>;
}

interface RevenueDashboardProps {
  data: RevenueData;
}

export function RevenueDashboard({ data }: RevenueDashboardProps) {
  const mrrChange = data.currentMRR - data.previousMRR;
  const mrrChangePercent = ((mrrChange / data.previousMRR) * 100).toFixed(1);

  const subsChange = data.activeSubscriptions - data.previousActiveSubscriptions;
  const subsChangePercent = ((subsChange / data.previousActiveSubscriptions) * 100).toFixed(1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const summaryCards = [
    {
      title: 'Miesięczne Przychody (MRR)',
      value: formatCurrency(data.currentMRR),
      change: Number(mrrChangePercent),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Roczne Przychody (ARR)',
      value: formatCurrency(data.arr),
      change: Number(mrrChangePercent), // Same as MRR
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Aktywne Subskrypcje',
      value: data.activeSubscriptions.toString(),
      change: Number(subsChangePercent),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Współczynnik Rezygnacji',
      value: `${data.churnRate.toFixed(1)}%`,
      change: -data.churnRate, // Lower is better
      icon: UserMinus,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      inverted: true,
    },
  ];

  const planColors: Record<string, string> = {
    Starter: '#3b82f6',
    Pro: '#8b5cf6',
    Enterprise: '#10b981',
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.inverted ? card.change < 0 : card.change > 0;
          const changeColor = isPositive ? 'text-emerald-600' : 'text-red-600';

          return (
            <Card key={card.title} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-50`} />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold font-mono text-gray-900">
                  {card.value}
                </div>
                <p className={`text-sm font-medium mt-2 flex items-center ${changeColor}`}>
                  {isPositive ? '↑' : '↓'} {Math.abs(card.change).toFixed(1)}%
                  <span className="ml-2 text-gray-500 font-normal">vs. poprzedni miesiąc</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Trend Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Trend Przychodów Miesięcznych
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">Ostatnie 12 miesięcy</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.mrrTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'MRR']}
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  fill="url(#revenueGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Plan Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Przychody według Planu
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">Bieżący miesiąc</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByPlan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="plan"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Przychód']}
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="revenue"
                  radius={[8, 8, 0, 0]}
                  fill="#8b5cf6"
                  name="Przychód"
                >
                  {data.revenueByPlan.map((entry, index) => (
                    <Bar
                      key={`bar-${index}`}
                      dataKey="revenue"
                      fill={planColors[entry.plan] || '#6b7280'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
