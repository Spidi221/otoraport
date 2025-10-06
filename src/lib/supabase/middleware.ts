/**
 * Supabase Middleware Client
 *
 * Use this ONLY in middleware.ts
 *
 * Official pattern: https://supabase.com/docs/guides/auth/server-side/nextjs
 * Updated: September 2025
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '../supabase'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })

  // Get env vars with fallback
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // If env vars missing, return no user (will redirect to signin)
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ MIDDLEWARE: Supabase env vars missing - returning no user')
    return { user: null, response }
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Return user and response for middleware to handle redirects
  return { user, response }
}