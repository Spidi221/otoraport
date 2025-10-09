'use client'

import { SUBSCRIPTION_PLANS, formatPrice, type SubscriptionPlanType } from '@/lib/subscription-plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface PlanComparisonProps {
  onSelectPlan: (planType: SubscriptionPlanType) => void
  isLoading?: boolean
  selectedPlan?: SubscriptionPlanType
}

export function PlanComparison({ onSelectPlan, isLoading, selectedPlan }: PlanComparisonProps) {
  const plans = Object.values(SUBSCRIPTION_PLANS)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Wybierz plan dla swojej firmy
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Wszystkie plany zawierają 14-dniowy darmowy trial
        </p>
        <Badge variant="secondary" className="text-base px-4 py-2">
          💳 Karta wymagana • Anuluj w dowolnym momencie
        </Badge>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => {
          const isRecommended = plan.recommended
          const isSelected = selectedPlan === plan.id

          return (
            <Card
              key={plan.id}
              className={`relative transition-all ${
                isRecommended
                  ? 'border-2 border-green-500 shadow-xl scale-105'
                  : 'border border-gray-200 hover:border-gray-300'
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-500 text-white px-4 py-1 text-sm font-semibold">
                    POLECANE
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                {/* Icon */}
                <div className="text-5xl mb-3">{plan.icon}</div>

                {/* Plan Name */}
                <CardTitle className="text-2xl font-bold">{plan.displayName}</CardTitle>

                {/* Price */}
                <div className="mt-4">
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.price)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">miesięcznie</div>
                </div>

                {/* Trial Info */}
                <CardDescription className="mt-3 text-base font-medium text-green-600">
                  14 dni za darmo, potem płatne
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features List */}
                <div className="space-y-3">
                  <div className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                    Co zawiera:
                  </div>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limitations */}
                {plan.limitations && plan.limitations.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">
                      Ograniczenia:
                    </div>
                    {plan.limitations.map((limitation, idx) => (
                      <div key={idx} className="text-sm text-gray-500 mb-1">
                        • {limitation}
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={isLoading}
                  className={`w-full mt-6 ${
                    isRecommended
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white font-semibold py-6 text-base`}
                >
                  {isLoading && isSelected
                    ? 'Przekierowywanie...'
                    : 'Rozpocznij 14-dniowy trial'}
                </Button>

                {/* Additional Project Pricing (Pro) */}
                {plan.id === 'pro' && plan.additionalProjectFee && (
                  <div className="text-center text-xs text-gray-500 mt-2">
                    Dodatkowe projekty: +{formatPrice(plan.additionalProjectFee)}/miesiąc każdy
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Szczegółowe porównanie funkcji
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Funkcja</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Basic</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700 bg-green-50">
                  Pro
                </th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-700">Liczba projektów</td>
                <td className="py-4 px-4 text-center">1</td>
                <td className="py-4 px-4 text-center bg-green-50">
                  2 + płatne dodatkowe
                </td>
                <td className="py-4 px-4 text-center">Unlimited</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-700">Liczba mieszkań</td>
                <td className="py-4 px-4 text-center">20</td>
                <td className="py-4 px-4 text-center bg-green-50">Unlimited</td>
                <td className="py-4 px-4 text-center">Unlimited</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-700">Automatyczne XML/CSV/MD5</td>
                <td className="py-4 px-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center bg-green-50">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-700">Publiczne endpointy dane.gov.pl</td>
                <td className="py-4 px-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center bg-green-50">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-700">Subdomena nazwa.oto-raport.pl</td>
                <td className="py-4 px-4 text-center text-gray-400">—</td>
                <td className="py-4 px-4 text-center bg-green-50">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
                <td className="py-4 px-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-700">Custom domena</td>
                <td className="py-4 px-4 text-center text-gray-400">—</td>
                <td className="py-4 px-4 text-center bg-green-50 text-gray-400">—</td>
                <td className="py-4 px-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-700">API access</td>
                <td className="py-4 px-4 text-center text-gray-400">—</td>
                <td className="py-4 px-4 text-center bg-green-50 text-gray-400">—</td>
                <td className="py-4 px-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-700">Support</td>
                <td className="py-4 px-4 text-center text-sm">Email 24h</td>
                <td className="py-4 px-4 text-center bg-green-50 text-sm">Priority email</td>
                <td className="py-4 px-4 text-center text-sm">Dedicated (2h)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 bg-blue-50 rounded-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Najczęściej zadawane pytania
        </h3>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Czy mogę anulować w dowolnym momencie?
            </h4>
            <p className="text-sm text-gray-600">
              Tak, możesz anulować subskrypcję w dowolnym momencie. Nie ma żadnych ukrytych opłat
              ani zobowiązań.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Co się stanie po zakończeniu trialu?
            </h4>
            <p className="text-sm text-gray-600">
              Po 14 dniach automatycznie przejdziesz na wybrany plan płatny. Otrzymasz przypomnienie
              3 dni przed końcem trialu.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Czy karta jest wymagana?</h4>
            <p className="text-sm text-gray-600">
              Tak, karta jest wymagana do rozpoczęcia trialu. Nie obciążymy jej przez pierwsze 14
              dni.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Czy mogę zmienić plan później?</h4>
            <p className="text-sm text-gray-600">
              Tak, możesz w dowolnym momencie zmienić plan na wyższy lub niższy w ustawieniach
              konta.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
