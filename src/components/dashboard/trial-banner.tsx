'use client'

/**
 * Trial Countdown Banner - Task #49, Subtask 49.4
 * Shows trial countdown for users on trial period
 *
 * Features:
 * - Color-coded based on days remaining (green/yellow/red)
 * - Shows days remaining and trial end date
 * - Upgrade CTA button
 * - Dismissible (localStorage, reappears daily)
 * - Only shows for trial users
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TrialBannerProps {
  subscriptionStatus: string | null
  trialEndsAt: string | null
  trialStatus?: string | null
  paymentMethodAttached?: boolean
  subscriptionPlan?: string
  stripeCustomerId?: string
}

export default function TrialBanner({
  subscriptionStatus,
  trialEndsAt,
  trialStatus,
  paymentMethodAttached = false,
  subscriptionPlan = 'basic',
  stripeCustomerId
}: TrialBannerProps) {
  const router = useRouter()
  const [isDismissed, setIsDismissed] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  // Check if banner should be shown
  const shouldShowBanner =
    (subscriptionStatus === 'trialing' || trialStatus === 'active') &&
    trialEndsAt !== null

  useEffect(() => {
    if (!shouldShowBanner) return

    // Calculate days remaining
    const trialEnd = new Date(trialEndsAt!)
    const now = new Date()
    const diffTime = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    setDaysRemaining(Math.max(0, diffDays))

    // Check localStorage for dismissal
    const dismissKey = `trial-banner-dismissed-${trialEndsAt}`
    const dismissedAt = localStorage.getItem(dismissKey)

    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt)
      const now = new Date()

      // Check if 24 hours have passed since dismissal
      const hoursSinceDismissal = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60)

      if (hoursSinceDismissal < 24) {
        setIsDismissed(true)
      } else {
        // Clear old dismissal
        localStorage.removeItem(dismissKey)
      }
    }
  }, [shouldShowBanner, trialEndsAt])

  const handleDismiss = () => {
    const dismissKey = `trial-banner-dismissed-${trialEndsAt}`
    localStorage.setItem(dismissKey, new Date().toISOString())
    setIsDismissed(true)
  }

  const handleUpgradeClick = () => {
    router.push('/dashboard/settings#subscription')
  }

  const handleManagePayment = async () => {
    if (!stripeCustomerId) {
      alert('Brak danych klienta Stripe')
      return
    }

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Nie udało się otworzyć portalu zarządzania płatnościami')
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      alert('Wystąpił błąd podczas otwierania portalu')
    }
  }

  // Format plan name
  const formatPlanName = (plan: string) => {
    const planNames: Record<string, string> = {
      basic: 'Basic',
      pro: 'Pro',
      enterprise: 'Enterprise',
    }
    return planNames[plan] || plan
  }

  // Don't render if shouldn't show or is dismissed
  if (!shouldShowBanner || isDismissed || daysRemaining === null) {
    return null
  }

  // Determine color scheme based on days remaining
  let bgColor = 'bg-green-50'
  let borderColor = 'border-green-200'
  let textColor = 'text-green-800'
  let iconColor = 'text-green-600'
  let buttonVariant: 'default' | 'destructive' = 'default'

  if (daysRemaining <= 2) {
    bgColor = 'bg-red-50'
    borderColor = 'border-red-200'
    textColor = 'text-red-800'
    iconColor = 'text-red-600'
    buttonVariant = 'destructive'
  } else if (daysRemaining <= 7) {
    bgColor = 'bg-yellow-50'
    borderColor = 'border-yellow-200'
    textColor = 'text-yellow-800'
    iconColor = 'text-yellow-600'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <Alert className={`${bgColor} ${borderColor} border-2 mb-6 shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className={`w-6 h-6 ${iconColor}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1">
            <AlertDescription className={`${textColor} font-medium text-base`}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="font-bold">
                      {daysRemaining === 0 && 'Ostatni dzień okresu próbnego! '}
                      {daysRemaining === 1 && 'Został 1 dzień okresu próbnego! '}
                      {daysRemaining > 1 && `Zostało ${daysRemaining} dni okresu próbnego. `}
                    </span>
                    <span className="block sm:inline mt-1 sm:mt-0">
                      Twój trial wygasa {formatDate(trialEndsAt)}.
                    </span>
                  </div>

                  {/* CTA Button */}
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleUpgradeClick}
                      size="sm"
                      variant={buttonVariant}
                      className="whitespace-nowrap font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      {daysRemaining <= 2 ? '🔥 Upgrade Teraz' : '✨ Upgrade Teraz'}
                    </Button>
                  </div>
                </div>

                {/* Card Status and Auto-Conversion Notice */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-current/20">
                  {paymentMethodAttached && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-semibold">Karta dodana ✓</span>
                    </div>
                  )}

                  <div className="flex-1 text-sm">
                    <span className="font-medium">
                      Automatyczna konwersja na plan {formatPlanName(subscriptionPlan)} po zakończeniu trialu.
                    </span>
                    {stripeCustomerId && (
                      <button
                        onClick={handleManagePayment}
                        className="ml-2 underline hover:no-underline font-semibold"
                      >
                        Zarządzaj płatnościami
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </AlertDescription>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 ${textColor} hover:${textColor.replace('800', '900')} transition-colors`}
            aria-label="Zamknij banner"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </Alert>
  )
}
