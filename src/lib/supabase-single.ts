/**
 * 🚀 SINGLE SUPABASE CLIENT - Complete Auth System Rewrite
 *
 * PROBLEM: Multiple client instances causing conflicts
 * SOLUTION: ONE client for everything - browser + server
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// FORCE real credentials - no environment variable confusion
const supabaseUrl = 'https://maichqozswcomegcsaqg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTUwMjMsImV4cCI6MjA3MzE3MTAyM30.pFj72PPCCGZue4-M1hzhAjptuedJdY-qiS4gRWHAxVU'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8'

console.log('🔥 SINGLE CLIENT: Initializing unified Supabase client')

// SINGLE CLIENT for browser operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'sb-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
})

// ADMIN CLIENT for server operations
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// SIMPLIFIED AUTH FUNCTIONS
export async function signInWithEmail(email: string, password: string) {
  console.log('🔑 SINGLE CLIENT: Signing in with email:', email)

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  })

  if (error) {
    console.error('❌ SINGLE CLIENT: Sign in failed:', error.message)
    return { success: false, error: error.message }
  }

  console.log('✅ SINGLE CLIENT: Sign in successful for:', data.user?.email)
  return { success: true, user: data.user, session: data.session }
}

export async function signUpWithEmail(email: string, password: string, companyName: string) {
  console.log('📝 SINGLE CLIENT: Signing up with email:', email)

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { company_name: companyName }
    }
  })

  if (error) {
    console.error('❌ SINGLE CLIENT: Sign up failed:', error.message)
    return { success: false, error: error.message }
  }

  console.log('✅ SINGLE CLIENT: Sign up successful for:', data.user?.email)
  return { success: true, user: data.user }
}

export async function signOut() {
  console.log('🚪 SINGLE CLIENT: Signing out')
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('❌ SINGLE CLIENT: Sign out failed:', error.message)
  } else {
    console.log('✅ SINGLE CLIENT: Sign out successful')
  }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('❌ SINGLE CLIENT: Get user failed:', error.message)
    return null
  }

  return user
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('❌ SINGLE CLIENT: Get session failed:', error.message)
    return null
  }

  return session
}

// SIMPLIFIED DEVELOPER OPERATIONS
export async function getDeveloperProfile(userId: string) {
  console.log('👤 SINGLE CLIENT: Getting developer profile for user:', userId)

  try {
    const { data, error } = await supabase
      .from('developers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('❌ SINGLE CLIENT: Developer query failed:', error.message)
      return null
    }

    if (data) {
      console.log('✅ SINGLE CLIENT: Developer profile found:', data.client_id)
      return data
    } else {
      console.log('⚠️ SINGLE CLIENT: No developer profile found')
      return null
    }
  } catch (error) {
    console.error('💥 SINGLE CLIENT: Developer query exception:', error)
    return null
  }
}

export async function createDeveloperProfile(userId: string, email: string, name?: string, companyName?: string) {
  console.log('🔧 SINGLE CLIENT: Creating developer profile for:', email)

  const clientId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const profile = {
    user_id: userId,
    email: email,
    name: name || email.split('@')[0],
    company_name: companyName || 'My Company',
    client_id: clientId,
    subscription_plan: 'basic',
    subscription_status: 'trial'
  }

  try {
    const { data, error } = await supabase
      .from('developers')
      .insert(profile)
      .select()
      .single()

    if (error) {
      console.error('❌ SINGLE CLIENT: Profile creation failed:', error.message)
      return null
    }

    console.log('✅ SINGLE CLIENT: Developer profile created:', data.client_id)
    return data
  } catch (error) {
    console.error('💥 SINGLE CLIENT: Profile creation exception:', error)
    return null
  }
}

// SERVER-SIDE AUTH for API routes
export async function getServerAuth(request: Request) {
  console.log('🔍 SINGLE CLIENT: Server auth check')

  const cookies = request.headers.get('cookie')
  if (!cookies) {
    console.log('❌ SINGLE CLIENT: No cookies in request')
    return null
  }

  // Extract Supabase token from cookies
  const tokenMatch = cookies.match(/sb-auth-token=([^;]+)/)
  if (!tokenMatch) {
    console.log('❌ SINGLE CLIENT: No auth token in cookies')
    return null
  }

  try {
    // Parse the token (it's JSON)
    const tokenData = JSON.parse(decodeURIComponent(tokenMatch[1]))
    const accessToken = tokenData.access_token

    if (!accessToken) {
      console.log('❌ SINGLE CLIENT: No access token in parsed data')
      return null
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      console.log('❌ SINGLE CLIENT: Token verification failed:', error?.message)
      return null
    }

    console.log('✅ SINGLE CLIENT: Server auth successful for:', user.email)
    return user
  } catch (error) {
    console.error('💥 SINGLE CLIENT: Server auth exception:', error)
    return null
  }
}

console.log('🚀 SINGLE CLIENT: Unified Supabase system initialized')