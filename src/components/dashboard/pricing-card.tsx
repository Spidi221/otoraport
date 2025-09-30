'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, CreditCard, Zap, Shield, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PricingPlan {
  id: 'basic' | 'pro' | 'enterprise'
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  popular?: boolean
  icon: React.ReactNode
}

const plans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Plan Basic',
    description: 'Idealny dla małych deweloperów z jednym projektem',
    monthlyPrice: 14900, // 149 zł (stored in grosze)
    yearlyPrice: 142800, // 1428 zł/year (119 zł/month with 20% discount)
    icon: <Zap className="h-6 w-6" />,
    features: [
      'Do 100 mieszkań',
      'Automatyczne raporty XML/MD5',
      'Integracja z dane.gov.pl',
      'Email support',
      'Dashboard analityczny',
      'Backup danych'
    ]
  },
  {
    id: 'pro', 
    name: 'Plan Pro',
    description: 'Dla średnich deweloperów z wieloma projektami',
    monthlyPrice: 24900, // 249 zł (stored in grosze)
    yearlyPrice: 238800, // 2388 zł/year (199 zł/month with 20% discount)
    popular: true,
    icon: <Shield className="h-6 w-6" />,
    features: [
      'Nieograniczona liczba mieszkań',
      'Wszystko z planu Basic',
      'Strony prezentacyjne',
      'Priority support',
      'Zaawansowana analityka',
      'API dostęp',
      'Bulk operations'
    ]
  },
  {
    id: 'enterprise',
    name: 'Plan Enterprise', 
    description: 'Dla dużych deweloperów z wieloma projektami',
    monthlyPrice: 49900, // 499 zł (stored in grosze)
    yearlyPrice: 478800, // 4788 zł/year (399 zł/month with 20% discount)
    icon: <Shield className="h-6 w-6" />,
    features: [
      'Wszystko z planu Pro',
      'Custom domeny',
      'White-label rozwiązania',
      'Dedykowany support 24/7',
      'Custom integracje',
      'SLA 99.9%',
      'Dedykowany account manager',
      'On-premise deployment'
    ]
  }
]

export function PricingCard() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [processing, setProcessing] = useState<string | null>(null)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleSubscribe = async (planId: 'basic' | 'pro' | 'enterprise') => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    setProcessing(planId)
    
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          period: billingPeriod
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Wystąpił błąd podczas inicjalizacji płatności')
      }

      // Przekierowanie do Przelewy24
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
      }

    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error instanceof Error ? error.message : 'Wystąpił błąd podczas płatności')
    } finally {
      setProcessing(null)
    }
  }

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(0)
  }

  const getSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyCost = (monthlyPrice * 12) / 100
    const yearlyCost = yearlyPrice / 100
    const savings = monthlyCost - yearlyCost
    return Math.round(savings)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Billing Period Toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4 p-1 bg-muted rounded-lg">
          <Button
            variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('monthly')}
          >
            Miesięcznie
          </Button>
          <Button
            variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('yearly')}
            className="relative"
          >
            Rocznie
            <Badge variant="destructive" className="ml-2 text-xs">
              -20%
            </Badge>
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {plans.map((plan) => {
          const currentPrice = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
          const isProcessing = processing === plan.id
          
          return (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Najpopularniejszy
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">
                      {formatPrice(currentPrice)}
                    </span>
                    <span className="text-xl text-muted-foreground ml-2">
                      zł/{billingPeriod === 'monthly' ? 'mies' : 'rok'}
                    </span>
                  </div>
                  
                  {billingPeriod === 'yearly' && (
                    <div className="text-sm text-green-600 font-medium mt-2">
                      Oszczędzasz {getSavings(plan.monthlyPrice, plan.yearlyPrice)} zł rocznie
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5 mr-3" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Przetwarzanie...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Rozpocznij teraz
                    </>
                  )}
                </Button>
                
                <div className="flex items-center justify-center mt-4 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  7 dni darmowego okresu próbnego
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Trust Signals */}
      <div className="mt-12 text-center">
        <div className="flex justify-center items-center space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Bezpieczne płatności przez Przelewy24
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 mr-2" />
            Zgodność z wymogami ministerstwa
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Anuluj w każdej chwili
          </div>
        </div>
      </div>
    </div>
  )
}