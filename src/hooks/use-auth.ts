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
  refreshSession: () => Promise<void>
}

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || []

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null)
  const [developer, setDeveloper] = useState<Developer | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Determine if current user is admin
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false

  // Load developer profile
  const loadDeveloperProfile = async (user: User) => {
    try {
      const { data: developerData } = await supabase
        .from('developers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (developerData) {
        setDeveloper(developerData)
      }
    } catch (error) {
      console.error('Error loading developer profile:', error)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await loadDeveloperProfile(session.user)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)

        if (session?.user) {
          setUser(session.user)
          await loadDeveloperProfile(session.user)
        } else {
          setUser(null)
          setDeveloper(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
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
      console.error('Sign in error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Nieznany błąd podczas logowania'
      }
    } finally {
      setLoading(false)
    }
  }

  // Sign up with email/password and create developer profile
  const signUp = async (email: string, password: string, companyName: string) => {
    try {
      setLoading(true)

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            company_name: companyName
          }
        }
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (authData.user) {
        // Generate unique client ID
        const clientId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Create developer profile
        const { error: profileError } = await supabase
          .from('developers')
          .insert({
            user_id: authData.user.id,
            email: email.trim(),
            company_name: companyName,
            client_id: clientId,
            subscription_plan: 'trial',
            subscription_status: 'trial'
          })

        if (profileError) {
          console.error('Error creating developer profile:', profileError)
          return { success: false, error: 'Błąd podczas tworzenia profilu developera' }
        }

        return { success: true }
      }

      return { success: false, error: 'Błąd podczas tworzenia konta' }
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Nieznany błąd podczas rejestracji'
      }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error)
      }

      setUser(null)
      setDeveloper(null)
      router.push('/auth/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refresh session
  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.refreshSession()

      if (session?.user) {
        setUser(session.user)
        await loadDeveloperProfile(session.user)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }

  return {
    user,
    developer,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    refreshSession
  }
}