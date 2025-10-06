'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, CreditCard, Loader2, ExternalLink, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SubscriptionStatus {
  plan: string
  status: 'trialing' | 'active' | 'inactive' | 'cancelled' | 'expired' | 'past_due' | null
  trial_ends_at: string | null
  current_period_end: string | null
  stripe_customer_id: string | null
}

export function SubscriptionCard() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingCheckout, setProcessingCheckout] = useState(false)
  const [processingPortal, setProcessingPortal] = useState(false)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  async function fetchSubscriptionStatus() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: developer, error } = await supabase
        .from('developers')
        .select('subscription_plan, subscription_status, trial_ends_at, current_period_end, stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching subscription:', error)
        toast.error('Nie udało się pobrać informacji o subskrypcji')
      } else if (developer) {
        setSubscription({
          plan: developer.subscription_plan || 'trial',
          status: developer.subscription_status,
          trial_ends_at: developer.trial_ends_at,
          current_period_end: developer.current_period_end,
          stripe_customer_id: developer.stripe_customer_id
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Wystąpił błąd podczas ładowania danych')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgradeClick() {
    setProcessingCheckout(true)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Nie udało się utworzyć sesji płatności')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Brak URL do przekierowania')
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Nie udało się rozpocząć procesu płatności')
      setProcessingCheckout(false)
    }
  }

  async function handleManageBillingClick() {
    setProcessingPortal(true)

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Nie udało się utworzyć sesji portalu')
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Brak URL do przekierowania')
      }
    } catch (error: any) {
      console.error('Portal error:', error)
      toast.error(error.message || 'Nie udało się otworzyć portalu płatności')
      setProcessingPortal(false)
    }
  }

  function getStatusBadge(status: SubscriptionStatus['status']) {
    switch (status) {
      case 'trialing':
        return <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" /> Okres próbny</Badge>
      case 'active':
        return <Badge variant="default" className="gap-1 bg-green-600"><CreditCard className="h-3 w-3" /> Aktywna</Badge>
      case 'past_due':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Zaległości</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="gap-1">Anulowana</Badge>
      case 'expired':
        return <Badge variant="outline" className="gap-1">Wygasła</Badge>
      case 'inactive':
        return <Badge variant="outline" className="gap-1">Nieaktywna</Badge>
      default:
        return <Badge variant="outline">Nieznany</Badge>
    }
  }

  function getPlanName(plan: string) {
    switch (plan) {
      case 'basic':
        return 'Basic Plan'
      case 'pro':
        return 'Pro Plan'
      case 'enterprise':
        return 'Enterprise Plan'
      case 'trial':
        return 'Plan próbny'
      default:
        return 'Plan próbny'
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  function isTrialExpiringSoon() {
    if (!subscription?.trial_ends_at || subscription.status !== 'trialing') return false
    const daysLeft = Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 3
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subskrypcja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return null
  }

  const showUpgradeButton = subscription.status === 'trialing' ||
                           subscription.status === 'expired' ||
                           subscription.status === 'cancelled' ||
                           subscription.status === 'inactive'

  const showManageBillingButton = subscription.status === 'active' ||
                                  subscription.status === 'past_due'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subskrypcja
            </CardTitle>
            <CardDescription className="mt-1">
              Zarządzaj swoim planem i płatnościami
            </CardDescription>
          </div>
          {getStatusBadge(subscription.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trial expiration warning */}
        {isTrialExpiringSoon() && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Twój okres próbny kończy się {formatDate(subscription.trial_ends_at)}.
              Aktywuj plan Basic, aby kontynuować korzystanie z serwisu.
            </AlertDescription>
          </Alert>
        )}

        {/* Past due warning */}
        {subscription.status === 'past_due' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Twoja płatność nie powiodła się. Zaktualizuj metodę płatności, aby kontynuować.
            </AlertDescription>
          </Alert>
        )}

        {/* Current plan info */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Obecny plan</span>
            <span className="font-medium">{getPlanName(subscription.plan)}</span>
          </div>

          {subscription.status === 'trialing' && subscription.trial_ends_at && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Koniec okresu próbnego</span>
              <span className="font-medium">{formatDate(subscription.trial_ends_at)}</span>
            </div>
          )}

          {(subscription.status === 'active' || subscription.status === 'past_due') && subscription.current_period_end && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Następna płatność</span>
              <span className="font-medium">{formatDate(subscription.current_period_end)}</span>
            </div>
          )}

          {subscription.plan === 'basic' && subscription.status === 'active' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cena</span>
              <span className="font-medium">149 zł/miesiąc</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {showUpgradeButton && (
            <Button
              onClick={handleUpgradeClick}
              disabled={processingCheckout}
              className="flex-1"
            >
              {processingCheckout ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Przekierowywanie...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Aktywuj Basic Plan
                </>
              )}
            </Button>
          )}

          {showManageBillingButton && (
            <Button
              onClick={handleManageBillingClick}
              disabled={processingPortal}
              variant="outline"
              className="flex-1"
            >
              {processingPortal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Przekierowywanie...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Zarządzaj płatnościami
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
