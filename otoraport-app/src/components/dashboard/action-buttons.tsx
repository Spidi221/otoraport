'use client'

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Download, Send, Eye, BarChart3, Globe } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ErrorDisplay, useErrorHandling, CommonErrors } from "../ui/error-display";

export function ActionButtons() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { errors, addError, removeError, clearErrors } = useErrorHandling()

  const handleDownloadXML = async () => {
    if (!session?.user) {
      addError(CommonErrors.unauthorizedError())
      return
    }
    
    setIsLoading('xml')
    clearErrors()
    
    try {
      const response = await fetch('/api/user/client-id')
      
      if (!response.ok) {
        if (response.status === 401) {
          addError(CommonErrors.unauthorizedError())
          return
        }
        throw new Error('Failed to get client ID')
      }
      
      const data = await response.json()
      
      if (!data.client_id) {
        addError({
          type: 'error',
          title: 'Brak danych',
          message: 'Nie znaleziono ID klienta. Skontaktuj się z pomocą techniczną.',
          code: 'CLIENT_ID_NOT_FOUND'
        })
        return
      }

      // Open XML URL in new tab
      window.open(`/api/public/${data.client_id}/data.xml`, '_blank')
      
      addError({
        type: 'success',
        message: 'Raport XML został otwarty w nowej karcie.'
      })
      
    } catch (error) {
      console.error('Error downloading XML:', error)
      addError(CommonErrors.networkError(() => handleDownloadXML()))
    } finally {
      setIsLoading(null)
    }
  }

  const handleSendToMinistry = async () => {
    if (!session?.user) return
    
    setIsLoading('ministry')
    try {
      const response = await fetch('/api/ministry/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        alert('Powiadomienie wysłane do ministerstwa!')
      }
    } catch (error) {
      console.error('Error notifying ministry:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handlePreviewReport = async () => {
    if (!session?.user) return
    
    setIsLoading('preview')
    try {
      const response = await fetch('/api/user/client-id')
      const data = await response.json()
      
      if (data.client_id) {
        window.open(`/api/public/${data.client_id}/data.md`, '_blank')
      }
    } catch (error) {
      console.error('Error previewing report:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleAnalytics = () => {
    window.location.href = '/analytics'
  }

  const handlePresentationSite = async () => {
    if (!session?.user) {
      addError(CommonErrors.unauthorizedError())
      return
    }
    
    setIsLoading('presentation')
    clearErrors()
    
    try {
      // First try to generate/update the presentation site
      const generateResponse = await fetch('/api/presentation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (generateResponse.status === 403) {
        const error = await generateResponse.json()
        addError(CommonErrors.subscriptionError(
          error.currentPlan, 
          () => window.location.href = '/pricing'
        ))
        return
      }
      
      if (!generateResponse.ok) {
        const error = await generateResponse.json()
        addError({
          type: 'error',
          title: 'Błąd generowania strony',
          message: error.error || 'Nie udało się wygenerować strony prezentacyjnej.',
          code: error.code || 'PRESENTATION_ERROR'
        })
        return
      }
      
      // Open preview in new tab
      window.open('/api/presentation/preview', '_blank')
      
      addError({
        type: 'success',
        message: 'Strona prezentacyjna została wygenerowana i otwarta w nowej karcie.'
      })
      
    } catch (error) {
      console.error('Error with presentation site:', error)
      addError(CommonErrors.networkError(() => handlePresentationSite()))
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <>
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-3 mb-6">
          {errors.map((error, index) => (
            <ErrorDisplay 
              key={index} 
              error={error} 
              onDismiss={() => removeError(index)}
            />
          ))}
        </div>
      )}
      
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Button 
            onClick={handleDownloadXML}
            disabled={isLoading === 'xml'}
            className="h-auto flex-col gap-2 p-4"
          >
            <Download className="h-5 w-5" />
            <span className="text-xs">
              {isLoading === 'xml' ? 'Ładowanie...' : 'Pobierz XML'}
            </span>
          </Button>
          
          <Button 
            onClick={handleSendToMinistry}
            disabled={isLoading === 'ministry'}
            variant="outline" 
            className="h-auto flex-col gap-2 p-4"
          >
            <Send className="h-5 w-5" />
            <span className="text-xs">
              {isLoading === 'ministry' ? 'Wysyłanie...' : 'Wyślij do UOKiK'}
            </span>
          </Button>
          
          <Button 
            onClick={handlePreviewReport}
            disabled={isLoading === 'preview'}
            variant="outline" 
            className="h-auto flex-col gap-2 p-4"
          >
            <Eye className="h-5 w-5" />
            <span className="text-xs">
              {isLoading === 'preview' ? 'Ładowanie...' : 'Podgląd raportu'}
            </span>
          </Button>
          
          <Button 
            onClick={handleAnalytics}
            variant="outline" 
            className="h-auto flex-col gap-2 p-4"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Analityka</span>
          </Button>

          <Button 
            onClick={handlePresentationSite}
            disabled={isLoading === 'presentation'}
            variant="outline" 
            className="h-auto flex-col gap-2 p-4"
          >
            <Globe className="h-5 w-5" />
            <span className="text-xs">
              {isLoading === 'presentation' ? 'Generowanie...' : 'Strona prezent.'}
            </span>
          </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}