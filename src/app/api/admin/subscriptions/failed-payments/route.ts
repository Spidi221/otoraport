/**
 * Admin Failed Payments API
 * GET /api/admin/subscriptions/failed-payments
 *
 * Lists all failed payment attempts with customer details and failure reasons.
 *
 * Access: Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/require-admin'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { failedPaymentsQuerySchema } from '@/lib/schemas/admin-subscription-schemas'
import { z } from 'zod'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      search: searchParams.get('search') || undefined,
      plan: searchParams.get('plan') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '25',
    }

    const validatedQuery = failedPaymentsQuerySchema.parse(queryParams)
    const { search, plan, status, startDate, endDate, page, limit } = validatedQuery

    const supabase = createAdminClient()

    // Build Stripe query parameters
    const stripeParams: Stripe.PaymentIntentListParams = {
      limit: 100, // Fetch more from Stripe, then filter and paginate
    }

    // Fetch payment intents from Stripe
    // We'll fetch failed, requires_payment_method, and requires_action statuses
    const paymentIntentsPromises = [
      stripe().paymentIntents.list({ ...stripeParams, expand: ['data.customer'] }),
    ]

    const [paymentIntentsResponse] = await Promise.all(paymentIntentsPromises)

    // Filter payment intents by status and date
    let filteredPayments = paymentIntentsResponse.data.filter((pi) => {
      // Only include failed or problematic payment intents
      const isFailedStatus =
        pi.status === 'failed' ||
        pi.status === 'requires_payment_method' ||
        pi.status === 'requires_action'

      if (!isFailedStatus) return false

      // Filter by status if specified
      if (status && pi.status !== status) return false

      // Filter by date range
      const paymentDate = new Date(pi.created * 1000)
      if (startDate && paymentDate < new Date(startDate)) return false
      if (endDate && paymentDate > new Date(endDate)) return false

      return true
    })

    // Fetch customer and developer details
    const failedPaymentsPromises = filteredPayments.map(async (pi) => {
      try {
        const customer = pi.customer as Stripe.Customer | null

        if (!customer) {
          return null
        }

        // Get developer from database by customer ID
        const { data: developer } = await supabase
          .from('developers')
          .select('id, email, company_name, subscription_plan')
          .eq('stripe_customer_id', customer.id)
          .maybeSingle()

        // Filter by plan if specified
        if (plan && developer?.subscription_plan !== plan) {
          return null
        }

        // Filter by search (email or name)
        if (search) {
          const searchLower = search.toLowerCase()
          const emailMatch = developer?.email?.toLowerCase().includes(searchLower)
          const nameMatch = customer.name?.toLowerCase().includes(searchLower)
          const companyMatch = developer?.company_name?.toLowerCase().includes(searchLower)

          if (!emailMatch && !nameMatch && !companyMatch) {
            return null
          }
        }

        // Get failure details
        const lastPaymentError = pi.last_payment_error
        const failureReason = lastPaymentError?.message || 'Nieznany błąd płatności'
        const failureCode = lastPaymentError?.code || lastPaymentError?.decline_code || 'unknown'

        return {
          id: pi.id,
          customerId: customer.id,
          customerEmail: developer?.email || customer.email || 'Brak email',
          customerName: customer.name || developer?.company_name || 'Brak nazwy',
          plan: developer?.subscription_plan || 'unknown',
          amount: pi.amount,
          currency: pi.currency,
          failureReason,
          failureCode,
          attemptedAt: new Date(pi.created * 1000).toISOString(),
          status: pi.status as 'failed' | 'requires_payment_method' | 'requires_action',
          invoiceId: pi.invoice ? (pi.invoice as string) : null,
        }
      } catch (error) {
        console.error(`❌ Failed to process payment intent ${pi.id}:`, error)
        return null
      }
    })

    const failedPaymentsResults = await Promise.all(failedPaymentsPromises)
    const failedPayments = failedPaymentsResults.filter((payment) => payment !== null) as any[]

    // Sort by attempted date (newest first)
    failedPayments.sort((a, b) =>
      new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()
    )

    // Apply pagination
    const totalCount = failedPayments.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPayments = failedPayments.slice(startIndex, endIndex)

    return NextResponse.json({
      failedPayments: paginatedPayments,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    })

  } catch (error) {
    console.error('❌ ADMIN FAILED PAYMENTS: Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Nieprawidłowe parametry zapytania',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Błąd serwera podczas pobierania nieudanych płatności',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
