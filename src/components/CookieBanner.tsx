'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { updateGA4Consent } from '@/lib/ga4-tracking'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    setIsClient(true)
    // Only access localStorage after client-side hydration
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = () => {
    const allConsent = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookie-consent', JSON.stringify(allConsent))

    // Update GA4 consent
    updateGA4Consent(true)

    setShowBanner(false)
    setShowPreferences(false)
  }

  const acceptNecessaryOnly = () => {
    const necessaryConsent = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookie-consent', JSON.stringify(necessaryConsent))

    // Update GA4 consent - deny analytics
    updateGA4Consent(false)

    setShowBanner(false)
    setShowPreferences(false)
  }

  const savePreferences = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookie-consent', JSON.stringify(consent))

    // Update GA4 consent based on analytics preference
    updateGA4Consent(preferences.analytics)

    setShowBanner(false)
    setShowPreferences(false)
  }

  const togglePreference = (key: keyof typeof preferences) => {
    if (key === 'necessary') return // Cannot disable necessary cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Don't render on server to avoid hydration mismatch
  if (!isClient || !showBanner) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4 md:p-6">
        {!showPreferences ? (
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🍪</span>
                  <h3 className="font-semibold text-gray-900">Używamy plików cookies</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ta strona wykorzystuje pliki cookies niezbędne do działania serwisu oraz opcjonalne 
                  cookies analityczne i marketingowe. Szczegółowe informacje znajdziesz w naszej{' '}
                  <Link href="/cookies" className="text-blue-600 hover:underline">
                    polityce cookies
                  </Link>
                  .
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ustawienia cookies
                </button>
                <button
                  onClick={acceptNecessaryOnly}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Tylko niezbędne
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Akceptuj wszystkie
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="container mx-auto max-w-4xl">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ustawienia cookies</h3>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Wybierz kategorie cookies, na które wyrażasz zgodę. Możesz zmienić te ustawienia w dowolnym momencie.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Necessary Cookies */}
              <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-600">✅</span>
                    <h4 className="font-medium text-gray-900">Cookies niezbędne</h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Niezbędne do podstawowego funkcjonowania strony. Nie można ich wyłączyć.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sesja użytkownika, bezpieczeństwo, preferencje językowe
                  </p>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-6 bg-green-600 rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-600">⚙️</span>
                    <h4 className="font-medium text-gray-900">Cookies funkcjonalne</h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Personalizacja interfejsu, zapamiętywanie preferencji użytkownika.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Motyw kolorystyczny, layout dashboardu, ustawienia powiadomień
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => togglePreference('functional')}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      preferences.functional 
                        ? 'bg-blue-600 justify-end' 
                        : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </button>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-purple-600">📊</span>
                    <h4 className="font-medium text-gray-900">Cookies analityczne</h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Google Analytics, statystyki użytkowania, optymalizacja wydajności.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    _ga, _gid, _gat_gtag - anonimowe statystyki ruchu
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => togglePreference('analytics')}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      preferences.analytics 
                        ? 'bg-purple-600 justify-end' 
                        : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </button>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-orange-600">📢</span>
                    <h4 className="font-medium text-gray-900">Cookies marketingowe</h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Remarketing, spersonalizowane reklamy, śledzenie konwersji.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Facebook Pixel, Google Ads, LinkedIn Insight Tag
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => togglePreference('marketing')}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      preferences.marketing 
                        ? 'bg-orange-600 justify-end' 
                        : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Link
                href="/cookies"
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors text-center"
              >
                Dowiedz się więcej
              </Link>
              <button
                onClick={acceptNecessaryOnly}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tylko niezbędne
              </button>
              <button
                onClick={savePreferences}
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Zapisz preferencje
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}