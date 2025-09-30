'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OtoraportLogo } from '@/components/icons/otoraport-logo'
import { AlertCircle, RefreshCw, Home, HelpCircle, Bug } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error)
  }, [error])

  // Detect error type for better user messaging
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isDatabaseError = error.message.includes('database') || error.message.includes('query')
  const isAuthError = error.message.includes('auth') || error.message.includes('unauthorized')

  const getErrorTitle = () => {
    if (isNetworkError) return 'Problem z połączeniem'
    if (isDatabaseError) return 'Problem z bazą danych'
    if (isAuthError) return 'Problem z autoryzacją'
    return 'Coś poszło nie tak'
  }

  const getErrorDescription = () => {
    if (isNetworkError) return 'Nie można połączyć się z serwerem. Sprawdź swoje połączenie internetowe.'
    if (isDatabaseError) return 'Wystąpił problem z dostępem do danych. Spróbuj ponownie za chwilę.'
    if (isAuthError) return 'Twoja sesja mogła wygasnąć. Zaloguj się ponownie.'
    return 'Wystąpił nieoczekiwany błąd. Nasz zespół został o tym poinformowany.'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <OtoraportLogo className="h-12 w-auto" />
          </div>

          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          <CardTitle className="text-3xl font-bold">{getErrorTitle()}</CardTitle>
          <CardDescription className="text-lg">
            {getErrorDescription()}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Details (for development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <div className="flex items-start space-x-2 mb-2">
                <Bug className="w-4 h-4 text-gray-600 mt-0.5" />
                <h3 className="font-semibold text-gray-900 text-sm">Szczegóły błędu (dev only):</h3>
              </div>
              <pre className="text-xs text-gray-700 overflow-auto max-h-32 bg-white p-2 rounded border border-gray-200">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          {/* Helpful Suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <HelpCircle className="w-4 h-4 mr-2" />
              Co możesz zrobić?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
              <li>Spróbuj odświeżyć stronę klikając przycisk poniżej</li>
              {isNetworkError && <li>Sprawdź swoje połączenie internetowe</li>}
              {isAuthError && <li>Zaloguj się ponownie do aplikacji</li>}
              <li>Poczekaj chwilę i spróbuj ponownie</li>
              <li>Jeśli problem się powtarza, skontaktuj się z nami</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={reset}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Spróbuj ponownie
            </Button>

            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Wróć do Dashboard
              </Button>
            </Link>
          </div>

          {/* Additional Help */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/help" className="w-full">
              <Button variant="ghost" className="w-full">
                <HelpCircle className="w-4 h-4 mr-2" />
                Centrum Pomocy
              </Button>
            </Link>

            {isAuthError && (
              <Link href="/auth/signin" className="w-full">
                <Button variant="ghost" className="w-full">
                  Zaloguj się ponownie
                </Button>
              </Link>
            )}
          </div>

          {/* Support Contact */}
          <div className="border-t pt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Problem nadal występuje?
            </p>
            <Link href="mailto:support@otoraport.pl" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Skontaktuj się z naszym wsparciem
            </Link>
            {error.digest && (
              <p className="text-xs text-gray-400 mt-2">
                Identyfikator błędu: {error.digest}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
