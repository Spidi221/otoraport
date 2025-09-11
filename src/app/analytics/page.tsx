import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const userId = (session.user as any).id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <AnalyticsDashboard developerId={userId} />
      </div>
    </div>
  )
}