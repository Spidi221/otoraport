'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OtoraportLogo } from '@/components/icons/otoraport-logo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

/**
 * Payment page - shown after successful Stripe Checkout
 * This is a simple confirmation page that redirects to dashboard
 */
export default function PaymentPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard?trial_started=true')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <OtoraportLogo />
        </div>

        <Card className="border-2 border-green-500 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Płatność potwierdzona!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Twój 14-dniowy trial został aktywowany
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Co dalej?</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Karta została zarejestrowana</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Pierwsze 14 dni są darmowe</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Możesz anulować w dowolnym momencie</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Przypomnienie</h3>
              <p className="text-sm text-blue-800">
                Otrzymasz email 3 dni przed zakończeniem trialu. Po 14 dniach automatycznie
                przejdziesz na wybrany plan płatny.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  Przekierowanie do dashboardu za {countdown} sekund...
                </span>
              </div>

              <Button
                onClick={() => router.push('/dashboard?trial_started=true')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Przejdź do dashboardu teraz
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Potrzebujesz pomocy?{' '}
            <a href="mailto:support@otoraport.pl" className="text-blue-600 hover:text-blue-700 font-medium">
              Skontaktuj się z nami
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
