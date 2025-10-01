'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Building2, User, Bell, Shield, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [emailData, setEmailData] = useState({
    newEmail: '',
    confirmEmail: ''
  })
  const [changingEmail, setChangingEmail] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        const supabase = createClient(); const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/auth/signin')
          return
        }

        setUser(user)

        // Load developer profile
        const { data: developerProfile } = await supabase
          .from('developers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (developerProfile) {
          setProfile(developerProfile)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndProfile()
  }, [router])

  const handleSave = async (formData: any) => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('developers')
        .update(formData)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Ustawienia zostały zapisane')

      // Reload profile to show updated data
      const { data: updatedProfile } = await supabase
        .from('developers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (updatedProfile) {
        setProfile(updatedProfile)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Błąd podczas zapisywania ustawień')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Wypełnij wszystkie pola')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Hasło musi mieć minimum 8 znaków')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Hasła nie są identyczne')
      return
    }

    setChangingPassword(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        console.error('Password update error:', error)
        toast.error('Błąd podczas zmiany hasła: ' + error.message)
      } else {
        toast.success('Hasło zostało zmienione pomyślnie')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast.error('Wystąpił błąd podczas zmiany hasła')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!emailData.newEmail || !emailData.confirmEmail) {
      toast.error('Wypełnij wszystkie pola')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailData.newEmail)) {
      toast.error('Podaj prawidłowy adres email')
      return
    }

    if (emailData.newEmail !== emailData.confirmEmail) {
      toast.error('Adresy email nie są identyczne')
      return
    }

    if (emailData.newEmail === user?.email) {
      toast.error('Nowy email jest taki sam jak obecny')
      return
    }

    setChangingEmail(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        email: emailData.newEmail
      })

      if (error) {
        console.error('Email update error:', error)
        toast.error('Błąd podczas zmiany emaila: ' + error.message)
      } else {
        toast.success('Email został zmieniony! Sprawdź obie skrzynki (stary i nowy email) aby potwierdzić zmianę.')
        setEmailData({
          newEmail: '',
          confirmEmail: ''
        })
      }
    } catch (error) {
      console.error('Email change error:', error)
      toast.error('Wystąpił błąd podczas zmiany emaila')
    } finally {
      setChangingEmail(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ustawienia</h1>
        <p className="text-gray-600">Zarządzaj ustawieniami konta i preferencjami</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 mr-2" />
            Firma
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Powiadomienia
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Bezpieczeństwo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Dane osobowe</CardTitle>
              <CardDescription>Zaktualizuj swoje dane osobowe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Imię i nazwisko</Label>
                  <Input
                    id="name"
                    defaultValue={profile?.name || ''}
                    placeholder="Jan Kowalski"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (obecny)</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    defaultValue={profile?.phone || ''}
                    placeholder="+48 123 456 789"
                  />
                </div>
              </div>
              <Button onClick={() => handleSave({ name: 'Updated' })} disabled={saving}>
                {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>

              {/* Change Email Section */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-medium">Zmień adres email</h3>
                <p className="text-sm text-gray-600">
                  Po zmianie emaila otrzymasz wiadomości weryfikacyjne na oba adresy (stary i nowy).
                  Musisz potwierdzić zmianę w obu wiadomościach.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">Nowy adres email</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={emailData.newEmail}
                      onChange={(e) => setEmailData({...emailData, newEmail: e.target.value})}
                      placeholder="nowy@email.pl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Potwierdź nowy email</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      value={emailData.confirmEmail}
                      onChange={(e) => setEmailData({...emailData, confirmEmail: e.target.value})}
                      placeholder="nowy@email.pl"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleChangeEmail}
                  disabled={changingEmail}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  {changingEmail ? 'Wysyłanie...' : 'Zmień adres email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Dane firmy</CardTitle>
              <CardDescription>Informacje o Twojej firmie deweloperskiej</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Nazwa firmy</Label>
                  <Input
                    id="company_name"
                    defaultValue={profile?.company_name || ''}
                    placeholder="Nazwa Dewelopera Sp. z o.o."
                  />
                </div>
                <div>
                  <Label htmlFor="nip">NIP</Label>
                  <Input
                    id="nip"
                    defaultValue={profile?.nip || ''}
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="regon">REGON</Label>
                  <Input
                    id="regon"
                    defaultValue={profile?.regon || ''}
                    placeholder="123456789"
                  />
                </div>
              </div>
              <Button onClick={() => handleSave({ company_name: 'Updated' })} disabled={saving}>
                {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Powiadomienia</CardTitle>
              <CardDescription>Zarządzaj powiadomieniami email</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Opcje powiadomień będą dostępne wkrótce.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Bezpieczeństwo</CardTitle>
              <CardDescription>Zarządzaj ustawieniami bezpieczeństwa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Zmień hasło</h3>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nowe hasło</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="Minimum 8 znaków"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      placeholder="Powtórz hasło"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  {changingPassword ? 'Zapisywanie...' : 'Zmień hasło'}
                </Button>
              </div>

              {/* Divider */}
              <div className="border-t pt-6">
                <Button variant="outline" onClick={() => createClient().auth.signOut()}>
                  Wyloguj się ze wszystkich urządzeń
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}