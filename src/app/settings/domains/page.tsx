'use client';

import { Suspense } from 'react';
import { Header } from '@/components/dashboard/header';
import { LoadingState } from '@/components/ui/loading';
import CustomDomainManager from '@/components/CustomDomainManager';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DomainsSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUserMenu={true} />

      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-6 lg:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Powrót do Dashboard
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Zarządzanie Domenami</h1>
              <p className="text-muted-foreground">
                Skonfiguruj własną domenę dla strony prezentacyjnej (Enterprise)
              </p>
            </div>
          </div>
        </div>

        {/* Custom Domain Manager */}
        <Suspense fallback={<LoadingState message="Ładowanie konfiguracji domeny..." />}>
          <CustomDomainManager />
        </Suspense>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Potrzebujesz pomocy?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Jak skonfigurować własną domenę?</h3>
                <ol className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>1. Wpisz nazwę domeny (np. mieszkania.mojafirma.pl)</li>
                  <li>2. Skopiuj podane rekordy DNS</li>
                  <li>3. Dodaj je w panelu swojego dostawcy domeny</li>
                  <li>4. Poczekaj na propagację DNS (5-30 minut)</li>
                  <li>5. Kliknij "Zweryfikuj domenę"</li>
                  <li>6. Po weryfikacji kliknij "Wdróż stronę prezentacyjną"</li>
                </ol>
              </div>

              <div>
                <h3 className="font-medium mb-2">Popularne dostawcy DNS:</h3>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Cloudflare - panel.cloudflare.com</li>
                  <li>• OVH - www.ovh.pl (sekcja "Domeny")</li>
                  <li>• home.pl - panel klienta</li>
                  <li>• nazwa.pl - panel.nazwa.pl</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Wskazówka:</strong> Custom domains są dostępne tylko w planie Enterprise (399 zł/miesiąc).
                  Jeśli masz plan Pro, będziesz mógł skorzystać z subdomeny otoraport.pl.
                </p>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  Masz problemy z konfiguracją? Skontaktuj się z naszym zespołem.
                </p>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Kontakt Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}