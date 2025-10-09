import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RevenueDashboard } from '@/components/admin/revenue-dashboard';
import { FailedPaymentsTable } from '@/components/admin/failed-payments-table';
import { SubscriptionsTable } from '@/components/admin/subscriptions-table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';

async function checkAdminAccess() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin?error=unauthorized');
  }

  // Check if user has admin role in developers table
  const { data: developer, error } = await supabase
    .from('developers')
    .select('id, email, company_name, role')
    .eq('user_id', user.id)
    .single();

  if (error || !developer) {
    redirect('/dashboard?error=forbidden');
  }

  // Check admin role
  if (developer.role !== 'admin') {
    redirect('/dashboard?error=forbidden&message=Brak uprawnień administratora');
  }

  return { user, developer };
}

async function fetchRevenueData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/analytics`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch revenue data');
    }

    const data = await response.json();

    // Transform analytics data to revenue dashboard format
    return {
      currentMRR: data.kpis.mrr,
      previousMRR: data.kpis.mrr * 0.95, // TODO: Get from previous period
      arr: data.kpis.arr,
      activeSubscriptions: data.kpis.activeUsers,
      previousActiveSubscriptions: Math.floor(data.kpis.activeUsers * 0.95),
      churnRate: data.kpis.churnRate,
      mrrTrend: data.userGrowth.map((item: any) => ({
        month: item.month,
        revenue: item.activeUsers * 299, // Simplified - should use actual MRR data
      })),
      revenueByPlan: [
        { plan: 'Starter', revenue: data.kpis.mrr * 0.3 },
        { plan: 'Pro', revenue: data.kpis.mrr * 0.5 },
        { plan: 'Enterprise', revenue: data.kpis.mrr * 0.2 },
      ],
    };
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    // Return default data if API fails
    return {
      currentMRR: 0,
      previousMRR: 0,
      arr: 0,
      activeSubscriptions: 0,
      previousActiveSubscriptions: 0,
      churnRate: 0,
      mrrTrend: [],
      revenueByPlan: [],
    };
  }
}

async function fetchFailedPayments() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/subscriptions/failed-payments`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch failed payments');
    }

    const data = await response.json();
    return data.failedPayments;
  } catch (error) {
    console.error('Error fetching failed payments:', error);
    return [];
  }
}

async function fetchSubscriptions() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/subscriptions/list`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions');
    }

    const data = await response.json();
    return data.subscriptions;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
}

export default async function AdminSubscriptionsPage() {
  const { user, developer } = await checkAdminAccess();

  // Fetch all data in parallel
  const [revenueData, failedPayments, subscriptions] = await Promise.all([
    fetchRevenueData(),
    fetchFailedPayments(),
    fetchSubscriptions(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Powrót
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Panel Administracyjny</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Zarządzanie subskrypcjami i przychodami
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Odśwież dane
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Eksportuj raport
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Revenue Dashboard Section */}
        <section>
          <RevenueDashboard data={revenueData} />
        </section>

        {/* Failed Payments Section */}
        <section>
          <FailedPaymentsTable payments={failedPayments} />
        </section>

        {/* Active Subscriptions Section */}
        <section>
          <SubscriptionsTable subscriptions={subscriptions} />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Zalogowany jako: <span className="font-semibold">{developer.email}</span>
            </div>
            <div>
              Ostatnia aktualizacja: {new Date().toLocaleString('pl-PL')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
