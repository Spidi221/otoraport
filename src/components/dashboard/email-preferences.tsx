'use client'

/**
 * Email Preferences Component
 * Allows users to manage their email notification preferences
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EmailPreferences {
  email_notifications_enabled: boolean
  email_weekly_digest: boolean
  email_data_staleness_alerts: boolean
  email_endpoint_health_alerts: boolean
  email_support_updates: boolean
  email_marketing: boolean
}

export function EmailPreferences() {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    email_notifications_enabled: true,
    email_weekly_digest: true,
    email_data_staleness_alerts: true,
    email_endpoint_health_alerts: true,
    email_support_updates: true,
    email_marketing: false
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load preferences on mount
  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/email-preferences')
      const data = await response.json()

      if (data.success) {
        setPreferences(data.preferences)
      } else {
        console.error('Failed to load preferences:', data.error)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (key: keyof EmailPreferences, value: boolean) => {
    setSaving(true)
    setMessage(null)

    // Optimistic update
    const oldPreferences = { ...preferences }
    setPreferences(prev => ({ ...prev, [key]: value }))

    try {
      const response = await fetch('/api/user/email-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Preferencje zaktualizowane' })
        setPreferences(data.preferences)
      } else {
        // Revert on error
        setPreferences(oldPreferences)
        setMessage({ type: 'error', text: 'Nie udało się zapisać zmian' })
      }
    } catch (error) {
      // Revert on error
      setPreferences(oldPreferences)
      setMessage({ type: 'error', text: 'Wystąpił błąd połączenia' })
      console.error('Error updating preference:', error)
    } finally {
      setSaving(false)
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ustawienia powiadomień email</CardTitle>
          <CardDescription>Ładowanie...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustawienia powiadomień email</CardTitle>
        <CardDescription>
          Zarządzaj typami emaili, które chcesz otrzymywać od OTO-RAPORT
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Master toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="space-y-0.5">
            <Label htmlFor="master-toggle" className="text-base font-semibold">
              Wszystkie powiadomienia
            </Label>
            <p className="text-sm text-muted-foreground">
              Główny przełącznik - wyłącza wszystkie emaile
            </p>
          </div>
          <Switch
            id="master-toggle"
            checked={preferences.email_notifications_enabled}
            onCheckedChange={(checked) => updatePreference('email_notifications_enabled', checked)}
            disabled={saving}
          />
        </div>

        {/* Individual preferences - disabled when master is off */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Typy powiadomień</h3>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-digest" className="font-medium">
                📊 Tygodniowe podsumowanie
              </Label>
              <p className="text-sm text-muted-foreground">
                Statystyki compliance i dostępności endpointów
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={preferences.email_weekly_digest}
              onCheckedChange={(checked) => updatePreference('email_weekly_digest', checked)}
              disabled={saving || !preferences.email_notifications_enabled}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="staleness-alerts" className="font-medium">
                ⏰ Alerty nieaktualnych danych
              </Label>
              <p className="text-sm text-muted-foreground">
                Powiadomienie gdy dane nie były aktualizowane przez X dni
              </p>
            </div>
            <Switch
              id="staleness-alerts"
              checked={preferences.email_data_staleness_alerts}
              onCheckedChange={(checked) => updatePreference('email_data_staleness_alerts', checked)}
              disabled={saving || !preferences.email_notifications_enabled}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="endpoint-alerts" className="font-medium">
                🚨 Alerty błędów endpointów
              </Label>
              <p className="text-sm text-muted-foreground">
                Natychmiastowe powiadomienie gdy endpoint ministerstwa nie działa
              </p>
            </div>
            <Switch
              id="endpoint-alerts"
              checked={preferences.email_endpoint_health_alerts}
              onCheckedChange={(checked) => updatePreference('email_endpoint_health_alerts', checked)}
              disabled={saving || !preferences.email_notifications_enabled}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="support-updates" className="font-medium">
                💬 Aktualizacje zgłoszeń support
              </Label>
              <p className="text-sm text-muted-foreground">
                Odpowiedzi na Twoje zgłoszenia do supportu
              </p>
            </div>
            <Switch
              id="support-updates"
              checked={preferences.email_support_updates}
              onCheckedChange={(checked) => updatePreference('email_support_updates', checked)}
              disabled={saving || !preferences.email_notifications_enabled}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="marketing" className="font-medium">
                📢 Newsletter marketingowy
              </Label>
              <p className="text-sm text-muted-foreground">
                Nowości produktowe, porady, case studies
              </p>
            </div>
            <Switch
              id="marketing"
              checked={preferences.email_marketing}
              onCheckedChange={(checked) => updatePreference('email_marketing', checked)}
              disabled={saving || !preferences.email_notifications_enabled}
            />
          </div>
        </div>

        {/* Info about unsubscribe */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Wskazówka:</strong> Każdy email zawiera link do natychmiastowego wypisania się ze wszystkich powiadomień.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
