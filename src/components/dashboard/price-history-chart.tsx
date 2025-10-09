'use client';

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface PriceHistoryRecord {
  id: string;
  property_id: string;
  developer_id: string;
  old_base_price: number | null;
  new_base_price: number | null;
  old_final_price: number | null;
  new_final_price: number | null;
  old_price_per_m2: number | null;
  new_price_per_m2: number | null;
  change_reason: string | null;
  changed_at: string;
  created_by: string | null;
}

interface PriceHistoryResponse {
  success: boolean;
  history: PriceHistoryRecord[];
  total: number;
  hasMore: boolean;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  basePrice: number | null;
  finalPrice: number | null;
  pricePerM2: number | null;
}

interface PriceHistoryChartProps {
  propertyId: string;
}

// SWR fetcher with error handling
const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to fetch price history');
  }
  return response.json();
};

// Format price in Polish złoty
const formatPrice = (value: number | null) => {
  if (value === null) return 'Brak danych';
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium mb-2">{payload[0].payload.displayDate}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatPrice(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PriceHistoryChart({ propertyId }: PriceHistoryChartProps) {
  const { data, error, isLoading } = useSWR<PriceHistoryResponse>(
    `/api/properties/${propertyId}/price-history?limit=50`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // Transform data for chart
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!data?.success || !data.history.length) {
      return [];
    }

    // Sort by date ascending (oldest first) for chart display
    const sortedHistory = [...data.history].sort(
      (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    );

    return sortedHistory.map((record) => ({
      date: record.changed_at,
      displayDate: format(new Date(record.changed_at), 'dd MMM yyyy, HH:mm', { locale: pl }),
      basePrice: record.new_base_price,
      finalPrice: record.new_final_price,
      pricePerM2: record.new_price_per_m2,
    }));
  }, [data]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Ładowanie historii cen...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data?.success) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="font-medium">Wystąpił błąd podczas ładowania historii cen</p>
          <p className="text-sm text-gray-500 mt-1">Spróbuj ponownie później</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!chartData.length) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="font-medium">Brak historii zmian cen</p>
          <p className="text-sm mt-1">
            Historia cen będzie dostępna po pierwszej aktualizacji cen tego mieszkania
          </p>
        </div>
      </div>
    );
  }

  // Chart state
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayDate"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="line"
            formatter={(value) => {
              const labels: Record<string, string> = {
                basePrice: 'Cena bazowa',
                finalPrice: 'Cena końcowa',
                pricePerM2: 'Cena za m²',
              };
              return labels[value] || value;
            }}
          />
          <Line
            type="monotone"
            dataKey="basePrice"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="basePrice"
          />
          <Line
            type="monotone"
            dataKey="finalPrice"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="finalPrice"
          />
          <Line
            type="monotone"
            dataKey="pricePerM2"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="pricePerM2"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
