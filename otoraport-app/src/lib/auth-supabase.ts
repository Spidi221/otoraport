import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Get authenticated user from Supabase using Bearer token
 */
export async function getSupabaseUser(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Fallback to cookie if no bearer token
      const cookieHeader = request.headers.get('cookie')
      if (!cookieHeader) {
        return { success: false, error: 'No authorization token provided' }
      }

      // Extract token from cookie
      const tokenMatch = cookieHeader.match(/sb-maichqozswcomegcsaqg-auth-token=([^;]+)/)
      if (!tokenMatch) {
        return { success: false, error: 'No valid session cookie' }
      }

      const token = tokenMatch[1]
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

      if (error || !user) {
        return { success: false, error: 'Invalid session' }
      }

      return { success: true, user }
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return { success: false, error: 'Invalid or expired token' }
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