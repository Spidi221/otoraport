/**
 * Stripe Webhook Handler - Task 10.3
 * Securely processes subscription lifecycle events from Stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe, handleStripeWebhook } from '@/lib/stripe'
import Stripe from 'stripe'

// Edge runtime not needed for webhooks, use Node.js runtime
export const runtime = 'nodejs'

// Disable Next.js body parsing to access raw body for signature verification
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('❌ WEBHOOK: Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('❌ WEBHOOK: STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe().webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } catch (err: any) {
      console.error(`❌ WEBHOOK: Signature verification failed: ${err.message}`)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      )
    }

    console.log(`📥 WEBHOOK: Received ${event.type} event (ID: ${event.id})`)

    // Handle the event using our webhook handler
    const result = await handleStripeWebhook(event)

    if (!result.success) {
      console.error(`❌ WEBHOOK: Handler failed for ${event.type}:`, result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log(`✅ WEBHOOK: Successfully processed ${event.type}`)

    return NextResponse.json({
      received: true,
      event_type: event.type
    })

  } catch (error: any) {
    console.error('💥 WEBHOOK ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Return 405 for non-POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
