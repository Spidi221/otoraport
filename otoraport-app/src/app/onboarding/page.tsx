'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleCompleteOnboarding = async () => {
    setIsLoading(true)
    
    try {
      // Mark onboarding as completed
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipToUpload = () => {
    router.push('/dashboard?tab=upload')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Witamy w OTORAPORT! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Twoje konto zostało utworzone pomyślnie. Teraz skonfigurujemy automatyzację compliance z ministerstwem.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {i <= step ? '✓' : i}
                </div>
                {i < 3 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    i < step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Konto utworzone!
              </h2>
              <p className="text-gray-600 max-w-lg mx-auto">
                Twoja firma została pomyślnie zarejestrowana w systemie OTORAPORT. 
                Okres próbny wynosi 14 dni - wszystkie funkcje dostępne za darmo.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <h3 className="font-medium text-green-900 mb-2">Twoje URL-e ministerstwa:</h3>
                <div className="space-y-1 text-sm text-green-800">
                  <p><strong>XML:</strong> Zostanie wygenerowany po pierwszym uploadzić</p>
                  <p><strong>MD:</strong> Zostanie wygenerowany po pierwszym uploadzić</p>
                </div>
              </div>
              <button 
                onClick={() => setStep(2)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Dalej
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Jak to działa?
              </h2>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">1</div>
                  <h3 className="font-medium">Upload danych</h3>
                  <p className="text-sm text-gray-600">Wrzuć plik CSV/Excel z mieszkaniami</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">2</div>
                  <h3 className="font-medium">Automatyczna konwersja</h3>
                  <p className="text-sm text-gray-600">System generuje XML i MD zgodne z prawem</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">3</div>
                  <h3 className="font-medium">Compliance z ministerstwem</h3>
                  <p className="text-sm text-gray-600">Stałe URL-e dostępne 24/7 dla urzędników</p>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setStep(1)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Wstecz
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Dalej
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Gotowy na start!
              </h2>
              <p className="text-gray-600 max-w-lg mx-auto">
                Wszystko jest skonfigurowane. Możesz teraz wgrać swoje pierwsze dane mieszkaniowe 
                i automatycznie wygenerować raporty compliance.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-medium text-blue-900 mb-3">💡 Szybki start</h3>
                <ul className="space-y-2 text-sm text-blue-800 text-left">
                  <li>✓ Przygotuj plik CSV z danymi mieszkań</li>
                  <li>✓ Upload przez drag & drop</li>
                  <li>✓ System automatycznie wygeneruje raporty</li>
                  <li>✓ URL-e będą dostępne natychmiast</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleSkipToUpload}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Wgraj pierwsze dane
                </button>
                <button 
                  onClick={handleCompleteOnboarding}
                  disabled={isLoading}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Finalizuję...' : 'Przejdź do dashboardu'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Masz pytania? <a href="mailto:support@otoraport.pl" className="text-blue-600 hover:underline">Skontaktuj się z nami</a>
        </div>
      </div>
    </div>
  )
}