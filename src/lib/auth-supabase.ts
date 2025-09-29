import { NextRequest } from 'next/server'
import { createSupabaseReqResClient } from '@/lib/supabase-ssr'
import { supabaseAdmin } from '@/lib/supabase-single'

/**
 * Get authenticated user from Supabase using SSR client
 */
export async function getSupabaseUser(request: NextRequest) {
  try {
    // Check if we have any cookies at all
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      console.log('❌ AUTH: No cookie header found in request')
      return { success: false, error: 'Auth session missing!' }
    }

    console.log('🍪 AUTH: Cookie header found:', cookieHeader.substring(0, 100) + '...')

    // Enhanced cookie detection - look for Supabase auth tokens
    const supabaseTokenPattern = /sb-[a-z0-9]+-auth-token/
    const hasSupabaseToken = supabaseTokenPattern.test(cookieHeader)

    if (!hasSupabaseToken) {
      console.log('❌ AUTH: No Supabase auth token found in cookies')
      return { success: false, error: 'Auth session missing!' }
    }

    console.log('✅ AUTH: Supabase auth token detected')

    // Create SSR client that properly handles cookies
    const supabase = createSupabaseReqResClient(request)

    // Get user from session (this handles cookies automatically)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.log('❌ AUTH: Supabase auth failed:', error?.message || 'No user found')
      return { success: false, error: error?.message || 'No valid session found' }
    }

    console.log('✅ AUTH: User authenticated successfully:', user.email)
    return { success: true, user }
  } catch (error) {
    console.error('❌ AUTH: Exception in getSupabaseUser:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Get developer profile by email
 */
export async function getDeveloperByEmail(email: string) {
  try {
    console.log('🔍 AUTH: Querying developers table for email:', email)

    const { data: developer, error } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('❌ AUTH: Database query error:', error)
      return { success: false, error: `Database error: ${error.message}` }
    }

    if (!developer) {
      console.log('⚠️ AUTH: No developer profile found for email:', email)
      return { success: false, error: 'Developer profile not found' }
    }

    console.log('✅ AUTH: Developer profile found:', developer.client_id)
    return { success: true, developer }
  } catch (error) {
    console.error('💥 AUTH: Exception in getDeveloperByEmail:', error)
    return { success: false, error: 'Failed to get developer profile' }
  }
}

/**
 * Combined auth check - gets both user and developer profile
 */
export async function getAuthenticatedDeveloper(request: NextRequest) {
  console.log('🔍 AUTH: getAuthenticatedDeveloper called')

  const authResult = await getSupabaseUser(request)

  console.log('🔍 AUTH: getSupabaseUser result:', {
    success: authResult.success,
    hasUser: !!authResult.user,
    userEmail: authResult.user?.email,
    error: authResult.error
  })

  if (!authResult.success || !authResult.user?.email) {
    console.log('❌ AUTH: User authentication failed')
    return {
      success: false,
      error: authResult.error || 'Unauthorized',
      user: null,
      developer: null
    }
  }

  console.log('🔍 AUTH: Looking up developer for email:', authResult.user.email)
  const devResult = await getDeveloperByEmail(authResult.user.email)

  console.log('🔍 AUTH: Developer lookup result:', {
    success: devResult.success,
    hasDeveloper: !!devResult.developer,
    error: devResult.error
  })

  if (!devResult.success || !devResult.developer) {
    console.log('❌ AUTH: Developer profile not found')
    return {
      success: false,
      error: devResult.error || 'Developer profile not found',
      user: authResult.user,
      developer: null
    }
  }

  console.log('✅ AUTH: Full authentication successful for:', devResult.developer.client_id)
  return {
    success: true,
    user: authResult.user,
    developer: devResult.developer,
    error: null
  }
}