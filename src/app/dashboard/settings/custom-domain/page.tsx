'use client';

import { useEffect, useState } from 'react';
import { CustomDomainSetup } from '@/components/dashboard/custom-domain-setup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Crown, ExternalLink, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Custom Domain Settings Page
 *
 * Allows Enterprise users to configure custom domains
 * Shows upgrade prompt for non-Enterprise users
 */

interface DeveloperProfile {
  id: string;
  subscription_plan: string;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  custom_domain_added_to_vercel: boolean;
  custom_domain_dns_configured: boolean;
}

export default function CustomDomainPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (!data.success || !data.developer) {
        throw new Error('Nie można pobrać profilu');
      }

      setProfile(data.developer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd pobierania profilu');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = () => {
    // Refresh profile to show updated status
    fetchProfile();
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Nie można załadować danych'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const isEnterprise = profile.subscription_plan === 'enterprise';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Custom Domena</h1>
          <p className="text-gray-600">
            Skonfiguruj własną domenę dla strony z cenami mieszkań
          </p>
        </div>

        {/* Enterprise plan check */}
        {!isEnterprise ? (
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-purple-900">Plan Enterprise wymagany</CardTitle>
              </div>
              <CardDescription className="text-purple-700">
                Custom domena jest dostępna tylko w planie Enterprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg space-y-2">
                <p className="font-semibold text-gray-900">Z planem Enterprise otrzymasz:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>✅ Własną domenę (np. ceny.twojafirma.pl)</li>
                  <li>✅ Własne SSL certificate</li>
                  <li>✅ White-label branding</li>
                  <li>✅ Unlimited inwestycje i mieszkania</li>
                  <li>✅ Dedicated account manager</li>
                  <li>✅ Priority support (2h response)</li>
                  <li>✅ API access</li>
                  <li>✅ SLA 99.9% uptime</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => router.push('/dashboard/settings#subscription')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Przejdź na Enterprise
                  <Crown className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" asChild>
                  <a href="mailto:kontakt@oto-raport.pl">Skontaktuj się z nami</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current domain status */}
            {profile.custom_domain && (
              <Card>
                <CardHeader>
                  <CardTitle>Aktualna domena</CardTitle>
                  <CardDescription>Status konfiguracji twojej domeny</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{profile.custom_domain}</p>
                      <a
                        href={`https://${profile.custom_domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center mt-1"
                      >
                        Otwórz stronę
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={profile.custom_domain_verified ? 'default' : 'secondary'}>
                        {profile.custom_domain_verified ? 'Zweryfikowana' : 'Niezweryfikowana'}
                      </Badge>
                      {profile.custom_domain_verified && (
                        <Badge variant={profile.custom_domain_added_to_vercel ? 'default' : 'secondary'}>
                          {profile.custom_domain_added_to_vercel ? 'Dodano do Vercel' : 'Nie dodano do Vercel'}
                        </Badge>
                      )}
                      {profile.custom_domain_added_to_vercel && (
                        <Badge variant={profile.custom_domain_dns_configured ? 'default' : 'secondary'}>
                          {profile.custom_domain_dns_configured ? 'DNS skonfigurowane' : 'DNS nieskonfigurowane'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {!profile.custom_domain_dns_configured && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Konfiguracja domeny nie jest zakończona. Kontynuuj poniżej.
                      </AlertDescription>
                    </Alert>
                  )}

                  {profile.custom_domain_dns_configured && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-800">
                        ✅ Domena jest w pełni skonfigurowana i aktywna!
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Setup wizard */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {profile.custom_domain ? 'Kontynuuj konfigurację' : 'Konfiguracja domeny'}
                </CardTitle>
                <CardDescription>
                  {profile.custom_domain
                    ? 'Dokończ konfigurację swojej domeny'
                    : 'Skonfiguruj własną domenę w kilku prostych krokach'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomDomainSetup
                  currentDomain={profile.custom_domain}
                  verified={profile.custom_domain_verified}
                  addedToVercel={profile.custom_domain_added_to_vercel}
                  dnsConfigured={profile.custom_domain_dns_configured}
                  onSetupComplete={handleSetupComplete}
                />
              </CardContent>
            </Card>

            {/* Help section */}
            <Card>
              <CardHeader>
                <CardTitle>Potrzebujesz pomocy?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Problemy z konfiguracją DNS?</strong>
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Sprawdź czy dodałeś poprawne rekordy w panelu DNS</li>
                    <li>• Poczekaj 5-60 minut na propagację DNS</li>
                    <li>• Sprawdź status propagacji na{' '}
                      <a
                        href="https://www.whatsmydns.net/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        whatsmydns.net
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Nadal masz problem?</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Skontaktuj się z naszym dedicated account managerem:
                  </p>
                  <Button variant="outline" asChild>
                    <a href="mailto:kontakt@oto-raport.pl">
                      Wyślij email
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
