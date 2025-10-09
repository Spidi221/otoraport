'use client';

/**
 * Uptime History Chart Component
 *
 * Displays 30-day uptime history for all components
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getComponentDisplayName, MONITORED_COMPONENTS } from '@/lib/health-check';

interface UptimeData {
  period: {
    days: number;
    startDate: string;
  };
  components: Record<string, Array<{
    date: string;
    uptime: number;
    totalChecks: number;
    successfulChecks: number;
    avgResponseTime: number;
  }>>;
}

export function UptimeChart() {
  const [uptimeData, setUptimeData] = useState<UptimeData | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUptimeData = async () => {
      try {
        const response = await fetch('/api/status/uptime?days=30');
        if (response.ok) {
          const data = await response.json();
          setUptimeData(data);
        }
      } catch (error) {
        console.error('Failed to fetch uptime data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUptimeData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historia Dostępności (30 dni)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            Ładowanie danych historycznych...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!uptimeData || Object.keys(uptimeData.components).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historia Dostępności (30 dni)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            Brak danych historycznych. Dane będą dostępne po pierwszym pełnym dniu monitorowania.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const componentKeys = Object.keys(uptimeData.components);
  const allDates = new Set<string>();
  componentKeys.forEach(component => {
    uptimeData.components[component].forEach(day => {
      allDates.add(day.date);
    });
  });

  const chartData = Array.from(allDates)
    .sort()
    .map(date => {
      const dataPoint: any = { date: new Date(date).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }) };

      if (selectedComponent === 'all') {
        // Average uptime across all components
        let totalUptime = 0;
        let componentCount = 0;
        componentKeys.forEach(component => {
          const dayData = uptimeData.components[component].find(d => d.date === date);
          if (dayData) {
            totalUptime += dayData.uptime;
            componentCount++;
          }
        });
        dataPoint.uptime = componentCount > 0 ? totalUptime / componentCount : 0;
      } else {
        const dayData = uptimeData.components[selectedComponent]?.find(d => d.date === date);
        dataPoint.uptime = dayData?.uptime || 0;
      }

      return dataPoint;
    });

  // Calculate average uptime
  const avgUptime = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + d.uptime, 0) / chartData.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Historia Dostępności (30 dni)</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Średnia dostępność: <span className="font-bold">{avgUptime.toFixed(2)}%</span>
            </p>
          </div>
          <Select value={selectedComponent} onValueChange={setSelectedComponent}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie komponenty (średnia)</SelectItem>
              {componentKeys.map(component => (
                <SelectItem key={component} value={component}>
                  {getComponentDisplayName(component)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)}%`, 'Dostępność']}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Bar
              dataKey="uptime"
              fill="#10b981"
              name="Dostępność"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
