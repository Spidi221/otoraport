'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ProfileData {
  company_name: string
  nip: string
  regon: string
  krs_number: string
  phone: string
  website: string
}

export function ProfileSettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    company_name: '',
    nip: '',
    regon: '',
    krs_number: '',
    phone: '',
    website: '',
  })

  // Fetch profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/user/profile')
        const data = await response.json()

        if (data.success && data.developer) {
          setProfile({
            company_name: data.developer.company_name || '',
            nip: data.developer.nip || '',
            regon: data.developer.regon || '',
            krs_number: data.developer.krs_number || '',
            phone: data.developer.phone || '',
            website: data.developer.website || '',
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Nie udało się pobrać danych profilu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Profil został zaktualizowany')
      } else {
        toast.error(data.error || 'Nie udało się zaktualizować profilu')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Wystąpił błąd podczas aktualizacji profilu')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dane firmy</CardTitle>
          <CardDescription>Podstawowe informacje o Twojej firmie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dane firmy</CardTitle>
        <CardDescription>
          Podstawowe informacje o Twojej firmie wymagane do raportowania ministerialnego
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company_name">
                Nazwa firmy <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company_name"
                value={profile.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                required
                placeholder="np. Deweloper Sp. z o.o."
              />
            </div>

            {/* NIP */}
            <div className="space-y-2">
              <Label htmlFor="nip">
                NIP <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nip"
                value={profile.nip}
                onChange={(e) => handleChange('nip', e.target.value)}
                required
                placeholder="10 cyfr bez kresek"
                maxLength={10}
                pattern="\d{10}"
              />
              <p className="text-xs text-muted-foreground">Format: 10 cyfr (np. 1234567890)</p>
            </div>

            {/* REGON */}
            <div className="space-y-2">
              <Label htmlFor="regon">REGON</Label>
              <Input
                id="regon"
                value={profile.regon}
                onChange={(e) => handleChange('regon', e.target.value)}
                placeholder="9 lub 14 cyfr"
                maxLength={14}
                pattern="\d{9}|\d{14}"
              />
              <p className="text-xs text-muted-foreground">Format: 9 lub 14 cyfr</p>
            </div>

            {/* KRS */}
            <div className="space-y-2">
              <Label htmlFor="krs_number">Numer KRS</Label>
              <Input
                id="krs_number"
                value={profile.krs_number}
                onChange={(e) => handleChange('krs_number', e.target.value)}
                placeholder="np. 0000123456"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+48 123 456 789"
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Strona internetowa</Label>
              <Input
                id="website"
                type="url"
                value={profile.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://twoja-firma.pl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Zapisz zmiany
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
