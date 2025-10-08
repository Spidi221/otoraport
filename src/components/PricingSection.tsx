'use client'

import { useState, useMemo, memo } from 'react'

// Pricing Calculator Component for Pro Plan
const ProPlanCalculator = memo(function ProPlanCalculator({
  basePrice,
  additionalProjectFee
}: {
  basePrice: number;
  additionalProjectFee: number
}) {
  const [additionalInvestments, setAdditionalInvestments] = useState(0)

  const totalPrice = basePrice + (additionalInvestments * additionalProjectFee)

  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">
          Dodatkowe inwestycje (ponad bazowe 2):
        </label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAdditionalInvestments(Math.max(0, additionalInvestments - 1))}
            className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
            aria-label="Zmniejsz liczbę dodatkowych inwestycji"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-12 text-center font-semibold text-gray-900">{additionalInvestments}</span>
          <button
            onClick={() => setAdditionalInvestments(Math.min(20, additionalInvestments + 1))}
            className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
            aria-label="Zwiększ liczbę dodatkowych inwestycji"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {additionalInvestments > 0 && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Plan Pro (bazowy):</span>
            <span>{basePrice} zł/msc</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Dodatkowe inwestycje ({additionalInvestments} × {additionalProjectFee} zł):</span>
            <span>{additionalInvestments * additionalProjectFee} zł/msc</span>
          </div>
          <div className="border-t border-blue-200 pt-2 flex justify-between font-semibold text-gray-900">
            <span>Razem:</span>
            <span>{totalPrice} zł/msc</span>
          </div>
        </div>
      )}

      {additionalInvestments === 0 && (
        <p className="text-xs text-gray-600 text-center">
          Użyj kalkulatora aby zobaczyć cenę dla większej liczby inwestycji
        </p>
      )}
    </div>
  )
})

const PricingSection = memo(function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = useMemo(() => [
    {
      name: 'Basic',
      description: 'Idealny start dla małych deweloperów',
      monthlyPrice: 149,
      annualPrice: 119, // 20% zniżki
      features: [
        '1 inwestycja',
        'Maksymalnie 20 mieszkań',
        'Automatyczne raporty XML/CSV/MD5',
        'Publiczne endpointy dla dane.gov.pl',
        'Codzienne automatyczne aktualizacje',
        'Email support (odpowiedź do 24h)',
        'Historia zmian cen'
      ],
      ctaText: 'Rozpocznij z Basic',
      highlight: false
    },
    {
      name: 'Pro',
      description: 'Najbardziej popularny - dla rosnących firm',
      monthlyPrice: 249,
      annualPrice: 199, // 20% zniżki
      additionalProjectFee: 50,
      popular: true,
      features: [
        '2 inwestycje w cenie bazowej',
        '+50 zł/msc za każdą dodatkową',
        'Unlimited liczba mieszkań',
        'Wszystko z planu Basic',
        'Subdomena nazwa.otoraport.pl (opcjonalnie)',
        'Strona z cenami dla klientów',
        'Priority email support',
        'Zaawansowane analytics i raporty',
        'Historia cen z wykresami'
      ],
      ctaText: 'Najpopularniejszy wybór',
      highlight: true
    },
    {
      name: 'Enterprise',
      description: 'Dla największych deweloperów',
      monthlyPrice: 499,
      annualPrice: 399, // 20% zniżki
      features: [
        'Unlimited inwestycje i mieszkania',
        'Wszystko z planu Pro',
        'Custom domena (ceny.twojafirma.pl)',
        'Własne SSL certificate',
        'White-label branding',
        'Dedicated account manager',
        'API access dla integracji',
        'SLA 99.9% uptime z kompensacją',
        'Priorytetowy support (odpowiedź do 2h)',
        'Custom raportowanie i eksporty'
      ],
      ctaText: 'Skontaktuj się z nami',
      highlight: false
    }
  ], [])

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Proste, przejrzyste ceny
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Wybierz plan dopasowany do skali Twojego biznesu. Każdy plan zapewnia pełną zgodność z ustawą
            i automatyzację raportowania na dane.gov.pl.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <span className={`text-base font-medium transition-colors ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Miesięcznie
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ backgroundColor: isAnnual ? '#3B82F6' : '#D1D5DB' }}
              role="switch"
              aria-checked={isAnnual}
              aria-label="Przełącz między płatnością miesięczną a roczną"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                  isAnnual ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-base font-medium transition-colors ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Rocznie
            </span>
            {isAnnual && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 animate-pulse">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Oszczędzasz 20%
              </span>
            )}
          </div>

          {/* Trust Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-800">
            <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            14 dni darmowego okresu próbnego - bez podawania karty
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-sm transition-all duration-300 ${
                plan.highlight
                  ? 'border-2 border-blue-500 shadow-xl lg:scale-105 hover:shadow-2xl'
                  : 'border border-gray-200 hover:shadow-lg hover:border-gray-300'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Najpopularniejszy
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline mb-2">
                    <span className="text-5xl font-bold text-gray-900">
                      {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-xl text-gray-500 ml-2">zł/msc</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-green-600 font-medium">
                      Oszczędzasz {(plan.monthlyPrice - plan.annualPrice) * 12} zł rocznie!
                    </p>
                  )}
                  {!isAnnual && (
                    <p className="text-sm text-gray-500">
                      {plan.annualPrice} zł/msc przy płatności rocznej
                    </p>
                  )}
                </div>

                {/* Pro Plan Calculator */}
                {plan.name === 'Pro' && plan.additionalProjectFee && (
                  <ProPlanCalculator
                    basePrice={isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    additionalProjectFee={plan.additionalProjectFee}
                  />
                )}

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (plan.name === 'Enterprise') {
                      window.location.href = '/contact';
                    } else {
                      window.location.href = `/auth/signup?plan=${plan.name.toLowerCase()}&period=${isAnnual ? 'yearly' : 'monthly'}`;
                    }
                  }}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:scale-105'
                      : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md'
                  }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Bez zobowiązań</h3>
            <p className="text-sm text-gray-600">Anuluj subskrypcję w dowolnym momencie</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Bezpieczne płatności</h3>
            <p className="text-sm text-gray-600">Stripe - szyfrowanie bankowe</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant setup</h3>
            <p className="text-sm text-gray-600">Aktywacja konta w mniej niż 10 minut</p>
          </div>
        </div>

        {/* Price History Mention */}
        <div className="mt-16 max-w-3xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Historia cen w każdym planie
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Wszystkie plany automatycznie zapisują pełną historię zmian cen każdego mieszkania.
                Zobacz trendy, analizuj zmiany i generuj raporty historyczne dla Ministerstwa.
                <strong className="text-blue-700"> Plany Pro i Enterprise dodatkowo oferują wykresy i zaawansowane analytics.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})

export default PricingSection
