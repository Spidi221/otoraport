'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PlanComparison } from '@/components/onboarding/plan-comparison'
import type { SubscriptionPlanType } from '@/lib/subscription-plans'
import { OtoRaportLogo } from '@/components/icons/oto-raport-logo'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

function SelectPlanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType | undefined>()
  const [error, setError] = useState('')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    // Show message if user canceled checkout
    if (canceled === 'true') {
      setError('Proces płatności został anulowany. Wybierz plan ponownie.')
    }
  }, [canceled])

  const handleSelectPlan = async (planType: SubscriptionPlanType) => {
    setSelectedPlan(planType)
    setIsLoading(true)
    setError('')

    try {
      // Call API to create Stripe Checkout session
      const response = await fetch('/api/stripe/create-trial-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Nie udało się utworzyć sesji płatności')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Brak URL przekierowania')
      }
    } catch (err) {
      console.error('Error creating checkout session:', err)
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas tworzenia sesji płatności')
      setIsLoading(false)
      setSelectedPlan(undefined)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <OtoRaportLogo />
          <div className="text-sm text-gray-600">
            Krok 1 z 2: Wybierz plan
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Plan Comparison */}
      <PlanComparison
        onSelectPlan={handleSelectPlan}
        isLoading={isLoading}
        selectedPlan={selectedPlan}
      />

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p className="mb-2">
            Bezpieczne płatności obsługiwane przez{' '}
            <span className="font-semibold text-gray-900">Stripe</span>
          </p>
          <p>
            Masz pytania?{' '}
            <a href="mailto:support@oto-raport.pl" className="text-blue-600 hover:text-blue-700 font-medium">
              Skontaktuj się z nami
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SelectPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ładowanie planów...</p>
          </div>
        </div>
      }
    >
      <SelectPlanContent />
    </Suspense>
  )
}
