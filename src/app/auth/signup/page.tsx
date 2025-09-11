'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function SignUpPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company_name: '',
    nip: '',
    phone: '',
    plan: 'basic' // basic, pro, enterprise
  })
  const [nipData, setNipData] = useState(null)
  const [errors, setErrors] = useState({})

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleNipLookup = async (nip) => {
    if (nip.length === 10) {
      try {
        setIsLoading(true)
        const response = await fetch('/api/nip-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nip })
        })
        
        const result = await response.json()
        
        if (result.success && result.data.name) {
          setNipData(result.data)
          // Auto-fill company data
          setFormData(prev => ({
            ...prev,
            company_name: result.data.name,
            phone: result.data.phone || prev.phone
          }))
        }
      } catch (error) {
        console.error('NIP lookup failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const validateStep1 = () => {
    const newErrors = {}
    
    if (!formData.email) newErrors.email = 'Email jest wymagany'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Nieprawidłowy format email'
    
    if (!formData.password) newErrors.password = 'Hasło jest wymagane'
    else if (formData.password.length < 8) newErrors.password = 'Hasło musi mieć min. 8 znaków'
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Hasła nie są identyczne'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    
    if (!formData.name) newErrors.name = 'Imię i nazwisko jest wymagane'
    if (!formData.company_name) newErrors.company_name = 'Nazwa firmy jest wymagana'
    if (!formData.nip) newErrors.nip = 'NIP jest wymagany'
    else if (formData.nip.replace(/\D/g, '').length !== 10) {
      newErrors.nip = 'NIP musi zawierać 10 cyfr'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateStep2()) return
    
    setIsLoading(true)
    
    try {
      // 1. Register user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const registerResult = await registerResponse.json()
      
      if (registerResult.success) {
        // 2. Auto-login after registration
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        })
        
        if (signInResult?.ok) {
          // 3. Redirect to onboarding
          window.location.href = '/onboarding'
        } else {
          setErrors({ general: 'Rejestracja udana, ale logowanie nie powiodło się' })
        }
      } else {
        setErrors({ general: registerResult.error || 'Rejestracja nie powiodła się' })
      }
    } catch (error) {
      setErrors({ general: 'Wystąpił błąd podczas rejestracji' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlanSelect = (plan) => {
    setFormData(prev => ({ ...prev, plan }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Stwórz konto OTORAPORT
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Onboarding zajmuje mniej niż 10 minut
          </p>
          
          {/* Progress indicator */}
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i === step
                      ? 'bg-blue-600 text-white'
                      : i < step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {i < step ? '✓' : i}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500 max-w-48 mx-auto">
            <span>Konto</span>
            <span>Firma</span>
            <span>Plan</span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Step 1: Account Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="jan.kowalski@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Hasło *
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum 8 znaków"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Potwierdź hasło *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Dalej
              </button>
            </div>
          )}

          {/* Step 2: Company Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Imię i nazwisko *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Jan Kowalski"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="nip" className="block text-sm font-medium text-gray-700">
                  NIP firmy *
                </label>
                <input
                  id="nip"
                  type="text"
                  value={formData.nip}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                    handleInputChange('nip', value)
                    handleNipLookup(value)
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1234567890"
                />
                {errors.nip && <p className="text-red-500 text-sm mt-1">{errors.nip}</p>}
                {isLoading && <p className="text-blue-500 text-sm mt-1">Sprawdzam NIP...</p>}
                {nipData && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    ✅ Znaleziono: {nipData.name}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                  Nazwa firmy *
                </label>
                <input
                  id="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nazwa Twojej firmy deweloperskiej"
                />
                {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefon (opcjonalnie)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+48 123 456 789"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Wstecz
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Dalej
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Plan Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 text-center">Wybierz plan</h3>
              
              <div className="space-y-3">
                {/* Basic Plan */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.plan === 'basic'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handlePlanSelect('basic')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Basic</h4>
                      <p className="text-sm text-gray-600">Podstawowy compliance</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">149 zł/mies</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${
                      formData.plan === 'basic' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </div>

                {/* Pro Plan */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all relative ${
                    formData.plan === 'pro'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handlePlanSelect('pro')}
                >
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    Popularne
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Pro</h4>
                      <p className="text-sm text-gray-600">+ Strony prezentacyjne</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">249 zł/mies</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${
                      formData.plan === 'pro' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </div>

                {/* Enterprise Plan */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.plan === 'enterprise'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handlePlanSelect('enterprise')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Enterprise</h4>
                      <p className="text-sm text-gray-600">+ API, white-label</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">399 zł/mies</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${
                      formData.plan === 'enterprise' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                🎉 14 dni darmowego okresu próbnego dla wszystkich planów!
              </div>

              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  {errors.general}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Wstecz
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Tworzenie konta...' : 'Stwórz konto'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Masz już konto?{' '}
            <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
              Zaloguj się
            </Link>
          </p>
        </div>

        {/* Google Sign Up */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Lub</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Kontynuuj z Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}