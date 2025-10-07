/**
 * Stripe Checkout Session API - Task 10.2
 * Creates a Stripe Checkout session for Basic Plan subscription (149 zł/month)
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

    // 2. Get developer profile
    const { data: developer, error: profileError } = await supabase
      .from('developers')
      .select('id, email, company_name, stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || !developer) {
      return NextResponse.json(
        { error: 'Developer profile not found' },
        { status: 404 }
      )
    }

    // 3. Check if already has active subscription
    if (developer.stripe_customer_id) {
      const existingSubscriptions = await stripe().subscriptions.list({
        customer: developer.stripe_customer_id,
        status: 'active',
        limit: 1
      })

      if (existingSubscriptions.data.length > 0) {
        return NextResponse.json(
          { error: 'You already have an active subscription' },
          { status: 400 }
        )
      }
    }

    // 4. Get Stripe Price ID from environment
    const priceId = process.env.STRIPE_BASIC_PLAN_PRICE_ID
    if (!priceId) {
      console.error('STRIPE_BASIC_PLAN_PRICE_ID not configured')
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      )
    }

    // 5. Prepare success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/dashboard?canceled=true`

    // 6. Create or retrieve Stripe customer
    let customerId = developer.stripe_customer_id

    if (!customerId) {
      const customer = await stripe().customers.create({
        email: developer.email,
        name: developer.company_name || developer.email,
        metadata: {
          developer_id: developer.id,
          user_id: user.id
        }
      })
      customerId = customer.id

      // Update developer with customer ID
      await supabase
        .from('developers')
        .update({ stripe_customer_id: customerId })
        .eq('id', developer.id)
    }

    // 7. Create Checkout Session
    const session = await stripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        developer_id: developer.id,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          developer_id: developer.id,
          user_id: user.id,
        },
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Automatically collect billing address
      billing_address_collection: 'required',
      // Customer can update payment method
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    })

    console.log(`✅ STRIPE: Created checkout session ${session.id} for developer ${developer.id}`)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })

  } catch (error: unknown) {
    console.error('💥 STRIPE CHECKOUT ERROR:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
