import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { przelewy24 } from '@/lib/przelewy24'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { plan, period } = body

    // Validate plan and period
    const plans = {
      starter: { monthly: 9900, yearly: 99000 }, // 99 zł, 990 zł (with 20% discount)
      professional: { monthly: 19900, yearly: 199000 } // 199 zł, 1990 zł
    }

    if (!plans[plan as keyof typeof plans] || !['monthly', 'yearly'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid plan or billing period' },
        { status: 400 }
      )
    }

    const amount = plans[plan as keyof typeof plans][period as 'monthly' | 'yearly']
    const sessionId = uuidv4()
    
    // Get user data
    const userId = (session.user as any).id
    const userEmail = session.user.email!

    console.log(`Creating payment for user ${userEmail}: ${plan} ${period} - ${amount} grosze`)

    // Store payment intent in database
    const { data: payment, error: dbError } = await supabaseAdmin
      .from('payments')
      .insert({
        developer_id: userId,
        amount: amount / 100, // Store in PLN
        currency: 'PLN',
        status: 'pending',
        przelewy24_session_id: sessionId,
        plan_type: plan,
        billing_period: period
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      )
    }

    // Register transaction with Przelewy24
    const p24Result = await przelewy24.registerTransaction({
      amount,
      currency: 'PLN',
      description: `OTORAPORT - ${plan} ${period} subscription`,
      email: userEmail,
      client: session.user.name || userEmail,
      urlReturn: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
      urlStatus: `${process.env.NEXTAUTH_URL}/api/payments/webhook`,
      sessionId
    })

    if (!p24Result.success) {
      console.error('Przelewy24 error:', p24Result.error)
      
      // Update payment status to failed
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id)

      return NextResponse.json(
        { error: p24Result.error || 'Payment initialization failed' },
        { status: 500 }
      )
    }

    // Update payment with token
    await supabaseAdmin
      .from('payments')
      .update({ 
        przelewy24_token: p24Result.token,
        status: 'initialized'
      })
      .eq('id', payment.id)

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      redirectUrl: p24Result.redirectUrl,
      sessionId
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}