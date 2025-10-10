/**
 * Supabase Server Client
 *
 * Use this in:
 * - API Routes
 * - Server Components
 * - Server Actions
 *
 * Official pattern: https://supabase.com/docs/guides/auth/server-side/nextjs
 * Updated: September 2025
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '../supabase'

export type { Database }

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Admin Client - Use ONLY for privileged operations
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Helper: Get authenticated user from request
 * Returns null if not authenticated
 */
export async function getServerAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Helper: Get developer profile by user ID
 * Returns null if not found
 */
export async function getDeveloperProfile(userId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('developers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching developer profile:', error)
    return null
  }

  return data
}

/**
 * Alias export for backward compatibility
 * Some files import 'createServerClient' instead of 'createClient'
 */
export { createClient as createServerClient }