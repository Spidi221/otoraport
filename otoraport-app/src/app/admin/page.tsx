import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/admin/admin-dashboard'

// SECURITY FIX: Admin emails from environment variables
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@otoraport.pl').split(',')

export default async function AdminPage() {
  const session: any = await getServerSession(authOptions as any)
  
  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  if (!ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/dashboard')
  }

  return <AdminDashboard adminEmail={session.user.email} />
}

export const metadata = {
  title: 'Panel Administracyjny - OTORAPORT',
  description: 'Panel administracyjny systemu OTORAPORT'
}