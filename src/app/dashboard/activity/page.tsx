/**
 * User Activity Dashboard
 *
 * Displays audit log history for the authenticated user
 */

import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuditLogsTable } from '@/components/audit/audit-logs-table';
import { Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dziennik Aktywności | OTORAPORT',
  description: 'Przegląd historii działań i zdarzeń na koncie',
};

export default async function ActivityPage() {
  // Authenticate user
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin?redirect=/dashboard/activity');
  }

  // Get developer profile
  const { data: developer } = await supabase
    .from('developers')
    .select('id, company_name, email')
    .eq('user_id', user.id)
    .single();

  if (!developer) {
    redirect('/dashboard?error=no_profile');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dziennik Aktywności
            </h1>
            <p className="text-gray-600">
              Historia wszystkich działań wykonanych na Twoim koncie
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Konto</div>
            <div className="font-semibold text-gray-900 mt-1">
              {developer.company_name || developer.email}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Automatyczne archiwizowanie</div>
            <div className="font-semibold text-gray-900 mt-1">
              Po 12 miesiącach
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Format eksportu</div>
            <div className="font-semibold text-gray-900 mt-1">
              CSV
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <AuditLogsTable apiEndpoint="/api/user/audit-logs" showUserInfo={false} />

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">
            O dzienniku aktywności
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Wszystkie akcje wykonane na Twoim koncie są automatycznie rejestrowane</li>
            <li>• Dziennik jest niemodyfikowalny (append-only) dla zachowania integralności</li>
            <li>• Dane starsze niż 12 miesięcy są automatycznie archiwizowane</li>
            <li>• Możesz eksportować historię w formacie CSV</li>
            <li>• W razie pytań, skontaktuj się z supportem OTORAPORT</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
