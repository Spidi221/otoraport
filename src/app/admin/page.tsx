import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import AdminDashboard from '@/components/admin/admin-dashboard'

// SECURITY FIX: Admin emails from environment variables
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []

export default async function AdminPage() {
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

  console.log('Admin check:', user.email, 'in', ADMIN_EMAILS, '=', ADMIN_EMAILS.includes(user.email))

  if (!ADMIN_EMAILS.includes(user.email)) {
    redirect('/dashboard')
  }

  return <AdminDashboard adminEmail={user.email} />
}

export const metadata = {
  title: 'Panel Administracyjny - OTORAPORT',
  description: 'Panel administracyjny systemu OTORAPORT'
}