'use client'

import { useState, useEffect } from "react";
import { Copy, ExternalLink, FileCode, FileSpreadsheet, Hash, Info } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface EndpointRowProps {
  label: string;
  url: string;
  icon: React.ReactNode;
  description: string;
}

function EndpointRow({ label, url, icon, description }: EndpointRowProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success(`${label} skopiowany do schowka`);
  };

  const handleOpen = () => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <Label className="text-sm font-medium">{label}</Label>
      </div>
      <div className="flex gap-2">
        <Input
          value={url}
          readOnly
          className="flex-1 font-mono text-xs"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-1"
        >
          <Copy className="w-4 h-4" />
          Kopiuj
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" />
          Otwórz
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function ActionButtons() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClientId() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/user/client-id');
        const data = await response.json();

        if (data.client_id) {
          setClientId(data.client_id);
        }
      } catch (error) {
        console.error('Error loading client ID:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadClientId();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Endpointy Ministerstwa</CardTitle>
          <CardDescription>Ładowanie...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!clientId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Endpointy Ministerstwa</CardTitle>
          <CardDescription>Brak danych. Zaloguj się, aby zobaczyć endpointy.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://otoraport.vercel.app';

  const endpoints = {
    xml: `${baseUrl}/api/public/${clientId}/data.xml`,
    csv: `${baseUrl}/api/public/${clientId}/data.csv`,
    md5: `${baseUrl}/api/public/${clientId}/data.md5`,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          Endpointy Ministerstwa
        </CardTitle>
        <CardDescription>
          Adresy URL do zgłoszenia w portalu dane.gov.pl
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ministry Endpoints */}
        <div className="space-y-4">
          <EndpointRow
            label="Harvester XML"
            url={endpoints.xml}
            icon={<FileCode className="w-4 h-4 text-blue-600" />}
            description="Plik metadanych wskazujący na CSV. Ten URL podaj w portalu dane.gov.pl"
          />
          <EndpointRow
            label="CSV Data"
            url={endpoints.csv}
            icon={<FileSpreadsheet className="w-4 h-4 text-green-600" />}
            description="58 kolumn danych mieszkań zgodnie ze schema 1.13"
          />
          <EndpointRow
            label="MD5 Checksum"
            url={endpoints.md5}
            icon={<Hash className="w-4 h-4 text-orange-600" />}
            description="Hash MD5 pliku Harvester XML do weryfikacji integralności"
          />
        </div>

        {/* Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Jak zgłosić dane do ministerstwa?</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Skopiuj URL <strong>Harvester XML</strong> i <strong>MD5 Checksum</strong> powyżej</li>
              <li>Wyślij email na adres: <a href="mailto:kontakt@dane.gov.pl" className="text-blue-600 hover:underline font-semibold">kontakt@dane.gov.pl</a></li>
              <li>W treści emaila podaj:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                  <li>Imię i nazwisko</li>
                  <li>Nazwa firmy (dostawca danych)</li>
                  <li>URL do pliku Harvester XML</li>
                  <li>URL do pliku MD5 (opcjonalnie)</li>
                  <li>Częstotliwość aktualizacji: <strong>Co dzień</strong></li>
                </ul>
              </li>
              <li>Administrator ministerstwa skonfiguruje harvester dla Twojego konta</li>
              <li>System ministerstwa będzie automatycznie pobierał dane codziennie o 5:00</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              Cache: Dane aktualizują się co 5 minut. Harvester ministerstwa pobiera je raz dziennie.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}