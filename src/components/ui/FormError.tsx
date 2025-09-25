'use client'

interface FormErrorProps {
  title?: string
  message: string
  retry?: () => void
  type?: 'error' | 'warning' | 'info'
}

export function FormError({ 
  title = 'Wystąpił błąd', 
  message, 
  retry, 
  type = 'error' 
}: FormErrorProps) {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-600',
          iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-600',
          iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }
      default:
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-600',
          iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }
    }
  }
  
  const styles = getStyles()
  
  return (
    <div className={`rounded-md border p-4 ${styles.container}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg 
            className={`h-5 w-5 ${styles.icon}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={styles.iconPath} 
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="mt-1 text-sm">
            <p>{message}</p>
          </div>
          {retry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={retry}
                className={`text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded ${
                  type === 'error' ? 'focus:ring-red-500' :
                  type === 'warning' ? 'focus:ring-yellow-500' :
                  'focus:ring-blue-500'
                }`}
              >
                Spróbuj ponownie
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function FormSuccess({ 
  title = 'Sukces!', 
  message 
}: { 
  title?: string
  message: string 
}) {
  return (
    <div className="rounded-md bg-green-50 border border-green-200 p-4" role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">{title}</h3>
          <div className="mt-1 text-sm text-green-700">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FormLoading({ message = 'Przetwarzanie...' }: { message?: string }) {
  return (
    <div className="rounded-md bg-blue-50 border border-blue-200 p-4" role="status" aria-live="polite">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg 
            className="animate-spin h-5 w-5 text-blue-600" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-blue-800">{message}</p>
        </div>
      </div>
    </div>
  )
}