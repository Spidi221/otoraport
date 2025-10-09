'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Copy, AlertCircle, ExternalLink } from 'lucide-react';

/**
 * Custom Domain Setup Wizard
 *
 * Multi-step wizard for setting up custom domains (Enterprise plan only)
 * Steps:
 * 1. Enter domain
 * 2. Add TXT record for verification
 * 3. Verify TXT record
 * 4. Add to Vercel
 * 5. Configure DNS (A/CNAME)
 * 6. Check propagation
 */

type SetupStep = 'register' | 'verify-txt' | 'add-to-vercel' | 'configure-dns' | 'check-propagation' | 'completed';

interface DomainSetupState {
  domain: string;
  verificationToken?: string;
  txtRecordName?: string;
  dnsRecordType?: 'A' | 'CNAME';
  dnsRecordHost?: string;
  dnsRecordValue?: string;
  verified: boolean;
  addedToVercel: boolean;
  dnsConfigured: boolean;
}

interface CustomDomainSetupProps {
  currentDomain?: string | null;
  verified?: boolean;
  addedToVercel?: boolean;
  dnsConfigured?: boolean;
  onSetupComplete?: () => void;
}

export function CustomDomainSetup({
  currentDomain,
  verified = false,
  addedToVercel = false,
  dnsConfigured = false,
  onSetupComplete,
}: CustomDomainSetupProps) {
  const [step, setStep] = useState<SetupStep>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [state, setState] = useState<DomainSetupState>({
    domain: currentDomain || '',
    verified,
    addedToVercel,
    dnsConfigured,
  });

  // Determine initial step based on current state
  useEffect(() => {
    if (currentDomain) {
      if (dnsConfigured) {
        setStep('completed');
      } else if (addedToVercel) {
        setStep('configure-dns');
      } else if (verified) {
        setStep('add-to-vercel');
      } else {
        setStep('verify-txt');
      }
    }
  }, [currentDomain, verified, addedToVercel, dnsConfigured]);

  // Copy to clipboard helper
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Step 1: Register domain
  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/custom-domain/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: state.domain }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Błąd rejestracji domeny');
      }

      setState({
        ...state,
        domain: data.domain,
        verificationToken: data.verification.token,
        txtRecordName: data.verification.txtRecordName,
      });

      setStep('verify-txt');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieoczekiwany błąd');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify TXT record
  const handleVerifyTxt = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/custom-domain/verify', {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Nie znaleziono rekordu TXT');
      }

      setState({ ...state, verified: true });
      setStep('add-to-vercel');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieoczekiwany błąd');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Add to Vercel
  const handleAddToVercel = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/custom-domain/add-to-vercel', {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Błąd dodawania do Vercel');
      }

      setState({
        ...state,
        addedToVercel: true,
        dnsRecordType: data.verification?.type,
        dnsRecordHost: data.verification?.name || state.domain,
        dnsRecordValue: data.verification?.value,
      });

      setStep('configure-dns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieoczekiwany błąd');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Check DNS propagation
  const handleCheckPropagation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/custom-domain/check-propagation');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Błąd sprawdzania DNS');
      }

      if (data.configured) {
        setState({ ...state, dnsConfigured: true });
        setStep('completed');
        if (onSetupComplete) {
          onSetupComplete();
        }
      } else {
        setError('DNS nie jest jeszcze skonfigurowane. Poczekaj 5-30 minut i spróbuj ponownie.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieoczekiwany błąd');
    } finally {
      setLoading(false);
    }
  };

  // Render copy button
  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="ml-2"
    >
      {copiedField === field ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          Skopiowano
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-1" />
          Kopiuj
        </>
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {['register', 'verify-txt', 'add-to-vercel', 'configure-dns', 'completed'].map((s, index) => {
          const isActive = step === s;
          const isCompleted =
            (s === 'register' && state.domain) ||
            (s === 'verify-txt' && state.verified) ||
            (s === 'add-to-vercel' && state.addedToVercel) ||
            (s === 'configure-dns' && state.dnsConfigured) ||
            (s === 'completed' && state.dnsConfigured);

          return (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              {index < 4 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
            </div>
          );
        })}
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Register domain */}
      {step === 'register' && (
        <Card>
          <CardHeader>
            <CardTitle>Krok 1: Wprowadź domenę</CardTitle>
            <CardDescription>
              Podaj domenę, którą chcesz użyć (np. ceny.twojafirma.pl)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="ceny.twojafirma.pl"
                value={state.domain}
                onChange={(e) => setState({ ...state, domain: e.target.value })}
                disabled={loading}
              />
            </div>
            <Button onClick={handleRegister} disabled={loading || !state.domain}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zarejestruj domenę
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Verify TXT record */}
      {step === 'verify-txt' && (
        <Card>
          <CardHeader>
            <CardTitle>Krok 2: Dodaj rekord TXT</CardTitle>
            <CardDescription>
              Dodaj poniższy rekord TXT w panelu zarządzania DNS swojej domeny
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Host / Nazwa:</p>
                  <CopyButton text={state.txtRecordName || ''} field="txt-name" />
                </div>
                <code className="text-sm bg-white px-3 py-2 rounded border mt-1 block">
                  {state.txtRecordName}
                </code>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Wartość / Value:</p>
                  <CopyButton text={state.verificationToken || ''} field="txt-value" />
                </div>
                <code className="text-sm bg-white px-3 py-2 rounded border mt-1 block break-all">
                  {state.verificationToken}
                </code>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700">TTL:</p>
                <code className="text-sm bg-white px-3 py-2 rounded border mt-1 block">
                  3600 (lub domyślny)
                </code>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Propagacja DNS może zająć 5-30 minut. Po dodaniu rekordu, poczekaj chwilę i kliknij "Weryfikuj DNS".
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={handleVerifyTxt} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Weryfikuj DNS
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://www.whatsmydns.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sprawdź propagację DNS
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Add to Vercel */}
      {step === 'add-to-vercel' && (
        <Card>
          <CardHeader>
            <CardTitle>Krok 3: Dodaj do Vercel</CardTitle>
            <CardDescription>
              Domena została zweryfikowana! Teraz dodamy ją do Vercel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Weryfikacja DNS zakończona sukcesem!
              </AlertDescription>
            </Alert>

            <Button onClick={handleAddToVercel} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dodaj do Vercel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Configure DNS */}
      {step === 'configure-dns' && (
        <Card>
          <CardHeader>
            <CardTitle>Krok 4: Skonfiguruj DNS</CardTitle>
            <CardDescription>
              Dodaj poniższy rekord {state.dnsRecordType} w panelu zarządzania DNS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">Typ rekordu:</p>
                <Badge className="mt-1">{state.dnsRecordType}</Badge>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Host / Nazwa:</p>
                  <CopyButton text={state.dnsRecordHost || ''} field="dns-host" />
                </div>
                <code className="text-sm bg-white px-3 py-2 rounded border mt-1 block">
                  {state.dnsRecordType === 'CNAME'
                    ? state.domain
                    : `@ (lub ${state.domain})`}
                </code>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    {state.dnsRecordType === 'CNAME' ? 'Target / Cel' : 'IP Address'}:
                  </p>
                  <CopyButton text={state.dnsRecordValue || ''} field="dns-value" />
                </div>
                <code className="text-sm bg-white px-3 py-2 rounded border mt-1 block">
                  {state.dnsRecordValue}
                </code>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700">TTL:</p>
                <code className="text-sm bg-white px-3 py-2 rounded border mt-1 block">
                  3600 (lub domyślny)
                </code>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Propagacja DNS może zająć 5-60 minut. Po dodaniu rekordu, poczekaj chwilę i sprawdź status.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={handleCheckPropagation} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sprawdź propagację
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={`https://www.whatsmydns.net/#${state.dnsRecordType}/${state.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sprawdź DNS globalnie
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Completed */}
      {step === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Gotowe! 🎉</CardTitle>
            <CardDescription>
              Twoja domena jest skonfigurowana i gotowa do użycia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Domena <strong>{state.domain}</strong> jest aktywna!
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Twoja strona z cenami jest dostępna pod adresem:</p>
              <a
                href={`https://${state.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                https://{state.domain}
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
