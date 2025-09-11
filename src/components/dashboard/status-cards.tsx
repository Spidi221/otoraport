'use client'

import { useEffect, useState } from "react";
import { RefreshCw, Shield, Building, Activity, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

interface DashboardStats {
  projects: { total: number }
  properties: { total: number, recent: number }
  compliance: { isCompliant: boolean, xmlUrl: string | null, mdUrl: string | null }
  subscription: { plan: string, status: string, isActive: boolean }
}

export function StatusCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const result = await response.json()
          setStats(result.data)
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="relative aspect-square flex flex-col animate-pulse">
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </CardContent>
          </Card>
        ))}
      </>
    )
  }

  const compliancePercent = stats?.compliance.isCompliant ? 100 : 0
  const propertiesCount = stats?.properties.total || 0
  const projectsCount = stats?.projects.total || 0

  return (
    <>
      {/* Sync Status */}
      <Card className="relative aspect-square flex flex-col">
        <CardHeader className="flex-none pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <RefreshCw className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-800 leading-tight">
              Synchronizacja
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-between pt-0 pb-4">
          <div className="flex-1 flex flex-col justify-center space-y-3">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-gray-900 leading-none">
                {stats?.compliance.isCompliant ? 'Aktywna' : 'Nieaktywna'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Ostatnia: dziś 08:30</span>
                </div>
                <div className="text-sm text-gray-500">
                  Następna: jutro 08:00
                </div>
              </div>
            </div>
          </div>
            
          <div className="flex-none pt-3 border-t border-gray-100">
            <Badge 
              variant="outline" 
              className={`w-full justify-center py-2 font-medium text-sm ${
                stats?.compliance.isCompliant 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {stats?.compliance.isCompliant ? (
                <><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Synchronizacja OK</>
              ) : (
                <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" />Wymaga danych</>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card className="relative aspect-square flex flex-col">
        <CardHeader className="flex-none pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Shield className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-800 leading-tight">
              Zgodność
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-between pt-0 pb-4">
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-gray-900 leading-none">
                {compliancePercent}<span className="text-xl text-gray-500 font-medium">%</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed px-1">
                {stats?.compliance.isCompliant 
                  ? "Wszystkie raporty wysłane\nw wyznaczonym terminie"
                  : "Wymagane wgranie danych\nnieruchomości"
                }
              </p>
            </div>
          </div>
            
          <div className="flex-none pt-3 border-t border-gray-100">
            <Badge 
              variant="outline" 
              className={`w-full justify-center py-2 font-medium text-sm ${
                stats?.compliance.isCompliant
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {stats?.compliance.isCompliant ? (
                <><CheckCircle className="h-3.5 w-3.5 mr-1.5" />W pełni zgodne</>
              ) : (
                <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" />Brak compliance</>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Properties Count */}
      <Card className="relative aspect-square flex flex-col">
        <CardHeader className="flex-none pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Building className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-800 leading-tight">
              Nieruchomości
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-between pt-0 pb-4">
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-gray-900 leading-none">
                {propertiesCount}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed px-1">
                W {projectsCount} aktywn{projectsCount === 1 ? 'ym' : projectsCount < 5 ? 'ych' : 'ych'} projekt{projectsCount === 1 ? 'cie' : 'ach'}<br />
                dewelopersk{projectsCount === 1 ? 'im' : 'ich'}
              </p>
            </div>
          </div>
            
          <div className="flex-none pt-3 border-t border-gray-100">
            <Badge 
              variant="outline" 
              className="w-full justify-center py-2 bg-blue-50 text-blue-700 border-blue-200 font-medium text-sm"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Dane aktualne
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card className="relative aspect-square flex flex-col">
        <CardHeader className="flex-none pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Activity className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-800 leading-tight">
              Subskrypcja
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-between pt-0 pb-4">
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-gray-900 leading-none capitalize">
                {stats?.subscription.plan || 'Trial'}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed px-1">
                {stats?.subscription.status === 'trial' 
                  ? "Okres próbny\n14 dni bezpłatnie"
                  : stats?.subscription.status === 'active'
                  ? "Subskrypcja aktywna\nPełny dostęp" 
                  : "Status nieaktywny\nSprawdź płatność"
                }
              </p>
            </div>
          </div>
            
          <div className="flex-none pt-3 border-t border-gray-100">
            <Badge 
              variant="outline" 
              className={`w-full justify-center py-2 font-medium text-sm ${
                stats?.subscription.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {stats?.subscription.isActive ? (
                <><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Aktywna</>
              ) : (
                <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" />Nieaktywna</>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
}