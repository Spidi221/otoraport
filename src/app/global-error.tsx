'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical error to error monitoring service
    console.error('Global application error:', error)

    // In production, send to error tracking service like Sentry
    // Example: Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pl">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
          <Card className="w-full max-w-2xl border-red-200">
            <CardHeader className="text-center space-y-4">
              {/* Critical Error Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
              </div>

              <CardTitle className="text-3xl font-bold text-red-900">
                Wystąpił krytyczny błąd aplikacji
              </CardTitle>
              <CardDescription className="text-lg text-gray-700">
                Przepraszamy, aplikacja napotkała nieoczekiwany problem.
                Nasz zespół został automatycznie powiadomiony i pracuje nad rozwiązaniem.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Details (for development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 text-sm mb-2">
                    Szczegóły błędu (dev only):
                  </h3>
                  <pre className="text-xs text-red-800 overflow-auto max-h-32 bg-white p-2 rounded border border-red-200">
                    {error.message}
                  </pre>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-700 cursor-pointer">Stack trace</summary>
                      <pre className="text-xs text-red-600 overflow-auto max-h-48 bg-white p-2 rounded border border-red-200 mt-1">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                  {error.digest && (
                    <p className="text-xs text-red-500 mt-2">Error ID: {error.digest}</p>
                  )}
                </div>
              )}

              {/* Critical Error Notice */}
              <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-2">⚠️ Co się stało?</h3>
                <p className="text-sm text-orange-800">
                  Aplikacja napotkała krytyczny błąd, który uniemożliwia prawidłowe działanie.
                  To nie jest typowy błąd - może być związany z:
                </p>
                <ul className="text-sm text-orange-800 space-y-1 ml-6 list-disc mt-2">
                  <li>Problemem z konfiguracją aplikacji</li>
                  <li>Błędem w systemie renderowania</li>
                  <li>Problemem z zewnętrznymi usługami</li>
                  <li>Nieoczekiwanym błędem serwera</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={reset}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Spróbuj ponownie
                </Button>

                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Wróć do Dashboard
                </Button>
              </div>

              {/* Additional Help */}
              <div className="space-y-3">
                <Button
                  onClick={() => window.location.href = '/help'}
                  variant="ghost"
                  className="w-full"
                >
                  Centrum Pomocy
                </Button>

                <Button
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  className="w-full text-sm"
                >
                  Przeładuj całą stronę
                </Button>
              </div>

              {/* Support Contact */}
              <div className="border-t pt-6 text-center bg-gray-50 -mx-6 -mb-6 px-6 py-6 rounded-b-lg">
                <p className="text-sm text-gray-700 mb-2 font-medium">
                  Problem nadal występuje? Skontaktuj się z nami natychmiast
                </p>
                <a
                  href="mailto:support@otoraport.pl?subject=Krytyczny%20błąd%20aplikacji"
                  className="text-sm text-red-600 hover:text-red-800 font-semibold"
                >
                  support@otoraport.pl
                </a>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-3">
                    Identyfikator błędu: <code className="bg-gray-200 px-2 py-1 rounded">{error.digest}</code>
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Podaj powyższy identyfikator błędu podczas kontaktu z wsparciem
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
