'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/loading'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Building,
  MapPin,
  DollarSign,
  Wrench,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  ChevronRight
} from 'lucide-react'
import { BulkEditDialog } from './bulk-edit-dialog'
import { useState } from 'react'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CompletionData {
  developerId: string
  companyName: string
  overallCompletion: number
  sectionCompletion: {
    basicInfo: { complete: boolean; percentage: number }
    headquarters: { complete: boolean; percentage: number }
    salesOffice: { complete: boolean; percentage: number }
    contact: { complete: boolean; percentage: number }
  }
  missingCriticalFields: string[]
  missingRecommendedFields: string[]
  nextSteps: string[]
}

interface SectionData {
  id: string
  name: string
  icon: React.ReactNode
  percentage: number
  complete: boolean
  missingFields: string[]
  color: string
}

interface EnhancedDataQualityWidgetProps {
  developerId: string
  onFieldEdit?: (fieldName: string) => void
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines color class based on completion percentage
 * Green: >=80%, Yellow: 50-79%, Red: <50%
 */
function getColorClass(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Gets text color for percentage display
 */
function getTextColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-700'
  if (percentage >= 50) return 'text-yellow-700'
  return 'text-red-700'
}

/**
 * Gets badge variant based on completion
 */
function getBadgeVariant(percentage: number): "default" | "secondary" | "destructive" {
  if (percentage >= 80) return 'default'
  if (percentage >= 50) return 'secondary'
  return 'destructive'
}

/**
 * Maps field names to human-readable labels
 */
function getFieldLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    // Basic Info
    company_name: 'Nazwa firmy',
    nip: 'NIP',
    regon: 'REGON',
    krs: 'KRS',

    // Headquarters
    headquarters_street: 'Ulica siedziby',
    headquarters_city: 'Miasto siedziby',
    headquarters_postal_code: 'Kod pocztowy siedziby',
    headquarters_province: 'Województwo siedziby',

    // Sales Office
    sales_office_street: 'Ulica biura sprzedaży',
    sales_office_city: 'Miasto biura sprzedaży',
    sales_office_postal_code: 'Kod pocztowy biura',

    // Contact
    contact_email: 'Email kontaktowy',
    contact_phone: 'Telefon kontaktowy',
    website: 'Strona WWW',
  }

  return labels[fieldName] || fieldName
}

/**
 * Determines field severity (critical/recommended)
 */
function getFieldSeverity(fieldName: string, criticalFields: string[]): 'critical' | 'recommended' {
  return criticalFields.includes(fieldName) ? 'critical' : 'recommended'
}

// ============================================================================
// DATA FETCHER
// ============================================================================

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch completion status')
  return res.json()
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnhancedDataQualityWidget({
  developerId,
  onFieldEdit
}: EnhancedDataQualityWidgetProps) {
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<string | null>(null)

  // SWR data fetching with automatic revalidation
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: CompletionData }>(
    `/api/developers/${developerId}/completion-status`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  )

  // Transform API data into sections
  const sections: SectionData[] = useMemo(() => {
    if (!data?.data) return []

    const { sectionCompletion, missingCriticalFields, missingRecommendedFields } = data.data
    const allMissing = [...missingCriticalFields, ...missingRecommendedFields]

    return [
      {
        id: 'basicInfo',
        name: 'Informacje o deweloperze',
        icon: <Building className="w-5 h-5" />,
        percentage: sectionCompletion.basicInfo.percentage,
        complete: sectionCompletion.basicInfo.complete,
        missingFields: allMissing.filter(f => ['company_name', 'nip', 'regon', 'krs'].includes(f)),
        color: getColorClass(sectionCompletion.basicInfo.percentage),
      },
      {
        id: 'headquarters',
        name: 'Lokalizacja siedziby',
        icon: <MapPin className="w-5 h-5" />,
        percentage: sectionCompletion.headquarters.percentage,
        complete: sectionCompletion.headquarters.complete,
        missingFields: allMissing.filter(f => f.startsWith('headquarters_')),
        color: getColorClass(sectionCompletion.headquarters.percentage),
      },
      {
        id: 'salesOffice',
        name: 'Biuro sprzedaży',
        icon: <DollarSign className="w-5 h-5" />,
        percentage: sectionCompletion.salesOffice.percentage,
        complete: sectionCompletion.salesOffice.complete,
        missingFields: allMissing.filter(f => f.startsWith('sales_office_')),
        color: getColorClass(sectionCompletion.salesOffice.percentage),
      },
      {
        id: 'contact',
        name: 'Dane kontaktowe',
        icon: <Wrench className="w-5 h-5" />,
        percentage: sectionCompletion.contact.percentage,
        complete: sectionCompletion.contact.complete,
        missingFields: allMissing.filter(f => ['contact_email', 'contact_phone', 'website'].includes(f)),
        color: getColorClass(sectionCompletion.contact.percentage),
      },
    ]
  }, [data])

  // Handle field click
  const handleFieldClick = (fieldName: string) => {
    setSelectedField(fieldName)
    if (onFieldEdit) {
      onFieldEdit(fieldName)
    } else {
      setBulkEditOpen(true)
    }
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <Card className="overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
        <CardHeader className="border-b bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Jakość Danych Deweloperskich
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error || !data?.success) {
    return (
      <Card className="overflow-hidden border-red-200 dark:border-red-900 shadow-sm">
        <CardHeader className="border-b bg-red-50 dark:bg-red-950/20">
          <CardTitle className="flex items-center gap-2 text-lg text-red-800 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            Błąd pobierania danych
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-red-700 dark:text-red-400">
            {error?.message || 'Nie udało się załadować statusu uzupełnienia danych'}
          </p>
          <button
            onClick={() => mutate()}
            className="mt-4 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            Spróbuj ponownie
          </button>
        </CardContent>
      </Card>
    )
  }

  const completion = data.data
  const overallColor = getColorClass(completion.overallCompletion)
  const overallText = getTextColor(completion.overallCompletion)

  // ============================================================================
  // SUCCESS STATE - MAIN UI
  // ============================================================================

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-800">
      {/* Header with gradient */}
      <CardHeader className="border-b bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Jakość Danych Deweloperskich
          </CardTitle>

          {/* Overall completion badge */}
          <Badge
            variant={getBadgeVariant(completion.overallCompletion)}
            className="text-base font-bold px-3 py-1"
          >
            {completion.overallCompletion}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ogólne uzupełnienie
            </span>
            <span className={`text-sm font-bold ${overallText}`}>
              {completion.overallCompletion}%
            </span>
          </div>

          <div className="relative">
            <Progress
              value={completion.overallCompletion}
              className="h-3 bg-gray-200 dark:bg-gray-700"
            />
            <div
              className={`absolute inset-y-0 left-0 h-3 rounded-full transition-all duration-700 ease-out ${overallColor}`}
              style={{ width: `${completion.overallCompletion}%` }}
            />
          </div>

          {/* Perfect completion message */}
          {completion.overallCompletion === 100 && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Wszystkie dane deweloperskie są kompletne!
              </p>
            </div>
          )}
        </div>

        {/* Section Progress Bars - Expandable Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-2">
          {sections.map((section, index) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  {/* Section Icon */}
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${
                    index === 0 ? 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30' :
                    index === 1 ? 'from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30' :
                    index === 2 ? 'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30' :
                    'from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30'
                  }`}>
                    {section.icon}
                  </div>

                  {/* Section Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {section.name}
                      </span>
                      {section.complete && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>

                    {/* Mini progress bar */}
                    <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${section.color}`}
                        style={{ width: `${section.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Percentage Badge */}
                  <Badge
                    variant={getBadgeVariant(section.percentage)}
                    className="ml-auto mr-2 font-semibold"
                  >
                    {section.percentage}%
                  </Badge>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-900/20">
                {section.missingFields.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                      Brakujące pola ({section.missingFields.length})
                    </p>
                    {section.missingFields.map((field) => {
                      const severity = getFieldSeverity(field, completion.missingCriticalFields)
                      return (
                        <button
                          key={field}
                          onClick={() => handleFieldClick(field)}
                          className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {getFieldLabel(field)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant={severity === 'critical' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {severity === 'critical' ? 'Krytyczne' : 'Opcjonalne'}
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                      Wszystkie dane w tej sekcji są kompletne
                    </span>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Next Steps */}
        {completion.nextSteps.length > 0 && completion.overallCompletion < 100 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Następne kroki
            </h4>
            <ul className="space-y-2">
              {completion.nextSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onSuccess={() => {
          mutate() // Refresh data after successful edit
        }}
      />
    </Card>
  )
}
