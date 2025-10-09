/**
 * Admin Subscription List API
 * GET /api/admin/subscriptions/list
 *
 * Lists all active subscriptions with customer details, filtering, sorting, and pagination.
 *
 * Access: Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/require-admin'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { subscriptionListQuerySchema } from '@/lib/schemas/admin-subscription-schemas'
import { z } from 'zod'

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
      plan: searchParams.get('plan') || undefined,
      status: searchParams.get('status') || undefined,
      sort: searchParams.get('sort') || 'date',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '25',
    }

    const validatedQuery = subscriptionListQuerySchema.parse(queryParams)
    const { plan, status, sort, page, limit } = validatedQuery

    const supabase = createAdminClient()

    // Build query for developers with subscriptions
    let query = supabase
      .from('developers')
      .select(`
        id,
        user_id,
        email,
        company_name,
        subscription_plan,
        subscription_status,
        stripe_subscription_id,
        stripe_customer_id,
        subscription_current_period_end,
        additional_projects_count,
        created_at,
        trial_ends_at
      `)
      .not('stripe_subscription_id', 'is', null)

    // Apply filters
    if (plan) {
      query = query.eq('subscription_plan', plan)
    }

    if (status) {
      query = query.eq('subscription_status', status)
    }

    // Get total count before pagination
    const { count: totalCount } = await supabase
      .from('developers')
      .select('*', { count: 'exact', head: true })
      .not('stripe_subscription_id', 'is', null)

    // Apply sorting
    if (sort === 'date') {
      query = query.order('created_at', { ascending: false })
    } else if (sort === 'customer') {
      query = query.order('company_name', { ascending: true, nullsFirst: false })
    }
    // Revenue sorting will be done after fetching Stripe data

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: developers, error: dbError } = await query

    if (dbError) {
      console.error('❌ ADMIN SUBSCRIPTIONS LIST: Database error:', dbError)
      return NextResponse.json(
        { error: 'Błąd pobierania subskrypcji z bazy danych' },
        { status: 500 }
      )
    }

    if (!developers || developers.length === 0) {
      return NextResponse.json({
        subscriptions: [],
        totalCount: 0,
        totalMRR: 0,
        page,
        limit,
        totalPages: 0,
      })
    }

    // Fetch Stripe subscription details for each developer
    const subscriptionsPromises = developers.map(async (dev) => {
      try {
        if (!dev.stripe_subscription_id) {
          return null
        }

        const subscription = await stripe().subscriptions.retrieve(
          dev.stripe_subscription_id,
          { expand: ['customer'] }
        )

        const customer = subscription.customer as any

        // Calculate MRR (Monthly Recurring Revenue) in PLN grosze
        let mrr = 0
        subscription.items.data.forEach((item) => {
          if (item.price.recurring?.interval === 'month') {
            mrr += (item.price.unit_amount || 0) * (item.quantity || 1)
          } else if (item.price.recurring?.interval === 'year') {
            // Convert annual to monthly
            mrr += Math.round(((item.price.unit_amount || 0) * (item.quantity || 1)) / 12)
          }
        })

        return {
          id: subscription.id,
          customerId: customer.id,
          customerEmail: customer.email || dev.email,
          customerName: customer.name || dev.company_name || 'Brak nazwy',
          companyName: dev.company_name || 'Brak nazwy firmy',
          currentPlan: dev.subscription_plan as 'basic' | 'pro' | 'enterprise',
          status: subscription.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid',
          mrr,
          nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
          createdAt: new Date(subscription.created * 1000).toISOString(),
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        }
      } catch (stripeError) {
        console.error(`❌ Failed to fetch Stripe subscription for ${dev.id}:`, stripeError)
        return null
      }
    })

    const subscriptionsResults = await Promise.all(subscriptionsPromises)
    let subscriptions = subscriptionsResults.filter((sub) => sub !== null) as any[]

    // Apply revenue sorting if requested
    if (sort === 'revenue') {
      subscriptions.sort((a, b) => b.mrr - a.mrr)
    }

    // Calculate total MRR
    const totalMRR = subscriptions.reduce((sum, sub) => sum + sub.mrr, 0)

    return NextResponse.json({
      subscriptions,
      totalCount: totalCount || 0,
      totalMRR,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit),
    })

  } catch (error) {
    console.error('❌ ADMIN SUBSCRIPTIONS LIST: Error:', error)

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
        error: 'Błąd serwera podczas pobierania subskrypcji',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
