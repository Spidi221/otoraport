import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import AdminDashboard from '@/components/admin/admin-dashboard'

// SECURITY FIX: Admin emails from environment variables
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@otoraport.pl').split(',')

export default async function AdminPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-maichqozswcomegcsaqg-auth-token')

  if (!accessToken) {
    redirect('/auth/signin')
  }

  // Get user from Supabase Auth
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken.value)

  if (error || !user?.email) {
    redirect('/auth/signin')
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    redirect('/dashboard')
  }

  return <AdminDashboard adminEmail={user.email} />
}

export const metadata = {
  title: 'Panel Administracyjny - OTORAPORT',
  description: 'Panel administracyjny systemu OTORAPORT'
}