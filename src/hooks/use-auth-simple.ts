'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  supabase,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getCurrentUser,
  getCurrentSession,
  getDeveloperProfile,
  createDeveloperProfile
} from '@/lib/supabase-single'
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
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Determine if current user is admin
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false

  // Load or create developer profile
  const loadDeveloperProfile = async (user: User) => {
    console.log('🔍 SIMPLE AUTH: Loading profile for:', user.email)

    try {
      // Try to get existing profile
      let profile = await getDeveloperProfile(user.id)

      // If no profile exists, create one
      if (!profile) {
        console.log('🔧 SIMPLE AUTH: Creating new developer profile')
        profile = await createDeveloperProfile(
          user.id,
          user.email!,
          user.user_metadata?.full_name,
          user.user_metadata?.company_name
        )
      }

      if (profile) {
        console.log('✅ SIMPLE AUTH: Profile loaded:', profile.client_id)
        setDeveloper(profile)
      } else {
        console.log('❌ SIMPLE AUTH: Failed to load/create profile')
        setDeveloper(null)
      }
    } catch (error) {
      console.error('💥 SIMPLE AUTH: Profile loading failed:', error)
      setDeveloper(null)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 SIMPLE AUTH: Initializing...')

      try {
        // Add timeout for safety - prevent infinite loading
        const sessionPromise = getCurrentSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout after 10s')), 10000)
        )

        const session = await Promise.race([sessionPromise, timeoutPromise])

        if (session?.user) {
          console.log('✅ SIMPLE AUTH: Session found for:', session.user.email)
          setUser(session.user)
          await loadDeveloperProfile(session.user)
        } else {
          console.log('⚠️ SIMPLE AUTH: No active session - user not logged in')
          setUser(null)
          setDeveloper(null)
        }
      } catch (error) {
        console.error('💥 SIMPLE AUTH: Initialization failed:', error)
        setUser(null)
        setDeveloper(null)
      } finally {
        console.log('✅ SIMPLE AUTH: Loading finished, setting loading = false')
        setLoading(false)
      }
    }

    initializeAuth()

    // Safety timeout - force loading to false after 15 seconds
    const safetyTimeout = setTimeout(() => {
      console.log('🚨 SIMPLE AUTH: Safety timeout - forcing loading = false')
      setLoading(false)
    }, 15000)

    // Listen for auth state changes - but don't reset loading here
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 SIMPLE AUTH: State change:', event, session?.user?.email)

        // Only update user/developer, don't touch loading state from auth changes
        if (session?.user) {
          setUser(session.user)
          await loadDeveloperProfile(session.user)
        } else {
          setUser(null)
          setDeveloper(null)
        }
      }
    )

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log('🔑 SIMPLE AUTH: Signing in:', email)

      const result = await signInWithEmail(email, password)

      if (!result.success) {
        return { success: false, error: result.error }
      }

      if (result.user) {
        setUser(result.user)
        await loadDeveloperProfile(result.user)

        // Redirect based on user type
        if (ADMIN_EMAILS.includes(result.user.email || '')) {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }

      return { success: true }
    } catch (error) {
      console.error('💥 SIMPLE AUTH: Sign in error:', error)
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
      console.log('📝 SIMPLE AUTH: Signing up:', email)

      const result = await signUpWithEmail(email, password, companyName)

      if (!result.success) {
        return { success: false, error: result.error }
      }

      return { success: true }
    } catch (error) {
      console.error('💥 SIMPLE AUTH: Sign up error:', error)
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
      console.log('🚪 SIMPLE AUTH: Signing out')

      await signOut()
      setUser(null)
      setDeveloper(null)
      router.push('/auth/signin')
    } catch (error) {
      console.error('💥 SIMPLE AUTH: Sign out error:', error)
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