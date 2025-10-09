'use client'

/**
 * Trial Expired Page - Task #49, Subtask 49.3
 * Shown when user's 14-day trial period has ended
 *
 * Features:
 * - Shows trial accomplishments (properties count, projects)
 * - Displays pricing cards for upgrade options
 * - Conversion-focused messaging in Polish
 * - Clear CTAs to Stripe checkout
 */

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PricingSection from '@/components/PricingSection'

interface TrialStats {
  propertiesCount: number
  projectsCount: number
  daysUsed: number
  uploadsCount: number
}

export default function TrialExpiredPage() {
  const router = useRouter()
  const [stats, setStats] = useState<TrialStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch user's trial stats
        const response = await fetch('/api/user/trial-stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch trial stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <span className="text-xl font-bold text-gray-900">OTO-RAPORT</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Wróć do Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Twój 14-dniowy okres próbny wygasł
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Dziękujemy za przetestowanie OTO-RAPORT! Aby kontynuować automatyzację raportowania
            dla Ministerstwa, wybierz plan dopasowany do Twojego biznesu.
          </p>

          {/* Trial Accomplishments */}
          {!isLoading && stats && (
            <Card className="max-w-4xl mx-auto mb-12 bg-white/80 backdrop-blur-sm border-2 border-blue-200 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl text-gray-900">
                  Twoje osiągnięcia podczas okresu próbnego
                </CardTitle>
                <CardDescription>
                  Zobacz co udało Ci się zrobić w ciągu ostatnich {stats.daysUsed} dni
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {stats.propertiesCount}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {stats.propertiesCount === 1 ? 'Mieszkanie' : stats.propertiesCount < 5 ? 'Mieszkania' : 'Mieszkań'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">dodanych do systemu</div>
                  </div>

                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {stats.projectsCount}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {stats.projectsCount === 1 ? 'Projekt' : stats.projectsCount < 5 ? 'Projekty' : 'Projektów'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">zarządzanych inwestycji</div>
                  </div>

                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {stats.uploadsCount}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {stats.uploadsCount === 1 ? 'Upload' : stats.uploadsCount < 5 ? 'Uploady' : 'Uploadów'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">plików z danymi</div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Wszystkie Twoje dane są bezpieczne
                      </p>
                      <p className="text-xs text-gray-600">
                        Po wybraniu planu otrzymasz natychmiastowy dostęp do wszystkich swoich mieszkań,
                        projektów i historii zmian. Nic nie zostało utracone!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Kontynuuj z OTO-RAPORT
            </h2>
            <p className="text-gray-600 mb-6">
              Wybierz plan, który pasuje do rozmiaru Twojego biznesu. Możesz zmienić plan w każdej chwili.
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <PricingSection />

        {/* Benefits Reminder */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Dlaczego warto kontynuować?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">100% zgodność z ustawą</h4>
                  <p className="text-sm text-gray-600">
                    Automatyczne generowanie raportów XML, CSV i MD5 zgodnie z wymogami Ministerstwa
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Codzienne aktualizacje</h4>
                  <p className="text-sm text-gray-600">
                    System automatycznie publikuje zmiany cen na dane.gov.pl
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Historia cen i analytics</h4>
                  <p className="text-sm text-gray-600">
                    Pełna historia zmian cen z wykresami i raportami (Pro/Enterprise)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Wsparcie techniczne</h4>
                  <p className="text-sm text-gray-600">
                    Pomoc techniczna email (24h) lub priorytetowa (2h dla Enterprise)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Masz pytania lub potrzebujesz pomocy przy wyborze planu?
          </p>
          <Link href="/contact">
            <Button variant="outline" size="lg">
              Skontaktuj się z nami
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
