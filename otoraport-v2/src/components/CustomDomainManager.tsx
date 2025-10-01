'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react';

interface DomainConfig {
  hasCustomDomain: boolean;
  domain?: string;
  verified?: boolean;
  presentationUrl?: string;
  lastGenerated?: string;
  status?: string;
  dnsInstructions?: string;
  canSetup?: boolean;
  requiresUpgrade?: boolean;
  currentPlan?: string;
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
}

export default function CustomDomainManager() {
  const [domainConfig, setDomainConfig] = useState<DomainConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Load domain configuration on component mount
  useEffect(() => {
    loadDomainConfig();
  }, []);

  const loadDomainConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/domains/setup');
      const data = await response.json();

      if (data.success) {
        setDomainConfig(data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load domain config' });
      }
    } catch (error) {
      console.error('Error loading domain config:', error);
      setMessage({ type: 'error', text: 'Network error loading domain config' });
    } finally {
      setLoading(false);
    }
  };

  const setupDomain = async () => {
    if (!newDomain.trim()) {
      setMessage({ type: 'error', text: 'Please enter a domain name' });
      return;
    }

    try {
      setSetupLoading(true);
      setMessage(null);

      const response = await fetch('/api/domains/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Domena ${data.domain} została skonfigurowana. Skonfiguruj DNS aby zakończyć setup.`
        });
        setDnsRecords(data.dnsRecords || []);
        await loadDomainConfig(); // Refresh config
        setNewDomain('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Domain setup failed' });
      }
    } catch (error) {
      console.error('Domain setup error:', error);
      setMessage({ type: 'error', text: 'Network error during domain setup' });
    } finally {
      setSetupLoading(false);
    }
  };

  const verifyDomain = async () => {
    try {
      setVerifyLoading(true);
      setMessage(null);

      const response = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success && data.verified) {
        setMessage({
          type: 'success',
          text: `Domena ${data.domain} została pomyślnie zweryfikowana!`
        });
        await loadDomainConfig(); // Refresh config
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Domain verification failed'
        });
      }
    } catch (error) {
      console.error('Domain verification error:', error);
      setMessage({ type: 'error', text: 'Network error during verification' });
    } finally {
      setVerifyLoading(false);
    }
  };

  const deployPresentation = async () => {
    try {
      setDeployLoading(true);
      setMessage(null);

      const response = await fetch('/api/domains/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Strona prezentacyjna została wdrożona na ${data.domain}!`
        });
        await loadDomainConfig(); // Refresh config
      } else {
        setMessage({ type: 'error', text: data.error || 'Deployment failed' });
      }
    } catch (error) {
      console.error('Deployment error:', error);
      setMessage({ type: 'error', text: 'Network error during deployment' });
    } finally {
      setDeployLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'info', text: 'Skopiowano do schowka' });
    setTimeout(() => setMessage(null), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Ładowanie konfiguracji domeny...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' :
                        message.type === 'success' ? 'border-green-500' : 'border-blue-500'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Main Domain Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Custom Domain (Enterprise)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upgrade Required */}
          {domainConfig?.requiresUpgrade && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Custom domains są dostępne w planie Enterprise (399 zł/miesiąc).
                Aktualny plan: <Badge variant="outline">{domainConfig.currentPlan}</Badge>
                <Button className="ml-2" size="sm">Upgrade do Enterprise</Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Setup New Domain */}
          {domainConfig?.canSetup && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Skonfiguruj Custom Domain</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Podaj domenę którą chcesz używać dla swojej strony prezentacyjnej (np. mieszkania.mojafirma.pl)
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="mieszkania.mojafirma.pl"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={setupDomain}
                  disabled={setupLoading || !newDomain.trim()}
                  className="px-6"
                >
                  {setupLoading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                  Setup
                </Button>
              </div>
            </div>
          )}

          {/* Existing Domain Status */}
          {domainConfig?.hasCustomDomain && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Skonfigurowana Domena</h3>
                  <p className="text-sm text-gray-600">{domainConfig.domain}</p>
                </div>
                <Badge
                  variant={domainConfig.verified ? 'default' : 'secondary'}
                  className={domainConfig.verified ? 'bg-green-100 text-green-800' : ''}
                >
                  {domainConfig.verified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Zweryfikowana
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Oczekuje weryfikacji
                    </>
                  )}
                </Badge>
              </div>

              {/* Verification Actions */}
              {!domainConfig.verified && (
                <div className="space-y-3">
                  <Button
                    onClick={verifyDomain}
                    disabled={verifyLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {verifyLoading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Zweryfikuj Domenę
                  </Button>

                  <Alert>
                    <AlertDescription>
                      Skonfiguruj poniższe rekordy DNS u swojego dostawcy domeny, następnie kliknij "Zweryfikuj Domenę".
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Presentation URL */}
              {domainConfig.verified && domainConfig.presentationUrl && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="text-sm font-medium text-green-800">Strona Prezentacyjna</p>
                      <p className="text-sm text-green-600">{domainConfig.presentationUrl}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(domainConfig.presentationUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Otwórz
                    </Button>
                  </div>

                  {domainConfig.lastGenerated && (
                    <p className="text-xs text-gray-500">
                      Ostatnia aktualizacja: {new Date(domainConfig.lastGenerated).toLocaleString('pl-PL')}
                    </p>
                  )}
                </div>
              )}

              {/* Deploy Button */}
              {domainConfig.verified && (
                <Button
                  onClick={deployPresentation}
                  disabled={deployLoading}
                  className="w-full"
                >
                  {deployLoading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                  <Settings className="h-4 w-4 mr-2" />
                  {domainConfig.presentationUrl ? 'Zaktualizuj Stronę' : 'Wdróż Stronę Prezentacyjną'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Configuration Card */}
      {(dnsRecords.length > 0 || domainConfig?.dnsInstructions) && (
        <Card>
          <CardHeader>
            <CardTitle>Konfiguracja DNS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Dodaj poniższe rekordy DNS w panelu swojego dostawcy domeny:
            </p>

            {dnsRecords.length > 0 && (
              <div className="space-y-3">
                {dnsRecords.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 text-sm">
                        <Badge variant="outline">{record.type}</Badge>
                        <span className="font-medium">{record.name}</span>
                        <span className="text-gray-600">→</span>
                        <code className="bg-white px-2 py-1 rounded text-xs">{record.value}</code>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(record.value)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Instrukcje:</strong><br />
                1. Zaloguj się do panelu swojego dostawcy domeny<br />
                2. Znajdź sekcję zarządzania DNS/rekordami<br />
                3. Dodaj powyższe rekordy<br />
                4. Poczekaj na propagację DNS (5-30 minut)<br />
                5. Wróć tutaj i kliknij "Zweryfikuj Domenę"
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Korzyści z Custom Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Profesjonalny wizerunek firmy
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Automatyczne SSL certificate
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              SEO optimization dla Twojej domeny
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Interaktywna strona z historią cen
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Automatyczne aktualizacje codziennie
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}