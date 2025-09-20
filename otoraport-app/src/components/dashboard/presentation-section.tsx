'use client'

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Globe, Eye, Settings, ExternalLink, RefreshCw, Zap, Crown, Lock } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ErrorDisplay, useErrorHandling, CommonErrors } from "../ui/error-display";

interface DeploymentStatus {
  isDeployed: boolean;
  url?: string;
  deployedAt?: string;
  generatedAt?: string;
}

interface DeploymentResult {
  success: boolean;
  url?: string;
  deploymentType?: 'subdomain' | 'custom_domain';
  properties?: number;
  projects?: number;
  marketStats?: {
    avgPrice: number;
    avgPricePerM2: number;
    availableCount: number;
  };
}

export function PresentationSection() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { errors, addError, removeError, clearErrors } = useErrorHandling()

  // Check user profile and deployment status on mount
  useEffect(() => {
    if (session?.user) {
      checkUserProfile()
      checkDeploymentStatus()
    }
  }, [session])

  const checkUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error checking user profile:', error)
    }
  }

  const checkDeploymentStatus = async () => {
    try {
      const response = await fetch('/api/presentation/deploy')
      if (response.ok) {
        const data = await response.json()
        setDeploymentStatus(data.data)
      }
    } catch (error) {
      console.error('Error checking deployment status:', error)
    }
  }

  const handlePreview = async () => {
    if (!session?.user) {
      addError(CommonErrors.unauthorizedError())
      return
    }
    
    setIsLoading('preview')
    clearErrors()
    
    try {
      // First generate/update the presentation
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
          title: 'Błąd generowania podglądu',
          message: error.error || 'Nie udało się wygenerować podglądu strony.',
          code: error.code || 'PREVIEW_ERROR'
        })
        return
      }
      
      // Open preview
      window.open('/api/presentation/preview', '_blank')
      
      addError({
        type: 'success',
        message: 'Podgląd strony prezentacyjnej otwarty w nowej karcie.'
      })
      
    } catch (error) {
      console.error('Error with preview:', error)
      addError(CommonErrors.networkError(() => handlePreview()))
    } finally {
      setIsLoading(null)
    }
  }

  const handleDeploy = async () => {
    if (!session?.user) {
      addError(CommonErrors.unauthorizedError())
      return
    }
    
    setIsLoading('deploy')
    clearErrors()
    
    try {
      const response = await fetch('/api/presentation/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.status === 403) {
        const error = await response.json()
        addError(CommonErrors.subscriptionError(
          error.currentPlan, 
          () => window.location.href = '/pricing'
        ))
        return
      }
      
      if (!response.ok) {
        const error = await response.json()
        addError({
          type: 'error',
          title: 'Błąd wdrażania strony',
          message: error.error || 'Nie udało się wdrożyć strony prezentacyjnej.',
          code: error.code || 'DEPLOY_ERROR'
        })
        return
      }
      
      const result: DeploymentResult = await response.json()
      
      // Update deployment status
      await checkDeploymentStatus()
      
      addError({
        type: 'success',
        title: 'Strona została wdrożona!',
        message: `Twoja strona prezentacyjna jest teraz dostępna pod adresem ${result.data?.url}`
      })
      
    } catch (error) {
      console.error('Error deploying:', error)
      addError(CommonErrors.networkError(() => handleDeploy()))
    } finally {
      setIsLoading(null)
    }
  }

  const handleVisitSite = () => {
    if (deploymentStatus?.url) {
      window.open(deploymentStatus.url, '_blank')
    }
  }

  const isProOrEnterprise = userProfile?.subscription?.plan === 'pro' || userProfile?.subscription?.plan === 'enterprise'
  const isEnterprise = userProfile?.subscription?.plan === 'enterprise'
  const hasCustomDomain = userProfile?.custom_domain && userProfile?.custom_domain_verified

  if (!isProOrEnterprise) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Strona Prezentacyjna
            <Badge variant="outline" className="ml-auto">
              <Crown className="h-3 w-3 mr-1" />
              Pro/Enterprise
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Funkcja dostępna w pakietach Pro i Enterprise</h3>
              <p className="text-muted-foreground mb-4">
                Stwórz profesjonalną stronę prezentacyjną swojej oferty mieszkań z zaawansowanymi wykresami i statystykami.
              </p>
              <Button onClick={() => window.location.href = '/pricing'}>
                Zmień pakiet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Strona Prezentacyjna
            <div className="ml-auto flex gap-2">
              {deploymentStatus?.isDeployed && (
                <Badge variant="default" className="bg-green-600">
                  <Zap className="h-3 w-3 mr-1" />
                  Aktywna
                </Badge>
              )}
              <Badge variant="outline">
                {isEnterprise ? 'Enterprise' : 'Pro'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          {deploymentStatus?.isDeployed ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">Strona jest aktywna</h3>
                  <p className="text-green-700 text-sm">
                    {isEnterprise && hasCustomDomain 
                      ? `Dostępna na Twojej domenie: ${userProfile.custom_domain}`
                      : 'Dostępna na subdomenie OTORAPORT'
                    }
                  </p>
                  {deploymentStatus.deployedAt && (
                    <p className="text-green-600 text-xs mt-1">
                      Ostatnia aktualizacja: {new Date(deploymentStatus.deployedAt).toLocaleString('pl-PL')}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleVisitSite}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Odwiedź
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-900 mb-1">Gotowy do utworzenia strony?</h3>
                <p className="text-blue-700 text-sm">
                  Utwórz profesjonalną stronę prezentacyjną swojej oferty mieszkań
                </p>
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Zawartość strony:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Interaktywne wykresy Chart.js</li>
                <li>• Statystyki rynkowe</li>
                <li>• Historia cen (12 miesięcy)</li>
                <li>• Filtry wyszukiwania</li>
                <li>• Responsywny design</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Funkcje techniczne:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• SEO zoptymalizowana</li>
                <li>• Open Graph meta tagi</li>
                <li>• Sitemap.xml i robots.txt</li>
                <li>• SSL i HTTPS</li>
                {isEnterprise && <li>• Własna domena (Enterprise)</li>}
              </ul>
            </div>
          </div>

          {/* Domain Info for Enterprise */}
          {isEnterprise && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-purple-900">Enterprise: Własna domena</span>
              </div>
              {hasCustomDomain ? (
                <p className="text-purple-700 text-sm">
                  Twoja strona będzie dostępna na: <strong>{userProfile.custom_domain}</strong>
                </p>
              ) : (
                <div className="text-purple-700 text-sm">
                  <p className="mb-2">Skonfiguruj własną domenę w ustawieniach konta.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = '/settings/domains'}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Zarządzaj domeną
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handlePreview}
              disabled={!!isLoading}
              variant="outline"
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              {isLoading === 'preview' ? 'Generowanie...' : 'Podgląd'}
            </Button>
            
            <Button 
              onClick={handleDeploy}
              disabled={!!isLoading}
              className="flex-1"
            >
              {deploymentStatus?.isDeployed ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isLoading === 'deploy' ? 'Aktualizowanie...' : 'Aktualizuj'}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  {isLoading === 'deploy' ? 'Wdrażanie...' : 'Wdróż stronę'}
                </>
              )}
            </Button>
          </div>

          {/* Quick Stats */}
          {deploymentStatus?.isDeployed && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              URL: {deploymentStatus.url}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}