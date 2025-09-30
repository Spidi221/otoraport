'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Building2, User, Bell, Shield } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
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
      const { error } = await supabase
        .from('developers')
        .update(formData)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Ustawienia zostały zapisane')
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
                  <Label htmlFor="email">Email</Label>
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
            <CardContent>
              <Button variant="outline" onClick={() => createClient().auth.signOut()}>
                Wyloguj się ze wszystkich urządzeń
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}