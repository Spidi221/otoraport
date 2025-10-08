/**
 * Create Trial Checkout Session - Task #50, Subtask 50.3
 * Creates Stripe Checkout session with 14-day trial and card collection
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans'
import type { SubscriptionPlanType } from '@/lib/subscription-plans'
import { getErrorMessage } from '@/lib/api-schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { planType } = body as { planType: SubscriptionPlanType }

    // Validate plan type
    if (!planType || !['basic', 'pro', 'enterprise'].includes(planType)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy typ planu. Wybierz: basic, pro lub enterprise.' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany aby kontynuować' },
        { status: 401 }
      )
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id, email, name, company_name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (devError || !developer) {
      console.error('Developer not found:', devError)
      return NextResponse.json(
        { error: 'Nie znaleziono profilu dewelopera' },
        { status: 404 }
      )
    }

    // Get or create Stripe customer
    let customerId = developer.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe().customers.create({
        email: developer.email,
        name: developer.name || developer.company_name || developer.email,
        metadata: {
          developer_id: developer.id,
          company_name: developer.company_name || '',
        },
      })

      customerId = customer.id

      // Update developer with Stripe customer ID
      const { error: updateError } = await supabase
        .from('developers')
        .update({ stripe_customer_id: customerId })
        .eq('id', developer.id)

      if (updateError) {
        console.error('Failed to update stripe_customer_id:', updateError)
      }
    }

    // Get plan details
    const plan = SUBSCRIPTION_PLANS[planType]
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan nie został znaleziony' },
        { status: 404 }
      )
    }

    // Map plan to Stripe Price ID from environment variables
    const priceIdMap: Record<SubscriptionPlanType, string | undefined> = {
      basic: process.env.STRIPE_PRICE_BASIC_MONTHLY,
      pro: process.env.STRIPE_PRICE_PRO_MONTHLY,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    }

    const priceId = priceIdMap[planType]

    if (!priceId) {
      console.error(`Missing Stripe Price ID for plan: ${planType}`)
      return NextResponse.json(
        {
          error: `Ceny Stripe nie są skonfigurowane dla planu ${planType}. Skontaktuj się z supportem.`,
        },
        { status: 500 }
      )
    }

    // Get app origin
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Stripe Checkout Session with trial and CARD REQUIRED
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
      // CRITICAL: 14-day trial period
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          developer_id: developer.id,
          plan_type: planType,
          trial: 'true',
        },
      },
      // CRITICAL: Always collect payment method (card required upfront)
      payment_method_collection: 'always',
      // Allow promotion codes
      allow_promotion_codes: true,
      // Enable automatic tax calculation
      automatic_tax: { enabled: true },
      // Customer details
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      // Success and cancel URLs
      success_url: `${origin}/dashboard?trial_started=true`,
      cancel_url: `${origin}/onboarding/select-plan?canceled=true`,
      // Metadata for webhook processing
      metadata: {
        developer_id: developer.id,
        plan_type: planType,
        trial: 'true',
      },
    })

    console.log(`✅ Created trial checkout session for ${developer.email} (${planType})`)

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: unknown) {
    console.error('Error creating trial checkout session:', error)
    return NextResponse.json(
      { error: `Nie udało się utworzyć sesji płatności: ${getErrorMessage(error)}` },
      { status: 500 }
    )
  }
}

// Return 405 for non-POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 })
}
