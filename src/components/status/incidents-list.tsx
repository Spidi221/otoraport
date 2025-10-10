'use client';

/**
 * Incidents List Component
 *
 * Displays recent incidents with their status and resolution timeline
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, Search } from 'lucide-react';
import { getComponentDisplayName } from '@/lib/health-check-utils';

interface Incident {
  id: string;
  title: string;
  description: string | null;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  affected_components: string[];
  started_at: string;
  resolved_at: string | null;
  updates: Array<{
    timestamp: string;
    message: string;
  }>;
}

const statusInfo = {
  investigating: {
    label: 'Badanie',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Search,
  },
  identified: {
    label: 'Zidentyfikowano',
    color: 'bg-orange-100 text-orange-800',
    icon: AlertCircle,
  },
  monitoring: {
    label: 'Monitorowanie',
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
  },
  resolved: {
    label: 'Rozwiązano',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
  },
};

const severityInfo = {
  minor: {
    label: 'Mniejszy',
    color: 'bg-blue-100 text-blue-800',
  },
  major: {
    label: 'Poważny',
    color: 'bg-orange-100 text-orange-800',
  },
  critical: {
    label: 'Krytyczny',
    color: 'bg-red-100 text-red-800',
  },
};

export function IncidentsList() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch('/api/status/incidents?limit=10');
        if (response.ok) {
          const data = await response.json();
          setIncidents(data.incidents);
        }
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historia Incydentów</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Ładowanie historii incydentów...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (incidents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historia Incydentów</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Brak zarejestrowanych incydentów</p>
            <p className="text-sm text-gray-500 mt-2">
              System działa bez zakłóceń
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historia Incydentów</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {incidents.map((incident) => {
            const status = statusInfo[incident.status];
            const severity = severityInfo[incident.severity];
            const StatusIcon = status.icon;

            return (
              <div key={incident.id} className="border rounded-lg p-6 hover:bg-gray-50 transition">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusIcon className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                    </div>
                    {incident.description && (
                      <p className="text-gray-600 text-sm ml-8">{incident.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge className={severity.color}>{severity.label}</Badge>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </div>

                {/* Affected Components */}
                <div className="ml-8 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Dotknięte komponenty:</p>
                  <div className="flex flex-wrap gap-2">
                    {incident.affected_components.map((component) => (
                      <Badge key={component} variant="outline">
                        {getComponentDisplayName(component)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="ml-8 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      Rozpoczęto:{' '}
                      {new Date(incident.started_at).toLocaleString('pl-PL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {incident.resolved_at && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        Rozwiązano:{' '}
                        {new Date(incident.resolved_at).toLocaleString('pl-PL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Updates */}
                {incident.updates && incident.updates.length > 0 && (
                  <div className="ml-8 mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-3">Aktualizacje:</p>
                    <div className="space-y-3">
                      {incident.updates.map((update, index) => (
                        <div key={index} className="text-sm">
                          <span className="text-gray-500">
                            {new Date(update.timestamp).toLocaleString('pl-PL', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <p className="text-gray-700 mt-1">{update.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
