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
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('❌ AUTH CALLBACK: OAuth exchange failed:', error.message)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    // Check if user needs onboarding (no stripe_customer_id)
    if (data.user) {
      const { data: developer } = await supabase
        .from('developers')
        .select('stripe_customer_id, payment_method_attached, trial_status')
        .eq('id', data.user.id)
        .single()

      // Redirect to onboarding if no Stripe customer or no payment method attached
      if (!developer?.stripe_customer_id || !developer?.payment_method_attached) {
        console.log('🔀 AUTH CALLBACK: User needs onboarding, redirecting to select-plan')
        return NextResponse.redirect(new URL('/onboarding/select-plan', requestUrl.origin))
      }

      // Check if trial has expired
      if (developer?.trial_status === 'expired') {
        console.log('⏰ AUTH CALLBACK: Trial expired, redirecting with notice')
        return NextResponse.redirect(new URL('/dashboard?trial_expired=true', requestUrl.origin))
      }
    }

    console.log('✅ AUTH CALLBACK: OAuth successful, redirecting to:', next)
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // Handle email confirmation callback
  if (token_hash && type) {
    const { error, data } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
      token_hash,
    })

    if (error) {
      console.error('❌ AUTH CALLBACK: Email verification failed:', error.message)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    // Check if user needs onboarding
    if (data.user) {
      const { data: developer } = await supabase
        .from('developers')
        .select('stripe_customer_id, payment_method_attached, trial_status')
        .eq('id', data.user.id)
        .single()

      // Redirect to onboarding if no Stripe customer or no payment method attached
      if (!developer?.stripe_customer_id || !developer?.payment_method_attached) {
        console.log('🔀 AUTH CALLBACK: User needs onboarding, redirecting to select-plan')
        return NextResponse.redirect(new URL('/onboarding/select-plan', requestUrl.origin))
      }

      // Check if trial has expired
      if (developer?.trial_status === 'expired') {
        console.log('⏰ AUTH CALLBACK: Trial expired, redirecting with notice')
        return NextResponse.redirect(new URL('/dashboard?trial_expired=true', requestUrl.origin))
      }
    }

    console.log('✅ AUTH CALLBACK: Email verification successful, redirecting to:', next)
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  console.log('⚠️ AUTH CALLBACK: No valid params, redirecting to signin')
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
}
