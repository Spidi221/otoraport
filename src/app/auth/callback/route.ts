/**
 * AUTH CALLBACK - OAuth & Email Confirmation Handler
 * Handles OAuth redirects (Google, etc.) and email confirmation links
 */

// Force dynamic rendering - prevent static generation during build
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  console.log('🔐 AUTH CALLBACK: Received', { code: code?.substring(0, 10) + '...', type, token_hash: token_hash?.substring(0, 10) + '...', next })

  const supabase = await createClient()

  // Handle OAuth callback (Google, etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('❌ AUTH CALLBACK: OAuth exchange failed:', error.message)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    console.log('✅ AUTH CALLBACK: OAuth successful, redirecting to:', next)
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // Handle email confirmation callback
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
      token_hash,
    })

    if (error) {
      console.error('❌ AUTH CALLBACK: Email verification failed:', error.message)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    console.log('✅ AUTH CALLBACK: Email verification successful, redirecting to:', next)
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  console.log('⚠️ AUTH CALLBACK: No valid params, redirecting to signin')
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
}
