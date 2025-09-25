import { NextRequest } from 'next/server'
import { createSupabaseReqResClient } from '@/lib/supabase-ssr'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Get authenticated user from Supabase using SSR client
 */
export async function getSupabaseUser(request: NextRequest) {
  try {
    // Create SSR client that properly handles cookies
    const supabase = createSupabaseReqResClient(request)

    // Get user from session (this handles cookies automatically)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.log('Auth error:', error?.message || 'No user found')
      return { success: false, error: error?.message || 'No valid session found' }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Auth error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Get developer profile by email
 */
export async function getDeveloperByEmail(email: string) {
  try {
    const { data: developer, error } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !developer) {
      return { success: false, error: 'Developer profile not found' }
    }

    return { success: true, developer }
  } catch (error) {
    console.error('Developer lookup error:', error)
    return { success: false, error: 'Failed to get developer profile' }
  }
}

/**
 * Combined auth check - gets both user and developer profile
 */
export async function getAuthenticatedDeveloper(request: NextRequest) {
  const authResult = await getSupabaseUser(request)

  if (!authResult.success || !authResult.user?.email) {
    return {
      success: false,
      error: authResult.error || 'Unauthorized',
      user: null,
      developer: null
    }
  }

  const devResult = await getDeveloperByEmail(authResult.user.email)

  if (!devResult.success || !devResult.developer) {
    return {
      success: false,
      error: devResult.error || 'Developer profile not found',
      user: authResult.user,
      developer: null
    }
  }

  return {
    success: true,
    user: authResult.user,
    developer: devResult.developer,
    error: null
  }
}