/**
 * Public System Status Page
 *
 * Displays real-time health of all system components,
 * historical uptime data, and incident history.
 *
 * This page is public (no authentication required).
 */

import { Metadata } from 'next';
import { StatusPageContent } from '@/components/status/status-page-content';

export const metadata: Metadata = {
  title: 'Status Systemu | OTORAPORT',
  description: 'Status i dostępność systemu OTORAPORT w czasie rzeczywistym',
};

// Revalidate every 30 seconds
export const revalidate = 30;

export default async function StatusPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Status Systemu OTORAPORT
          </h1>
          <p className="text-gray-600 mt-2">
            Monitorowanie dostępności i wydajności w czasie rzeczywistym
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <StatusPageContent />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2025 OTORAPORT. Wszystkie prawa zastrzeżone.</p>
            <p>
              Dane aktualizowane co 30 sekund •{' '}
              <span className="text-blue-600">
                Ostatnia aktualizacja: {new Date().toLocaleString('pl-PL')}
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
