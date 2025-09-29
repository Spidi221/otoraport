import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-single'
import { createSupabaseReqResClient } from '@/lib/supabase-ssr'

/**
 * Get authenticated user from Supabase using SSR client
 */
export async function getSupabaseUser(request: NextRequest) {
  try {
    console.log('🔍 AUTH: getSupabaseUser called - using SSR client')

    // Use Supabase SSR for proper server auth
    const supabase = createSupabaseReqResClient(request)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.log('❌ AUTH: SSR User authentication failed:', error?.message)
      return {
        success: false,
        hasUser: false,
        userEmail: undefined,
        error: error?.message || 'Auth session missing!'
      }
    }

    console.log('✅ AUTH: SSR User authenticated successfully:', user.email)
    return {
      success: true,
      hasUser: true,
      userEmail: user.email,
      user
    }
  } catch (error) {
    console.error('❌ AUTH: Exception in getSupabaseUser:', error)
    return {
      success: false,
      hasUser: false,
      userEmail: undefined,
      error: 'Authentication failed'
    }
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