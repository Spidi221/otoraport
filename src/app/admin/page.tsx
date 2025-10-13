/**
 * Admin Root Page
 * Task #78 - Admin Panel Route
 *
 * Redirects from /admin to /admin/dashboard
 */

import { redirect } from 'next/navigation'

export default function AdminPage() {
  redirect('/admin/dashboard')
}
