'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/loading'
import { CheckCircle, AlertCircle, AlertTriangle, Info, Edit3, ShieldCheck } from 'lucide-react'
import type { ValidationMissingFieldsResponse } from '@/lib/api-schemas'
import { BulkEditDialog } from './bulk-edit-dialog'

interface ComplianceLevel {
  label: string
  color: string
  bgColor: string
  icon: React.ReactNode
}

function getComplianceLevel(score: number): ComplianceLevel {
  if (score >= 90) {
    return {
      label: 'Doskonała zgodność',
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="h-5 w-5 text-green-600" />
    }
  }
  if (score >= 70) {
    return {
      label: 'Dobra zgodność',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-200',
      icon: <ShieldCheck className="h-5 w-5 text-blue-600" />
    }
  }
  if (score >= 50) {
    return {
      label: 'Wymaga poprawy',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 border-yellow-200',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />
    }
  }
  return {
    label: 'Krytyczne braki',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    icon: <AlertCircle className="h-5 w-5 text-red-600" />
  }
}

function getSeverityBadge(severity: 'critical' | 'warning' | 'info') {
  switch (severity) {
    case 'critical':
      return (
        <Badge variant="destructive" className="ml-auto">
          Krytyczne
        </Badge>
      )
    case 'warning':
      return (
        <Badge className="ml-auto bg-yellow-100 text-yellow-800 border-yellow-300">
          Ostrzeżenie
        </Badge>
      )
    case 'info':
      return (
        <Badge className="ml-auto bg-blue-100 text-blue-800 border-blue-300">
          Info
        </Badge>
      )
  }
}

export function DataQualityWidget() {
  const [data, setData] = useState<ValidationMissingFieldsResponse['data'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bulkEditOpen, setBulkEditOpen] = useState(false)

  const fetchValidationData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/validation/missing-fields')

      if (!response.ok) {
        throw new Error('Nie udało się pobrać danych walidacji')
      }

      const result: ValidationMissingFieldsResponse = await response.json()
      setData(result.data)
    } catch (err) {
      console.error('Error fetching validation data:', err)
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchValidationData()
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Jakość Danych Ministerialnych
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <Card className="overflow-hidden border-red-200">
        <CardHeader className="border-b bg-red-50">
          <CardTitle className="flex items-center gap-2 text-lg text-red-800">
            <AlertCircle className="h-5 w-5" />
            Błąd walidacji
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-red-700">
            {error || 'Nie udało się załadować danych walidacji'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // No properties state
  if (data.summary.totalProperties === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Jakość Danych Ministerialnych
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Brak nieruchomości do walidacji. Wgraj cennik, aby sprawdzić zgodność z wymogami ministerstwa.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const complianceLevel = getComplianceLevel(data.summary.complianceScore)
  const topMissingFields = Object.entries(data.missingFieldsSummary)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with gradient background */}
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Jakość Danych Ministerialnych
          </CardTitle>
          <div
            className="group relative cursor-help"
            title="System automatycznie sprawdza zgodność Twoich danych z wymaganiami ministerstwa (Instrukcja v1.0.5)"
          >
            <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Compliance Score Section */}
        <div className={`rounded-lg border p-4 ${complianceLevel.bgColor}`}>
          <div className="flex items-center gap-3 mb-2">
            {complianceLevel.icon}
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Wynik zgodności</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${complianceLevel.color}`}>
                  {data.summary.complianceScore}%
                </span>
                <span className={`text-sm font-medium ${complianceLevel.color}`}>
                  {complianceLevel.label}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                data.summary.complianceScore >= 90 ? 'bg-green-500' :
                data.summary.complianceScore >= 70 ? 'bg-blue-500' :
                data.summary.complianceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${data.summary.complianceScore}%` }}
            />
          </div>

          {/* Quick stats */}
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Poprawne:</p>
              <p className="font-semibold text-green-700">
                {data.summary.propertiesValid} / {data.summary.totalProperties}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Wymaga uwagi:</p>
              <p className="font-semibold text-red-700">
                {data.summary.propertiesWithIssues} / {data.summary.totalProperties}
              </p>
            </div>
          </div>
        </div>

        {/* Top Missing Fields */}
        {topMissingFields.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Najczęściej brakujące pola
            </h4>
            <div className="space-y-2">
              {topMissingFields.map(([fieldKey, fieldData]) => (
                <div
                  key={fieldKey}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {fieldData.fieldLabel}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Brakuje w {fieldData.count} {fieldData.count === 1 ? 'nieruchomości' : 'nieruchomościach'}
                      {' '}({fieldData.percentage.toFixed(1)}%)
                    </p>
                  </div>
                  {getSeverityBadge(fieldData.severity)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perfect compliance message */}
        {data.summary.complianceScore === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Wszystkie dane spełniają wymogi ministerstwa!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Twoje nieruchomości zawierają kompletne informacje zgodne z Instrukcją v1.0.5.
                  System jest gotowy do automatycznego raportowania.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="outline"
          className="w-full group hover:bg-primary hover:text-primary-foreground transition-all"
          onClick={() => setBulkEditOpen(true)}
          disabled={data.summary.propertiesWithIssues === 0}
        >
          {data.summary.propertiesWithIssues > 0 ? (
            <>
              Edycja zbiorcza brakujących pól
              <Edit3 className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Wszystkie dane kompletne
              <CheckCircle className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Bulk Edit Dialog */}
        <BulkEditDialog
          open={bulkEditOpen}
          onOpenChange={setBulkEditOpen}
          validationData={data}
          onSuccess={() => {
            // Refresh validation data after bulk edit
            fetchValidationData()
          }}
        />
      </CardContent>
    </Card>
  )
}
