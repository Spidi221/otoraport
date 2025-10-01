/**
 * AUTH CALLBACK - Email Confirmation Handler
 * Handles email confirmation links from Supabase
 */

// Force dynamic rendering - prevent static generation during build
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  console.log('🔐 AUTH CALLBACK: Received', { type, token_hash: token_hash?.substring(0, 10) + '...', next })

  if (token_hash && type) {
    const supabase = await createClient()

    // Exchange token for session
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (error) {
      console.error('❌ AUTH CALLBACK: Verification failed:', error.message)
      // Redirect to signin with error
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    console.log('✅ AUTH CALLBACK: Verification successful, redirecting to:', next)

    // Redirect to dashboard (middleware will create developer profile)
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  console.log('⚠️ AUTH CALLBACK: Missing token_hash or type, redirecting to signin')

  // No token_hash or type - redirect to signin
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
}
