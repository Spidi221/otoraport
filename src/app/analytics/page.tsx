import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard'

export default async function AnalyticsPage() {
  // Create Supabase client for server-side auth
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user?.email) {
    redirect('/auth/signin')
  }

  // Get developer profile
  const { data: developer } = await supabase
    .from('developers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!developer) {
    redirect('/auth/signin')
  }

  const userId = developer.id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <AnalyticsDashboard developerId={userId} />
      </div>
    </div>
  )
}