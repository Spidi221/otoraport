'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BrandingSettingsProps {
  currentLogoUrl?: string | null;
  currentPrimaryColor?: string | null;
  currentSecondaryColor?: string | null;
  subscriptionPlan?: string | null;
  subdomain?: string | null;
}

export function BrandingSettings({
  currentLogoUrl,
  currentPrimaryColor,
  currentSecondaryColor,
  subscriptionPlan,
  subdomain,
}: BrandingSettingsProps) {
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(currentPrimaryColor || '#2563eb');
  const [secondaryColor, setSecondaryColor] = useState(currentSecondaryColor || '#1e40af');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user has Pro or Enterprise plan
  const hasRequiredPlan = ['pro', 'enterprise'].includes(subscriptionPlan || '');

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/branding/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branding_logo_url: logoUrl || null,
          branding_primary_color: primaryColor,
          branding_secondary_color: secondaryColor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Nie udało się zapisać brandingu');
        return;
      }

      setSuccess('Branding został zaktualizowany pomyślnie!');
    } catch (err) {
      console.error('Error saving branding:', err);
      setError('Wystąpił nieoczekiwany błąd');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!subdomain) {
      alert('Najpierw ustaw subdomenę w sekcji powyżej');
      return;
    }
    window.open(`https://${subdomain}.otoraport.pl`, '_blank');
  };

  if (!hasRequiredPlan) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Branding</h3>
        <Alert>
          <AlertDescription>
            Własny branding jest dostępny tylko dla planów Pro i Enterprise.
            Upgrade swój plan aby dostosować logo i kolory swojej strony publicznej.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Branding</h3>
          <p className="text-sm text-muted-foreground">
            Dostosuj wygląd swojej publicznej strony z ofertami
          </p>
        </div>

        {/* Logo URL */}
        <div className="space-y-2">
          <Label htmlFor="logo-url">URL Logo</Label>
          <div className="flex gap-2">
            <Input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              disabled={saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Wklej URL do swojego logo (maksymalnie 2MB, format: PNG, JPG, SVG)
          </p>
          {logoUrl && (
            <div className="mt-2 p-4 border rounded-md bg-muted">
              <p className="text-sm font-medium mb-2">Podgląd logo:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo preview"
                className="max-h-20 object-contain"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.alt = 'Nie można załadować logo';
                }}
              />
            </div>
          )}
        </div>

        {/* Primary Color */}
        <div className="space-y-2">
          <Label htmlFor="primary-color">Kolor Główny</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="primary-color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-20 h-10 cursor-pointer"
              disabled={saving}
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#2563eb"
              className="flex-1"
              disabled={saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Używany dla nagłówków, przycisków i akcentów
          </p>
        </div>

        {/* Secondary Color */}
        <div className="space-y-2">
          <Label htmlFor="secondary-color">Kolor Drugorzędny</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="secondary-color"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-20 h-10 cursor-pointer"
              disabled={saving}
            />
            <Input
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              placeholder="#1e40af"
              className="flex-1"
              disabled={saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Używany dla hover states i drugorzędnych elementów
          </p>
        </div>

        {/* Preview */}
        <div className="bg-muted p-4 rounded-md">
          <p className="text-sm font-medium mb-3">Podgląd kolorów:</p>
          <div className="flex gap-4">
            <div className="flex-1">
              <div
                className="h-16 rounded-md mb-2"
                style={{ backgroundColor: primaryColor }}
              />
              <p className="text-xs text-center text-muted-foreground">Główny</p>
            </div>
            <div className="flex-1">
              <div
                className="h-16 rounded-md mb-2"
                style={{ backgroundColor: secondaryColor }}
              />
              <p className="text-xs text-center text-muted-foreground">Drugorzędny</p>
            </div>
          </div>
        </div>

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

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz branding
          </Button>

          {subdomain && (
            <Button
              onClick={handlePreview}
              variant="outline"
              disabled={saving}
            >
              <Eye className="mr-2 h-4 w-4" />
              Podgląd
            </Button>
          )}
        </div>

        {!subdomain && (
          <Alert>
            <AlertDescription>
              Ustaw subdomenę powyżej, aby móc podejrzeć swoją stronę publiczną z brandingiem.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}
