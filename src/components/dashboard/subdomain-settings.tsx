'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubdomainSettingsProps {
  currentSubdomain?: string | null;
  subscriptionPlan?: string | null;
}

export function SubdomainSettings({ currentSubdomain, subscriptionPlan }: SubdomainSettingsProps) {
  const [subdomain, setSubdomain] = useState(currentSubdomain || '');
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    reason?: string;
  } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debouncedSubdomain, setDebouncedSubdomain] = useState(subdomain);

  // Check if user has Pro or Enterprise plan
  const hasRequiredPlan = ['pro', 'enterprise'].includes(subscriptionPlan || '');

  // Debounce subdomain input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSubdomain(subdomain);
    }, 500);

    return () => clearTimeout(timer);
  }, [subdomain]);

  // Check availability when debounced value changes
  useEffect(() => {
    if (!debouncedSubdomain || debouncedSubdomain === currentSubdomain) {
      setAvailabilityStatus(null);
      return;
    }

    // Validate format first (client-side)
    const isValid = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(debouncedSubdomain);
    if (!isValid) {
      setAvailabilityStatus({
        available: false,
        reason: 'Subdomena może zawierać tylko małe litery, cyfry i myślniki'
      });
      return;
    }

    if (debouncedSubdomain.length < 3) {
      setAvailabilityStatus({
        available: false,
        reason: 'Subdomena musi mieć minimum 3 znaki'
      });
      return;
    }

    checkAvailability(debouncedSubdomain);
  }, [debouncedSubdomain, currentSubdomain]);

  const checkAvailability = async (subdomainToCheck: string) => {
    setCheckingAvailability(true);
    setError(null);

    try {
      const response = await fetch('/api/subdomain/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain: subdomainToCheck })
      });

      const data = await response.json();
      setAvailabilityStatus(data);
    } catch (err) {
      console.error('Error checking availability:', err);
      setAvailabilityStatus({
        available: false,
        reason: 'Błąd podczas sprawdzania dostępności'
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleClaim = async () => {
    if (!subdomain || !availabilityStatus?.available) return;

    setClaiming(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/subdomain/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Nie udało się przypisać subdomeny');
        return;
      }

      setSuccess(`Subdomena została przypisana! Twoja strona: ${data.url}`);
      setAvailabilityStatus(null);
    } catch (err) {
      console.error('Error claiming subdomain:', err);
      setError('Wystąpił nieoczekiwany błąd');
    } finally {
      setClaiming(false);
    }
  };

  if (!hasRequiredPlan) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Subdomena</h3>
        <Alert>
          <AlertDescription>
            Subdomena jest dostępna tylko dla planów Pro i Enterprise.
            Upgrade swój plan aby uzyskać własną subdomenę ({'{'}twoja-firma{'}'}.oto-raport.pl).
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Subdomena</h3>
          <p className="text-sm text-muted-foreground">
            Wybierz unikalną subdomenę dla swojej publicznej strony z ofertami
          </p>
        </div>

        {currentSubdomain && !success && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Twoja obecna subdomena: <strong>{currentSubdomain}.oto-raport.pl</strong>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://${currentSubdomain}.oto-raport.pl`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Otwórz
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="subdomain">Subdomena</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                placeholder="twoja-firma"
                className="pr-10"
                disabled={claiming}
              />
              {checkingAvailability && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!checkingAvailability && availabilityStatus && subdomain !== currentSubdomain && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {availabilityStatus.available ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              )}
            </div>
            <span className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
              .oto-raport.pl
            </span>
          </div>

          {availabilityStatus && subdomain !== currentSubdomain && (
            <p className={`text-sm ${availabilityStatus.available ? 'text-green-600' : 'text-red-600'}`}>
              {availabilityStatus.available
                ? 'Subdomena jest dostępna!'
                : availabilityStatus.reason || 'Subdomena jest niedostępna'}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Subdomena może zawierać tylko małe litery, cyfry i myślniki (3-63 znaki)
          </p>
        </div>

        {subdomain && subdomain !== currentSubdomain && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Podgląd:</p>
            <p className="text-sm text-muted-foreground">
              https://<strong>{subdomain || 'twoja-firma'}</strong>.oto-raport.pl
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-600 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleClaim}
          disabled={
            !subdomain ||
            subdomain === currentSubdomain ||
            !availabilityStatus?.available ||
            checkingAvailability ||
            claiming
          }
          className="w-full"
        >
          {claiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {currentSubdomain ? 'Zmień subdomenę' : 'Zapisz subdomenę'}
        </Button>
      </div>
    </Card>
  );
}
