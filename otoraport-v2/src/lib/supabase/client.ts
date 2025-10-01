/**
 * Supabase Browser Client
 *
 * Use this ONLY in Client Components ('use client')
 * For API routes and Server Components, use server.ts
 *
 * Official pattern: https://supabase.com/docs/guides/auth/server-side/nextjs
 * Updated: September 2025
 */

'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../supabase'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  // Create singleton client to avoid multiple instances
  if (client) return client

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Client-side cookie reading
          if (typeof document === 'undefined') return undefined
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
          return match ? decodeURIComponent(match[2]) : undefined
        },
        set(name: string, value: string, options: any) {
          // Client-side cookie setting
          if (typeof document === 'undefined') return

          let cookie = `${name}=${encodeURIComponent(value)}`

          if (options?.maxAge) {
            cookie += `; max-age=${options.maxAge}`
          }
          if (options?.domain) {
            cookie += `; domain=${options.domain}`
          }
          if (options?.path) {
            cookie += `; path=${options.path}`
          }
          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`
          }
          if (options?.secure) {
            cookie += '; secure'
          }

          document.cookie = cookie
        },
        remove(name: string, options: any) {
          // Client-side cookie removal
          if (typeof document === 'undefined') return

          let cookie = `${name}=; max-age=0`

          if (options?.domain) {
            cookie += `; domain=${options.domain}`
          }
          if (options?.path) {
            cookie += `; path=${options.path}`
          }

          document.cookie = cookie
        },
      },
    }
  )

  return client
}