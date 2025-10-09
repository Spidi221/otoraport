/**
 * Admin Audit Logs Dashboard
 *
 * Allows administrators to view audit logs for all users in the system
 */

import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuditLogsTable } from '@/components/audit/audit-logs-table';
import { Shield, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dziennik Aktywności (Admin) | OTO-RAPORT',
  description: 'Panel administratora - przegląd wszystkich działań użytkowników',
};

export default async function AdminAuditLogsPage() {
  // Authenticate user and check admin role
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin?redirect=/admin/audit-logs');
  }

  // Check if user is admin
  const { data: developer } = await supabase
    .from('developers')
    .select('id, is_admin, company_name, email')
    .eq('user_id', user.id)
    .single();

  if (!developer || !developer.is_admin) {
    redirect('/dashboard?error=forbidden&message=Brak uprawnień administratora');
  }

  // Fetch some stats
  const { count: totalLogs } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true });

  const { count: logsLast24h } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const { count: uniqueUsers } = await supabase
    .from('audit_logs')
    .select('user_id', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-lg">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dziennik Aktywności - Panel Administratora
            </h1>
            <p className="text-gray-600">
              Przegląd wszystkich działań użytkowników w systemie
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900 mb-1">
              Strefa Administratora
            </h3>
            <p className="text-sm text-red-800">
              Masz dostęp do wrażliwych danych wszystkich użytkowników. Twoje działania w tym panelu
              są również logowane i podlegają audytowi. Używaj tych uprawnień odpowiedzialnie i zgodnie
              z polityką prywatności OTO-RAPORT.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="text-sm text-gray-600 mb-2">Łączna liczba wpisów</div>
            <div className="text-3xl font-bold text-gray-900">
              {(totalLogs || 0).toLocaleString('pl-PL')}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="text-sm text-gray-600 mb-2">Wpisy w ciągu 24h</div>
            <div className="text-3xl font-bold text-gray-900">
              {(logsLast24h || 0).toLocaleString('pl-PL')}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="text-sm text-gray-600 mb-2">Aktywni użytkownicy</div>
            <div className="text-3xl font-bold text-gray-900">
              {(uniqueUsers || 0).toLocaleString('pl-PL')}
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <AuditLogsTable apiEndpoint="/api/admin/audit-logs" showUserInfo={true} />

        {/* Admin Guidelines */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">
            Wytyczne dla administratorów
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Dostęp do tego panelu jest ściśle kontrolowany i monitorowany</li>
            <li>• Wszystkie Twoje działania w panelu administratora są logowane</li>
            <li>• Nie udostępniaj danych użytkowników osobom trzecim bez zgody</li>
            <li>• W przypadku wykrycia podejrzanej aktywności, natychmiast zgłoś incydent</li>
            <li>• Regularnie przeglądaj dzienniki w celu wykrycia anomalii</li>
            <li>• Eksportuj dane tylko w uzasadnionych przypadkach i przechowuj je bezpiecznie</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
