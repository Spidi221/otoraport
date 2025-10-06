'use client'

import { useState, useMemo, memo } from 'react'

const PricingSection = memo(function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = useMemo(() => [
    {
      name: 'Basic',
      description: 'Podstawowy compliance dla małych deweloperów',
      monthlyPrice: 149,
      annualPrice: 119, // 149 * 12 * 0.8 / 12 = 119
      features: [
        'Do 2 inwestycji',
        'Automatyczne raporty XML/MD',
        'Stałe linki dla ministerstwa',
        'Email support'
      ]
    },
    {
      name: 'Pro',
      description: 'Compliance dla średnich deweloperów',
      monthlyPrice: 249,
      annualPrice: 199, // 249 * 12 * 0.8 / 12 = 199
      popular: true,
      comingSoon: 'Q1 2026',
      features: [
        'Wszystko z Basic',
        'Do 10 inwestycji',
        '🔜 Strony prezentacyjne (Q1 2026)',
        '🔜 Zaawansowane szablony (Q1 2026)',
        '🔜 Analytics (Q1 2026)',
        'Priority support'
      ]
    },
    {
      name: 'Enterprise',
      description: 'Compliance dla największych deweloperów',
      monthlyPrice: 499,
      annualPrice: 399, // 499 * 12 * 0.8 / 12 = 399 (covers $20/month Vercel domains cost)
      comingSoon: 'Q2 2026',
      features: [
        'Wszystko z Pro',
        'Nieograniczona liczba inwestycji',
        '🔜 Custom domain (Q2 2026)',
        '🔜 SSL certificate (Q2 2026)',
        '🔜 White-label branding (Q2 2026)',
        '🔜 API access (Q2 2026)',
        'Dedicated manager',
        'SLA 99.9% uptime'
      ]
    }
  ], [])

  return (
    <section id="pricing" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Proste ceny, bez ukrytych kosztów
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Zacznij za darmo, płać tylko gdy Ci się opłaca. Każdy plan obejmuje pełną automatyzację compliance.
          </p>
          <div className="flex justify-center items-center space-x-4 mb-12">
            <span className={`text-gray-500 ${!isAnnual ? 'font-semibold text-gray-900' : ''}`}>Miesięcznie</span>
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                id="pricing-toggle" 
                checked={isAnnual}
                onChange={(e) => setIsAnnual(e.target.checked)}
              />
              <label htmlFor="pricing-toggle" className="flex items-center cursor-pointer">
                <div className="relative">
                  <div className={`w-12 h-6 rounded-full shadow-inner transition-colors ${isAnnual ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute w-4 h-4 bg-white rounded-full shadow top-1 transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </div>
              </label>
            </div>
            <span className={`text-gray-500 ${isAnnual ? 'font-semibold text-gray-900' : ''}`}>Rocznie</span>
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">-20%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {plans.map((plan, index) => (
            <div 
              key={plan.name}
              className={`relative bg-white rounded-2xl border p-8 transition-all duration-300 ${
                plan.popular 
                  ? 'border-2 border-blue-500 shadow-xl transform scale-105 hover:scale-110 hover:shadow-2xl' 
                  : index === 0 
                    ? 'border-gray-200 shadow-sm hover:shadow-md hover:scale-102'
                    : 'border-gray-200 shadow-sm hover:shadow-xl hover:scale-105 hover:border-purple-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Najpopularniejszy
                  </span>
                </div>
              )}

              {plan.comingSoon && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold">
                    Beta {plan.comingSoon}
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-xl text-gray-500 ml-1">/mies</span>
                </div>
                {isAnnual && (
                  <p className="text-sm text-green-600 mt-1 font-medium">
                    Oszczędzasz {plan.monthlyPrice - plan.annualPrice} zł miesięcznie!
                  </p>
                )}
                {!isAnnual && (
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.annualPrice} zł/mies przy płatności rocznej
                  </p>
                )}
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => window.location.href = `/auth/signup?plan=${plan.name.toLowerCase()}&period=${isAnnual ? 'yearly' : 'monthly'}`}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}>
                Rozpocznij 14-dniowy okres próbny
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

export default PricingSection