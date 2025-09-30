'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OtoraportLogo } from '@/components/icons/otoraport-logo'
import { createClient } from '@/lib/supabase/client'
import { Mail, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'success' | 'error' | 'pending'>('pending')
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already verified
    const checkVerificationStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setEmail(user.email || '')

        // Check if email is verified
        if (user.email_confirmed_at) {
          setVerificationStatus('success')
          setTimeout(() => router.push('/dashboard'), 2000)
        } else {
          setVerificationStatus('pending')
        }
      } else {
        // No user logged in, redirect to signin
        router.push('/auth/signin')
      }
    }

    checkVerificationStatus()
  }, [router, supabase])

  const handleResendEmail = async () => {
    setResendLoading(true)
    setResendMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        setResendMessage('Błąd podczas wysyłania emaila. Spróbuj ponownie.')
      } else {
        setResendMessage('Email weryfikacyjny został wysłany ponownie!')
      }
    } catch (error) {
      console.error('Resend email error:', error)
      setResendMessage('Wystąpił błąd. Spróbuj ponownie później.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    setVerificationStatus('checking')

    const { data: { user } } = await supabase.auth.getUser()

    if (user?.email_confirmed_at) {
      setVerificationStatus('success')
      setTimeout(() => router.push('/dashboard'), 2000)
    } else {
      setVerificationStatus('pending')
      setResendMessage('Email jeszcze nie został zweryfikowany')
    }
  }

  if (verificationStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <OtoraportLogo className="h-12 w-auto" />
            </div>
            <CardTitle>Sprawdzanie statusu...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center mb-4">
              <OtoraportLogo className="h-12 w-auto" />
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Email zweryfikowany!</CardTitle>
              <CardDescription className="text-base">
                Twój email został pomyślnie zweryfikowany. Za chwilę zostaniesz przekierowany do dashboardu.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              Przejdź do Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <OtoraportLogo className="h-12 w-auto" />
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Zweryfikuj swój email</CardTitle>
            <CardDescription className="text-base">
              Wysłaliśmy email weryfikacyjny na adres:
            </CardDescription>
            <p className="text-sm font-medium text-gray-900">{email}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <h3 className="font-semibold text-blue-900 text-sm">Jak zweryfikować email?</h3>
            </div>
            <ol className="text-sm text-blue-800 space-y-1 ml-6 list-decimal">
              <li>Otwórz swoją skrzynkę email</li>
              <li>Znajdź wiadomość od OTORAPORT</li>
              <li>Kliknij link weryfikacyjny w emailu</li>
              <li>Wróć tutaj i kliknij "Sprawdź status"</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              💡 Wskazówka: Jeśli nie widzisz emaila, sprawdź folder SPAM
            </p>
          </div>

          {/* Resend message */}
          {resendMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              resendMessage.includes('błąd') || resendMessage.includes('Błąd')
                ? 'bg-red-50 text-red-800 border border-red-200'
                : resendMessage.includes('nie został')
                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}>
              {resendMessage}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleCheckStatus}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sprawdź status weryfikacji
            </Button>

            <Button
              onClick={handleResendEmail}
              disabled={resendLoading}
              variant="outline"
              className="w-full"
            >
              {resendLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Wyślij email ponownie
                </>
              )}
            </Button>
          </div>

          {/* Support */}
          <div className="border-t pt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Problemy z weryfikacją?
            </p>
            <Link href="mailto:support@otoraport.pl" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Skontaktuj się z nami
            </Link>
          </div>

          {/* Back to signin */}
          <div className="text-center pt-2">
            <Link href="/auth/signin" className="text-sm text-gray-600 hover:text-gray-800">
              Powrót do logowania
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
