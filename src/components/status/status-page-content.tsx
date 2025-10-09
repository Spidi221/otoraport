'use client';

/**
 * Status Page Content Component
 *
 * Displays system health, uptime history, and incidents
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UptimeChart } from '@/components/status/uptime-chart';
import { IncidentsList } from '@/components/status/incidents-list';
import {
  getComponentDisplayName,
  getStatusDisplayInfo,
  type ComponentStatus,
} from '@/lib/health-check';

interface HealthCheckData {
  component: string;
  status: ComponentStatus;
  responseTimeMs: number;
  errorMessage?: string;
}

interface HealthData {
  overall: ComponentStatus;
  components: Record<string, HealthCheckData>;
  timestamp: string;
}

export function StatusPageContent() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/status/health');
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const overallStatusInfo = healthData
    ? getStatusDisplayInfo(healthData.overall)
    : null;

  const OverallStatusIcon = healthData
    ? healthData.overall === 'operational'
      ? CheckCircle2
      : healthData.overall === 'degraded'
      ? AlertTriangle
      : XCircle
    : Activity;

  return (
    <div className="space-y-8">
      {/* Overall Status Banner */}
      <Card className={overallStatusInfo ? overallStatusInfo.bgColor : 'bg-gray-100'}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <OverallStatusIcon
                className={`h-12 w-12 ${overallStatusInfo?.color || 'text-gray-600'}`}
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {loading
                    ? 'Ładowanie...'
                    : overallStatusInfo
                    ? overallStatusInfo.label
                    : 'Brak danych'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {loading
                    ? 'Sprawdzanie statusu systemu...'
                    : healthData?.overall === 'operational'
                    ? 'Wszystkie systemy działają prawidłowo'
                    : healthData?.overall === 'degraded'
                    ? 'Niektóre systemy działają z obniżoną wydajnością'
                    : 'Wykryto problemy z dostępnością'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchHealthData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Odśwież
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Components Status */}
      <Card>
        <CardHeader>
          <CardTitle>Komponenty Systemu</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Ładowanie statusu komponentów...
            </div>
          ) : !healthData || Object.keys(healthData.components).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Brak danych o komponentach
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(healthData.components).map((component) => {
                const statusInfo = getStatusDisplayInfo(component.status);
                const StatusIcon =
                  component.status === 'operational'
                    ? CheckCircle2
                    : component.status === 'degraded'
                    ? AlertTriangle
                    : XCircle;

                return (
                  <div
                    key={component.component}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                      <div>
                        <div className="font-medium text-gray-900">
                          {getComponentDisplayName(component.component)}
                        </div>
                        {component.errorMessage && (
                          <div className="text-sm text-red-600 mt-1">
                            {component.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {component.responseTimeMs}ms
                        </div>
                      </div>
                      <Badge variant="outline" className={statusInfo.bgColor}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uptime History */}
      <UptimeChart />

      {/* Recent Incidents */}
      <IncidentsList />

      {/* Info Footer */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          Status systemu jest automatycznie aktualizowany co 30 sekund. Wszystkie czasy są
          wyświetlane w strefie czasowej Polska (UTC+1/+2). W przypadku pytań lub problemów,
          skontaktuj się z naszym zespołem supportu: support@otoraport.pl
        </AlertDescription>
      </Alert>
    </div>
  );
}
