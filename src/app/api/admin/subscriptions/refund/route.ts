/**
 * Admin Refund API
 * POST /api/admin/subscriptions/refund
 *
 * Process manual refund for a payment with audit logging.
 *
 * Access: Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/require-admin'
import { stripe } from '@/lib/stripe'
import { refundRequestSchema } from '@/lib/schemas/admin-subscription-schemas'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    const { user, developerId } = adminCheck

    // Parse and validate request body
    const body = await request.json()
    const validatedData = refundRequestSchema.parse(body)
    const { paymentIntentId, amount, reason } = validatedData

    // Verify payment intent exists and was successful
    let paymentIntent
    try {
      paymentIntent = await stripe().paymentIntents.retrieve(paymentIntentId)
    } catch (stripeError) {
      console.error('❌ ADMIN REFUND: Payment intent not found:', stripeError)
      return NextResponse.json(
        { error: 'Nie znaleziono płatności o podanym ID' },
        { status: 404 }
      )
    }

    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        {
          error: 'Nie można zwrócić płatności',
          message: `Płatność ma status: ${paymentIntent.status}. Można zwrócić tylko udane płatności.`
        },
        { status: 400 }
      )
    }

    // Check if already fully refunded
    if (paymentIntent.amount_refunded >= paymentIntent.amount) {
      return NextResponse.json(
        {
          error: 'Płatność została już w pełni zwrócona',
          refundedAmount: paymentIntent.amount_refunded,
          totalAmount: paymentIntent.amount
        },
        { status: 400 }
      )
    }

    // Calculate refund amount
    const refundAmount = amount || (paymentIntent.amount - paymentIntent.amount_refunded)

    // Validate refund amount doesn't exceed available
    const availableToRefund = paymentIntent.amount - paymentIntent.amount_refunded
    if (refundAmount > availableToRefund) {
      return NextResponse.json(
        {
          error: 'Kwota zwrotu przekracza dostępną kwotę',
          requestedAmount: refundAmount,
          availableAmount: availableToRefund
        },
        { status: 400 }
      )
    }

    // Create idempotency key for safe retries
    const idempotencyKey = `refund-${paymentIntentId}-${Date.now()}-${user.id}`

    // Process refund via Stripe
    let refund
    try {
      refund = await stripe().refunds.create(
        {
          payment_intent: paymentIntentId,
          amount: refundAmount,
          reason: 'requested_by_customer', // Stripe enum value
          metadata: {
            admin_reason: reason,
            admin_user_id: user.id,
            admin_email: user.email || 'unknown',
          }
        },
        {
          idempotencyKey,
        }
      )
    } catch (stripeError: any) {
      console.error('❌ ADMIN REFUND: Stripe error:', stripeError)

      // Handle specific Stripe errors
      if (stripeError.code === 'charge_already_refunded') {
        return NextResponse.json(
          { error: 'Płatność została już zwrócona' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: 'Zwrot nie powiódł się',
          message: stripeError.message || 'Błąd Stripe podczas przetwarzania zwrotu'
        },
        { status: 500 }
      )
    }

    // Get developer info for audit log
    const supabase = createAdminClient()
    const customerId = paymentIntent.customer as string | null
    let targetDeveloperId: string | null = null

    if (customerId) {
      const { data: developer } = await supabase
        .from('developers')
        .select('id, user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (developer) {
        targetDeveloperId = developer.id
      }
    }

    // Log admin action to audit trail
    await logAdminAction(
      user.id,
      'refund_payment',
      targetDeveloperId,
      {
        payment_intent_id: paymentIntentId,
        refund_id: refund.id,
        amount: refundAmount,
        currency: refund.currency,
        reason,
        refund_status: refund.status,
      },
      request
    )

    console.log(`✅ ADMIN REFUND: ${user.email} processed refund ${refund.id} for ${refundAmount} ${refund.currency}`)

    return NextResponse.json(
      {
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status as 'succeeded' | 'pending' | 'failed',
          created: new Date(refund.created * 1000).toISOString(),
          reason,
        },
        message: 'Zwrot został pomyślnie przetworzony'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ ADMIN REFUND: Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Nieprawidłowe dane wejściowe',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Błąd serwera podczas przetwarzania zwrotu',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
