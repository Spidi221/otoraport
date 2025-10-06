/**
 * Supabase Admin Client (Service Role)
 *
 * Use this ONLY for:
 * - Public API endpoints (ministry XML, CSV, MD5)
 * - Admin operations
 * - Server-side operations that bypass RLS
 *
 * ⚠️ WARNING: This client bypasses Row Level Security!
 * Only use in secure server-side contexts.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
