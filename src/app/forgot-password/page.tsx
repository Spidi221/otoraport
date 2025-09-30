'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OtoraportLogo } from '@/components/icons/otoraport-logo'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Podaj adres email')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Podaj poprawny adres email')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        console.error('Password reset error:', error)
        toast.error('Błąd podczas wysyłania emaila. Spróbuj ponownie.')
        return
      }

      setEmailSent(true)
      toast.success('Email z linkiem do resetowania hasła został wysłany')
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('Wystąpił błąd. Spróbuj ponownie później.')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <OtoraportLogo className="h-12 w-auto" />
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Sprawdź swoją skrzynkę</CardTitle>
              <CardDescription className="text-base">
                Wysłaliśmy email z linkiem do resetowania hasła na adres:
              </CardDescription>
              <p className="text-sm font-medium text-gray-900">{email}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Wskazówka:</p>
              <p>Link do resetowania hasła jest ważny przez 60 minut. Jeśli nie widzisz emaila, sprawdź folder SPAM.</p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/signin')}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót do logowania
              </Button>
              <Button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                }}
                variant="ghost"
                className="w-full"
              >
                Wyślij email ponownie
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <OtoraportLogo className="h-12 w-auto" />
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">Zapomniałeś hasła?</CardTitle>
            <CardDescription>
              Podaj swój adres email, a wyślemy Ci link do resetowania hasła
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Adres email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
                autoComplete="email"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Wyślij link do resetowania
                </>
              )}
            </Button>

            <div className="text-center pt-4">
              <Link
                href="/auth/signin"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Powrót do logowania
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
