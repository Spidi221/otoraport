import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard'

export default async function AnalyticsPage() {
  const cookieStore = await cookies()

  // FIXED: Dynamic cookie detection for any Supabase instance
  const allCookies = cookieStore.getAll()
  const authCookie = allCookies.find(cookie =>
    cookie.name.match(/^sb-[a-z0-9]+-auth-token$/)
  )

  if (!authCookie) {
    redirect('/auth/signin')
  }

  const accessToken = authCookie

  // Get user from Supabase Auth
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken.value)

  if (error || !user?.email) {
    redirect('/auth/signin')
  }

  // Get developer profile
  const { data: developer } = await supabaseAdmin
    .from('developers')
    .select('id')
    .eq('email', user.email)
    .single()

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