/**
 * Auth helper for API routes
 * Provides getAuthenticatedDeveloper function for backwards compatibility
 */

import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function getAuthenticatedDeveloper(request: NextRequest) {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'Unauthorized - please sign in',
      user: null,
      developer: null
    }
  }

  // Get developer profile
  const { data: developer, error: profileError } = await supabase
    .from('developers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError || !developer) {
    return {
      success: false,
      error: 'Developer profile not found',
      user,
      developer: null
    }
  }

  return {
    success: true,
    user,
    developer
  }
}