'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export function SubscriptionErrorHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const subscriptionError = searchParams.get('subscription_error')
    if (subscriptionError) {
      let message = 'Wystąpił problem z subskrypcją.'

      switch (subscriptionError) {
        case 'trial_expired':
          message = 'Twój okres próbny wygasł. Aktywuj plan Basic poniżej, aby kontynuować.'
          break
        case 'subscription_inactive':
          message = 'Twoja subskrypcja wygasła. Odnów plan, aby kontynuować.'
          break
        case 'subscription_cancelled':
          message = 'Twoja subskrypcja została anulowana. Aktywuj nowy plan, aby kontynuować.'
          break
        case 'subscription_past_due':
          message = 'Twoja płatność nie powiodła się. Zaktualizuj metodę płatności.'
          break
        case 'no_subscription':
          message = 'Brak aktywnej subskrypcji. Wybierz plan, aby kontynuować.'
          break
      }

      toast.error(message, {
        duration: 8000,
        position: 'top-center'
      })

      // Clear the query param
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams])

  return null
}
