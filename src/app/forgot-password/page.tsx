'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OtoRaportLogo } from '@/components/icons/oto-raport-logo'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError('Email jest wymagany')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      if (!supabase) {
        setError('Błąd konfiguracji - brak połączenia z bazą danych')
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message || 'Wystąpił błąd podczas wysyłania emaila')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)
    } catch {
      setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <OtoRaportLogo />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email wysłany!</CardTitle>
              <CardDescription>
                Sprawdź swoją skrzynkę pocztową
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                <p className="text-sm">
                  Wysłaliśmy instrukcje resetowania hasła na adres <strong>{email}</strong>
                </p>
                <p className="text-sm mt-2">
                  Jeśli nie otrzymasz emaila w ciągu kilku minut, sprawdź folder spam.
                </p>
              </div>

              <Link href="/auth/signin">
                <Button className="w-full" variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Powrót do logowania
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <OtoRaportLogo />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Zapomniałeś hasła?
          </h1>
          <p className="text-gray-600 mt-2">
            Nie martw się, pomożemy Ci je odzyskać
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resetuj hasło</CardTitle>
            <CardDescription>
              Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Adres email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="twoj@email.pl"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/auth/signin"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót do logowania
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Nie masz konta?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500">
              Zarejestruj się za darmo
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
