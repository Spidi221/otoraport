'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Developer {
  id: string
  email: string
  company_name: string
  client_id: string
  subscription_plan: string
  subscription_status: string
  created_at: string
}

interface AuthState {
  user: User | null
  developer: Developer | null
  loading: boolean
  isAdmin: boolean
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, companyName: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || []

export function useAuthSimple(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null)
  const [developer, setDeveloper] = useState<Developer | null>(null)
  const [loading, setLoading] = useState(false) // Don't block - middleware handles auth
  const router = useRouter()
  const supabase = createClient()

  // Determine if current user is admin
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false

  // Load or create developer profile via API (safer than direct DB access)
  const loadDeveloperProfile = async (user: User) => {
    console.log('🔍 AUTH HOOK: Loading profile for:', user.email)

    try {
      // Call API to get/create profile (handles RLS properly)
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        console.error('❌ AUTH HOOK: Profile API error:', response.status)
        setDeveloper(null)
        return
      }

      const data = await response.json()

      if (data.success && data.developer) {
        console.log('✅ AUTH HOOK: Profile loaded:', data.developer.client_id)
        setDeveloper(data.developer)
      } else {
        console.error('❌ AUTH HOOK: No profile in response')
        setDeveloper(null)
      }
    } catch (error) {
      console.error('💥 AUTH HOOK: Profile loading failed:', error)
      setDeveloper(null)
    }
  }

  // Initialize auth state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const initializeAuth = async () => {
      console.log('🚀 AUTH HOOK: Initializing...')

      try {
        // Safety timeout - force loading=false after 5 seconds
        timeoutId = setTimeout(() => {
          console.warn('⏱️ AUTH HOOK: Timeout reached, forcing loading=false')
          setLoading(false)
        }, 5000)

        // Use getUser() instead of getSession() (recommended for SSR)
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          console.log('⚠️ AUTH HOOK: No authenticated user:', error.message)
          setUser(null)
          setDeveloper(null)
        } else if (user) {
          console.log('✅ AUTH HOOK: User authenticated:', user.email)
          setUser(user)
          await loadDeveloperProfile(user)
        } else {
          console.log('⚠️ AUTH HOOK: No active session')
          setUser(null)
          setDeveloper(null)
        }
      } catch (error) {
        console.error('💥 AUTH HOOK: Initialization failed:', error)
        setUser(null)
        setDeveloper(null)
      } finally {
        clearTimeout(timeoutId)
        console.log('✅ AUTH HOOK: Initialization complete')
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AUTH HOOK: State change:', event, session?.user?.email)

        if (session?.user) {
          setUser(session.user)
          await loadDeveloperProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setDeveloper(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log('🔑 AUTH HOOK: Signing in:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        console.error('❌ AUTH HOOK: Sign in failed:', error.message)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log('✅ AUTH HOOK: Sign in successful:', data.user.email)
        setUser(data.user)
        await loadDeveloperProfile(data.user)

        // Redirect based on user type
        if (ADMIN_EMAILS.includes(data.user.email || '')) {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }

      return { success: true }
    } catch (error) {
      console.error('💥 AUTH HOOK: Sign in error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      }
    } finally {
      setLoading(false)
    }
  }

  // Sign up
  const signUp = async (email: string, password: string, companyName: string) => {
    try {
      setLoading(true)
      console.log('📝 AUTH HOOK: Signing up:', email)

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { company_name: companyName }
        }
      })

      if (error) {
        console.error('❌ AUTH HOOK: Sign up failed:', error.message)
        return { success: false, error: error.message }
      }

      console.log('✅ AUTH HOOK: Sign up successful:', data.user?.email)
      return { success: true }
    } catch (error) {
      console.error('💥 AUTH HOOK: Sign up error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOutUser = async () => {
    try {
      setLoading(true)
      console.log('🚪 AUTH HOOK: Signing out')

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ AUTH HOOK: Sign out error:', error.message)
      }

      setUser(null)
      setDeveloper(null)
      router.push('/auth/signin')
    } catch (error) {
      console.error('💥 AUTH HOOK: Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await loadDeveloperProfile(user)
    }
  }

  return {
    user,
    developer,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut: signOutUser,
    refreshProfile
  }
}
// Alias for compatibility
export { useAuthSimple as useAuth }
