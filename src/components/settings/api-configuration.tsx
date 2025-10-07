'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Copy, RefreshCw, Loader2, ExternalLink } from 'lucide-react'

export function ApiConfiguration() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [clientId, setClientId] = useState('')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://otoraport.vercel.app'

  // Fetch client_id on mount
  useEffect(() => {
    async function fetchClientId() {
      try {
        const response = await fetch('/api/user/client-id')
        const data = await response.json()

        if (data.success && data.client_id) {
          setClientId(data.client_id)
        }
      } catch (error) {
        console.error('Error fetching client ID:', error)
        toast.error('Nie udało się pobrać Client ID')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientId()
  }, [])

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} skopiowano do schowka`)
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)

    try {
      const response = await fetch('/api/user/regenerate-client-id', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success && data.client_id) {
        setClientId(data.client_id)
        toast.success('Client ID został wygenerowany ponownie')
      } else {
        toast.error(data.error || 'Nie udało się wygenerować Client ID')
      }
    } catch (error) {
      console.error('Error regenerating client ID:', error)
      toast.error('Wystąpił błąd podczas generowania Client ID')
    } finally {
      setIsRegenerating(false)
    }
  }

  const xmlUrl = `${baseUrl}/api/public/${clientId}/data.xml`
  const csvUrl = `${baseUrl}/api/public/${clientId}/data.csv`

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Konfiguracja API</CardTitle>
          <CardDescription>Endpointy dla integracji z Ministerialnym Harvesterem</CardDescription>
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
        <CardTitle>Konfiguracja API</CardTitle>
        <CardDescription>
          Twój unikalny Client ID i endpointy dla integracji z Ministerialnym Harvesterem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client ID Section */}
        <div className="space-y-3">
          <Label htmlFor="client_id">Client ID</Label>
          <div className="flex gap-2">
            <Input
              id="client_id"
              value={clientId}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(clientId, 'Client ID')}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isRegenerating}>
                  {isRegenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Wygenerować nowy Client ID?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Spowoduje to zmianę wszystkich endpointów API. Stary Client ID przestanie działać.
                    Będziesz musiał zaktualizować konfigurację w systemach zewnętrznych.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRegenerate}>
                    Wygeneruj nowy
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p className="text-xs text-muted-foreground">
            Ten identyfikator jest używany w endpointach publicznych. Nie udostępniaj go nikomu.
          </p>
        </div>

        {/* XML Endpoint */}
        <div className="space-y-3">
          <Label htmlFor="xml_url">Endpoint XML (Harvester)</Label>
          <div className="flex gap-2">
            <Input
              id="xml_url"
              value={xmlUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(xmlUrl, 'URL XML')}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(xmlUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Endpoint zawierający metadane w formacie XML zgodnym z wymaganiami ministerstwa
          </p>
        </div>

        {/* CSV Endpoint */}
        <div className="space-y-3">
          <Label htmlFor="csv_url">Endpoint CSV (Dane mieszkań)</Label>
          <div className="flex gap-2">
            <Input
              id="csv_url"
              value={csvUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(csvUrl, 'URL CSV')}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(csvUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Endpoint zwracający pełne dane mieszkań w formacie CSV (58 kolumn ministerialnych)
          </p>
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Jak zgłosić endpointy do ministerstwa?
          </p>
          <ol className="space-y-1 text-blue-800 dark:text-blue-200 list-decimal list-inside">
            <li>Skopiuj URL XML (Harvester) powyżej</li>
            <li>Zaloguj się do systemu ministerialnego</li>
            <li>Wklej URL w formularzu zgłoszeniowym</li>
            <li>System automatycznie pobierze dane co 24h</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
