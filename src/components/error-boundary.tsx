'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import * as Sentry from '@sentry/nextjs'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Send error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: true,
      },
    })
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state
      const { fallback: Fallback, showDetails = false } = this.props

      // Use custom fallback component if provided
      if (Fallback && error) {
        return <Fallback error={error} reset={this.handleReset} />
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-900">
                Ups! Coś poszło nie tak
              </CardTitle>
              <CardDescription>
                Wystąpił nieoczekiwany błąd w aplikacji. Przepraszamy za niedogodności.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error message for development */}
              {(showDetails || process.env.NODE_ENV === 'development') && error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Bug className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-800">
                        Szczegóły błędu:
                      </p>
                      <p className="text-sm text-red-700 font-mono bg-red-100 p-2 rounded">
                        {error.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Spróbuj ponownie
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Odśwież stronę
                </Button>

                <Button
                  variant="ghost"
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Strona główna
                </Button>
              </div>

              {/* Help text */}
              <div className="text-center text-sm text-gray-600">
                <p>
                  Jeśli problem się powtarza, skontaktuj się z{' '}
                  <a
                    href="mailto:support@oto-raport.pl"
                    className="text-blue-600 hover:underline"
                  >
                    support@oto-raport.pl
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for easier usage
export function ErrorBoundaryWrapper({
  children,
  onError,
  showDetails = false
}: {
  children: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
}) {
  return (
    <ErrorBoundary onError={onError} showDetails={showDetails}>
      {children}
    </ErrorBoundary>
  )
}

// Hook for error boundary context
export function useErrorHandler() {
  return {
    captureError: (error: Error, context?: Record<string, unknown>) => {
      console.error('Manual error capture:', error, context)

      // Send to Sentry with context
      Sentry.captureException(error, {
        contexts: {
          custom: context,
        },
        tags: {
          manualCapture: true,
        },
      })

      // Re-throw to trigger error boundary
      throw error
    }
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
