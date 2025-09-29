import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/admin/admin-dashboard'

// SECURITY FIX: Admin emails from environment variables
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []

export default async function AdminPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()

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