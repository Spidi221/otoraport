import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseAPIClient } from '@/lib/supabase-ssr'

/**
 * Get authenticated user from Supabase using SSR client
 */
export async function getSupabaseUser(request: NextRequest) {
  try {
    // Use the SSR client to properly handle cookies
    const supabase = createSupabaseAPIClient(request)

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return { success: false, error: 'Auth session error' }
    }

    if (!session?.user) {
      // Fallback: try to get user from Authorization header (Bearer token)
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')

        // Use the token to get user info
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

        if (error || !user) {
          console.error('Bearer token validation failed:', error)
          return { success: false, error: 'Invalid or expired token' }
        }

        return { success: true, user }
      }

      console.log('No session and no bearer token found')
      return { success: false, error: 'Auth session missing!' }
    }

    return { success: true, user: session.user }
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