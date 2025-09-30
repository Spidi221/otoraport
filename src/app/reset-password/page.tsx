'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OtoraportLogo } from '@/components/icons/otoraport-logo'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [hasAccessToken, setHasAccessToken] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have access token in URL (from email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    if (accessToken && type === 'recovery') {
      setHasAccessToken(true)
    } else {
      // No valid token, redirect to forgot-password
      toast.error('Link jest nieprawidłowy lub wygasł')
      setTimeout(() => router.push('/forgot-password'), 2000)
    }
  }, [router])

  const validatePassword = () => {
    if (password.length < 8) {
      toast.error('Hasło musi mieć minimum 8 znaków')
      return false
    }

    if (password !== confirmPassword) {
      toast.error('Hasła nie są identyczne')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePassword()) return

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('Password update error:', error)
        toast.error('Błąd podczas zmiany hasła. Spróbuj ponownie.')
        return
      }

      setResetSuccess(true)
      toast.success('Hasło zostało zmienione')

      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('Wystąpił błąd. Spróbuj ponownie później.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasAccessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <OtoraportLogo className="h-12 w-auto" />
            </div>
            <CardTitle>Sprawdzanie linku...</CardTitle>
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

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <OtoraportLogo className="h-12 w-auto" />
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Hasło zmienione!</CardTitle>
              <CardDescription className="text-base">
                Twoje hasło zostało pomyślnie zmienione. Za chwilę zostaniesz przekierowany do strony logowania.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              Przejdź do logowania
            </Button>
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
            <CardTitle className="text-2xl font-bold">Ustaw nowe hasło</CardTitle>
            <CardDescription>
              Wprowadź nowe hasło dla swojego konta
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Nowe hasło
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 znaków"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pr-10"
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Potwierdź nowe hasło
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Powtórz hasło"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Wymagania dotyczące hasła:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Minimum 8 znaków</li>
                <li>Oba hasła muszą być identyczne</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Zmień hasło
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/auth/signin"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Anuluj i wróć do logowania
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
