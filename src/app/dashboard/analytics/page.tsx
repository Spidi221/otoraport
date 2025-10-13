import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdvancedAnalyticsDashboard } from '@/components/analytics/advanced-analytics-dashboard'
import { Header } from '@/components/dashboard/header'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Zaawansowana Analityka | OTO-RAPORT',
  description: 'Szczegółowe raporty i analizy rynkowe dla Twoich nieruchomości',
}

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to signin if not authenticated
  if (!user) {
    redirect('/auth/signin')
  }

  // Get developer profile with subscription plan
  const { data: developer, error } = await supabase
    .from('developers')
    .select('subscription_plan, subscription_status, company_name')
    .eq('user_id', user.id)
    .single()

  if (error || !developer) {
    console.error('Failed to fetch developer profile:', error)
    redirect('/dashboard')
  }

  // Check if user has Enterprise plan
  const isEnterprise = developer.subscription_plan === 'enterprise'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUserMenu={true} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 lg:px-6">
        {/* Breadcrumb Navigation with Back Button */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Powrót do Dashboardu
            </Button>
          </Link>
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Zaawansowana Analityka</span>
          </nav>
        </div>

        {/* Analytics Dashboard Component */}
        <AdvancedAnalyticsDashboard isEnterprise={isEnterprise} />
      </main>
    </div>
  )
}
