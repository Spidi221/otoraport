import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { przelewy24 } from '@/lib/przelewy24'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    const sessionId = params.get('p24_session_id')
    const orderId = parseInt(params.get('p24_order_id') || '0')
    const amount = parseInt(params.get('p24_amount') || '0')
    const currency = params.get('p24_currency')
    
    console.log(`Przelewy24 webhook received: sessionId=${sessionId}, orderId=${orderId}, amount=${amount}`)

    if (!sessionId || !orderId || !amount) {
      console.error('Missing required webhook parameters')
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Find payment in database
    const { data: payment, error: findError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('przelewy24_session_id', sessionId)
      .single()

    if (findError || !payment) {
      console.error('Payment not found:', findError)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify transaction with Przelewy24
    const verification = await przelewy24.verifyTransaction(sessionId, amount, orderId)
    
    if (!verification.success) {
      console.error('Transaction verification failed:', verification.error)
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      )
    }

    let newStatus = 'failed'
    let subscriptionData = {}

    if (verification.verified) {
      newStatus = 'completed'
      
      // Calculate subscription end date
      const now = new Date()
      const subscriptionEndDate = new Date(now)
      
      if (payment.billing_period === 'yearly') {
        subscriptionEndDate.setFullYear(now.getFullYear() + 1)
      } else {
        subscriptionEndDate.setMonth(now.getMonth() + 1)
      }

      subscriptionData = {
        subscription_status: 'active',
        subscription_end_date: subscriptionEndDate.toISOString(),
        subscription_plan: payment.plan_type
      }
    }

    // Update payment status
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({ 
        status: newStatus,
        przelewy24_order_id: orderId.toString(),
        completed_at: verification.verified ? new Date().toISOString() : null
      })
      .eq('id', payment.id)

    if (updatePaymentError) {
      console.error('Failed to update payment:', updatePaymentError)
      return NextResponse.json(
        { error: 'Database update failed' },
        { status: 500 }
      )
    }

    // Update user subscription if payment successful
    if (verification.verified) {
      const { error: updateUserError } = await supabaseAdmin
        .from('developers')
        .update(subscriptionData)
        .eq('id', payment.developer_id)

      if (updateUserError) {
        console.error('Failed to update user subscription:', updateUserError)
        return NextResponse.json(
          { error: 'Subscription update failed' },
          { status: 500 }
        )
      }

      console.log(`Subscription activated for user ${payment.developer_id}: ${payment.plan_type} ${payment.billing_period}`)

      // Send welcome email to developer after successful payment
      try {
        const { data: developer } = await supabaseAdmin
          .from('developers')
          .select('*')
          .eq('id', payment.developer_id)
          .single()

        if (developer) {
          const { sendDeveloperWelcomeEmail } = await import('@/lib/email-service')
          await sendDeveloperWelcomeEmail(developer)
          console.log(`Welcome email sent to ${developer.email}`)
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't fail the webhook because of email error
      }
    }

    // Return success response (required by Przelewy24)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}