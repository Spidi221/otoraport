'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OtoraportLogo } from '@/components/icons/otoraport-logo'
import { supabase } from '@/lib/supabase'

function SignUpContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('basic')
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company_name: '',
  })
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get plan and period from URL params
    const plan = searchParams.get('plan') || 'basic'
    const period = searchParams.get('period') || 'monthly'
    setSelectedPlan(plan)
    setSelectedPeriod(period)
  }, [searchParams])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.email || !formData.password || !formData.name || !formData.company_name) {
      setError('Wszystkie pola są wymagane')
      return
    }

    if (formData.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie pasują do siebie')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Register with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            company_name: formData.company_name,
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message === 'User already registered' 
          ? 'Użytkownik o tym adresie email już istnieje'
          : 'Wystąpił błąd podczas rejestracji')
        console.error('Sign up error:', signUpError)
      } else if (data.user) {
        // Create developer profile immediately
        await createDeveloperProfile(data.user)
        
        setMessage('Konto zostało utworzone! Sprawdź email w celu potwierdzenia.')
        
        // Auto sign in after successful registration
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (error) {
      console.error('Sign up error:', error)
      setError('Wystąpił błąd podczas rejestracji')
    } finally {
      setIsLoading(false)
    }
  }

  const createDeveloperProfile = async (user: any) => {
    try {
      const clientId = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'unnamed'
      
      const { error: insertError } = await supabase
        .from('developers')
        .insert({
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email || 'Unnamed User',
          email: user.email,
          company_name: user.user_metadata?.company_name || 'Unnamed Company',
          client_id: clientId,
          xml_url: `${window.location.origin}/api/public/${clientId}/data.xml`,
          md5_url: `${window.location.origin}/api/public/${clientId}/data.md5`,
          status: 'trial',
          subscription_plan: 'basic',
          subscription_status: 'trial'
        })

      if (insertError) {
        console.error('Error creating developer profile:', insertError)
      }
    } catch (err) {
      console.error('Error managing developer profile:', err)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (googleError) {
        console.error('Google sign up error:', googleError)
        setError('Wystąpił błąd podczas rejestracji przez Google')
        setIsLoading(false)
      }
      // If successful, user will be redirected automatically
    } catch (error) {
      console.error('Google sign up error:', error)
      setError('Wystąpił błąd podczas rejestracji przez Google')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <OtoraportLogo />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Dołącz do OTORAPORT
          </h1>
          <p className="text-gray-600 mt-2">
            Rozpocznij 14-dniowy darmowy trial
            {selectedPlan && (
              <span className="block text-blue-600 font-semibold mt-1">
                Plan: {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} ({selectedPeriod === 'yearly' ? 'Roczny' : 'Miesięczny'})
              </span>
            )}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Utwórz konto</CardTitle>
            <CardDescription>
              Wprowadź swoje dane aby rozpocząć
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Imię i nazwisko
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Jan Kowalski"
                  required
                />
              </div>

              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa firmy
                </label>
                <Input
                  id="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Moja Firma Sp. z o.o."
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="twoj@email.pl"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Hasło
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Minimum 6 znaków"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Powtórz hasło
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Powtórz hasło"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {message}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Tworzenie konta...' : 'Utwórz konto'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">lub</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isLoading ? 'Rejestrowanie...' : 'Zarejestruj się przez Google'}
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Masz już konto?{' '}
                <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                  Zaloguj się
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Rejestrując się akceptujesz nasze{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Warunki użytkowania
            </Link>{' '}
            i{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Politykę prywatności
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}