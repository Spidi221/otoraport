'use client'

import React from 'react'
import { AlertTriangle, XCircle, Info, CheckCircle, X } from 'lucide-react'
import { Card, CardContent } from './card'
import { Button } from './button'

export interface ErrorMessage {
  type: 'error' | 'warning' | 'info' | 'success'
  title?: string
  message: string
  code?: string
  details?: string | string[] | Record<string, unknown>
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
}

interface ErrorDisplayProps {
  error: ErrorMessage
  onDismiss?: () => void
  className?: string
}

export function ErrorDisplay({ error, onDismiss, className }: ErrorDisplayProps) {
  const getIcon = () => {
    switch (error.type) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getColorClasses = () => {
    switch (error.type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <Card className={`border-l-4 ${getColorClasses()} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getIcon()}
            <div className="flex-1 min-w-0">
              {error.title && (
                <h4 className="font-semibold text-sm mb-1">{error.title}</h4>
              )}
              <p className="text-sm leading-relaxed">{error.message}</p>
              
              {error.code && (
                <p className="text-xs opacity-75 mt-2">
                  Kod błędu: <code className="font-mono">{error.code}</code>
                </p>
              )}

              {error.details && process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="text-xs opacity-75 cursor-pointer hover:opacity-100">
                    Szczegóły techniczne
                  </summary>
                  <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                </details>
              )}

              {error.actions && error.actions.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {error.actions.map((action, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={action.variant === 'primary' ? 'default' : 'outline'}
                      onClick={action.onClick}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="ml-2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Predefined error messages for common scenarios
export const CommonErrors = {
  networkError: (retry?: () => void): ErrorMessage => ({
    type: 'error',
    title: 'Błąd połączenia',
    message: 'Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.',
    code: 'NETWORK_ERROR',
    actions: retry ? [
      { label: 'Spróbuj ponownie', onClick: retry, variant: 'primary' as const }
    ] : undefined
  }),

  unauthorizedError: (login?: () => void): ErrorMessage => ({
    type: 'warning',
    title: 'Sesja wygasła',
    message: 'Twoja sesja wygasła. Zaloguj się ponownie, aby kontynuować.',
    code: 'UNAUTHORIZED',
    actions: login ? [
      { label: 'Zaloguj ponownie', onClick: login, variant: 'primary' as const }
    ] : undefined
  }),

  validationError: (message: string): ErrorMessage => ({
    type: 'error',
    title: 'Błąd walidacji',
    message,
    code: 'VALIDATION_ERROR'
  }),

  fileUploadError: (message: string, retry?: () => void): ErrorMessage => ({
    type: 'error',
    title: 'Błąd przesyłania pliku',
    message,
    code: 'FILE_UPLOAD_ERROR',
    actions: retry ? [
      { label: 'Spróbuj ponownie', onClick: retry, variant: 'primary' as const }
    ] : undefined
  }),

  subscriptionError: (currentPlan: string, upgrade?: () => void): ErrorMessage => ({
    type: 'warning',
    title: 'Funkcja niedostępna',
    message: `Ta funkcja nie jest dostępna w planie ${currentPlan}. Rozważ upgrade do wyższego pakietu.`,
    code: 'FEATURE_RESTRICTED',
    actions: upgrade ? [
      { label: 'Upgrade pakietu', onClick: upgrade, variant: 'primary' as const }
    ] : undefined
  }),

  success: (message: string): ErrorMessage => ({
    type: 'success',
    title: 'Sukces',
    message,
    code: 'SUCCESS'
  })
}

// Hook for managing error state
export function useErrorHandling() {
  const [errors, setErrors] = React.useState<ErrorMessage[]>([])

  const addError = (error: ErrorMessage | string) => {
    const errorObj = typeof error === 'string' 
      ? { type: 'error' as const, message: error }
      : error

    setErrors(prev => [...prev, { ...errorObj, id: Date.now() + Math.random() }])
  }

  const removeError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index))
  }

  const clearErrors = () => {
    setErrors([])
  }

  return {
    errors,
    addError,
    removeError,
    clearErrors
  }
}

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ onError?: (error: Error) => void }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ onError?: (error: Error) => void }>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <ErrorDisplay
            error={{
              type: 'error',
              title: 'Wystąpił nieoczekiwany błąd',
              message: 'Coś poszło nie tak. Odśwież stronę lub skontaktuj się z pomocą techniczną.',
              code: 'REACT_ERROR_BOUNDARY',
              details: process.env.NODE_ENV === 'development' ? {
                message: this.state.error?.message,
                stack: this.state.error?.stack
              } : undefined,
              actions: [
                {
                  label: 'Odśwież stronę',
                  onClick: () => window.location.reload(),
                  variant: 'primary'
                }
              ]
            }}
          />
        </div>
      )
    }

    return this.props.children
  }
}