/**
 * Stripe Customer Portal Session API - Task 10.4
 * Creates a Stripe Customer Portal session for subscription management
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getErrorMessage } from '@/lib/api-schemas'

export async function POST() {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      )
    }

    // 2. Get developer profile with Stripe customer ID
    const { data: developer, error: profileError } = await supabase
      .from('developers')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || !developer) {
      return NextResponse.json(
        { error: 'Developer profile not found' },
        { status: 404 }
      )
    }

    // 3. Check if user has a Stripe customer ID
    if (!developer.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 }
      )
    }

    // 4. Prepare return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = `${baseUrl}/dashboard`

    // 5. Create Customer Portal Session
    const session = await stripe().billingPortal.sessions.create({
      customer: developer.stripe_customer_id,
      return_url: returnUrl,
    })

    console.log(`✅ STRIPE: Created portal session for developer ${developer.id}`)

    return NextResponse.json({
      url: session.url,
    })

  } catch (error: unknown) {
    console.error('💥 STRIPE PORTAL ERROR:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
