/**
 * Admin Layout
 * Task #57.2 - Admin Middleware and Protected Routes
 *
 * Protected layout for all admin pages
 * Client-side verification of admin access
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthSimple } from '@/hooks/use-auth-simple'
import { LoadingState } from '@/components/ui/loading'
import { Header } from '@/components/dashboard/header'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuthSimple()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        router.push('/auth/signin?callbackUrl=/admin/dashboard')
        return
      }

      try {
        // Check if user has admin access
        const response = await fetch('/api/admin/check-access')
        const data = await response.json()

        if (!response.ok || !data.isAdmin) {
          console.warn('⚠️ Admin access denied for:', user.email)
          router.push('/dashboard')
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('❌ Error checking admin access:', error)
        router.push('/dashboard')
      }
    }

    if (!loading) {
      checkAdmin()
    }
  }, [user, loading, router])

  // Show loading state while checking
  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showUserMenu={!!user} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <LoadingState message="Verifying admin access..." />
        </div>
      </div>
    )
  }

  // If not admin, don't render (router.push will redirect)
  if (!isAdmin) {
    return null
  }

  // Render admin content
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showUserMenu={!!user} />

      {/* Admin Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center space-x-8">
            <a
              href="/admin/dashboard"
              className="text-sm font-medium text-gray-900 hover:text-primary transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/admin/users"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Users
            </a>
            <a
              href="/admin/audit-logs"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Audit Logs
            </a>
            <a
              href="/dashboard"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors ml-auto"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
