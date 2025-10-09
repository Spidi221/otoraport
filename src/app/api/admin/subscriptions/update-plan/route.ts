/**
 * Admin Update Subscription Plan API
 * POST /api/admin/subscriptions/update-plan
 *
 * Manually upgrade/downgrade a user's subscription with proration and audit logging.
 *
 * Access: Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/require-admin'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { updatePlanRequestSchema } from '@/lib/schemas/admin-subscription-schemas'
import { z } from 'zod'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans'

export const dynamic = 'force-dynamic'

// Map plan types to Stripe price IDs (from environment variables)
function getPriceIdForPlan(planType: 'basic' | 'pro' | 'enterprise'): string | null {
  const priceIdMap: Record<string, string | undefined> = {
    basic: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    pro: process.env.STRIPE_PRICE_PRO_MONTHLY,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
  }

  return priceIdMap[planType] || null
}

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    const { user } = adminCheck

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updatePlanRequestSchema.parse(body)
    const { developerId, newPlan, effectiveDate, prorationBehavior } = validatedData

    const supabase = createAdminClient()

    // Get developer and current subscription info
    const { data: developer, error: devError } = await supabase
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
        additional_projects_count
      `)
      .eq('id', developerId)
      .maybeSingle()

    if (devError || !developer) {
      console.error('❌ ADMIN UPDATE PLAN: Developer not found:', devError)
      return NextResponse.json(
        { error: 'Nie znaleziono developera o podanym ID' },
        { status: 404 }
      )
    }

    if (!developer.stripe_subscription_id) {
      return NextResponse.json(
        {
          error: 'Developer nie ma aktywnej subskrypcji Stripe',
          message: 'Użytkownik musi najpierw utworzyć subskrypcję'
        },
        { status: 400 }
      )
    }

    // Check if plan is actually changing
    if (developer.subscription_plan === newPlan) {
      return NextResponse.json(
        {
          error: 'Plan nie został zmieniony',
          message: `Użytkownik już ma plan ${newPlan}`
        },
        { status: 400 }
      )
    }

    // Get new plan price ID
    const newPriceId = getPriceIdForPlan(newPlan)
    if (!newPriceId) {
      console.error(`❌ ADMIN UPDATE PLAN: Missing price ID for plan ${newPlan}`)
      return NextResponse.json(
        {
          error: 'Błąd konfiguracji',
          message: `Brak ID ceny dla planu ${newPlan}. Skontaktuj się z supportem.`
        },
        { status: 500 }
      )
    }

    // Retrieve current subscription from Stripe
    let subscription
    try {
      subscription = await stripe().subscriptions.retrieve(developer.stripe_subscription_id)
    } catch (stripeError) {
      console.error('❌ ADMIN UPDATE PLAN: Failed to retrieve subscription:', stripeError)
      return NextResponse.json(
        { error: 'Nie znaleziono subskrypcji w Stripe' },
        { status: 404 }
      )
    }

    // Check for edge cases
    const oldPlan = developer.subscription_plan as 'basic' | 'pro' | 'enterprise'
    const edgeCaseErrors: string[] = []

    // Downgrade from Enterprise to Pro: Check custom domain
    if (oldPlan === 'enterprise' && newPlan === 'pro') {
      const { data: customDomain } = await supabase
        .from('custom_domains')
        .select('id')
        .eq('developer_id', developerId)
        .eq('status', 'verified')
        .maybeSingle()

      if (customDomain) {
        edgeCaseErrors.push('Użytkownik ma aktywną niestandardową domenę (dostępną tylko w Enterprise)')
      }
    }

    // Downgrade to Basic: Check project limits
    if (newPlan === 'basic') {
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', developerId)
        .eq('status', 'active')

      const basicLimit = SUBSCRIPTION_PLANS.basic.projectsLimit || 1
      if ((projectCount || 0) > basicLimit) {
        edgeCaseErrors.push(`Użytkownik ma ${projectCount} aktywnych projektów, a Basic pozwala na ${basicLimit}`)
      }

      // Check property limits
      const { count: propertyCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', developerId)

      const basicPropertyLimit = SUBSCRIPTION_PLANS.basic.propertiesLimit || 20
      if ((propertyCount || 0) > basicPropertyLimit) {
        edgeCaseErrors.push(`Użytkownik ma ${propertyCount} mieszkań, a Basic pozwala na ${basicPropertyLimit}`)
      }
    }

    if (edgeCaseErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Nie można zmienić planu',
          message: 'Wykryto problemy z downgrade:',
          issues: edgeCaseErrors
        },
        { status: 422 }
      )
    }

    // Get the current subscription item (base plan)
    const currentItem = subscription.items.data[0]
    if (!currentItem) {
      return NextResponse.json(
        { error: 'Subskrypcja nie ma elementów' },
        { status: 500 }
      )
    }

    // Update subscription via Stripe
    let updatedSubscription
    try {
      const updateParams: any = {
        items: [{
          id: currentItem.id,
          price: newPriceId,
        }],
        proration_behavior: prorationBehavior,
      }

      // Handle effective date
      if (effectiveDate === 'immediate') {
        updateParams.billing_cycle_anchor = 'now'
        updateParams.proration_behavior = 'create_prorations' // Force proration for immediate changes
      }

      updatedSubscription = await stripe().subscriptions.update(
        developer.stripe_subscription_id,
        updateParams
      )
    } catch (stripeError: any) {
      console.error('❌ ADMIN UPDATE PLAN: Stripe error:', stripeError)
      return NextResponse.json(
        {
          error: 'Nie udało się zaktualizować subskrypcji w Stripe',
          message: stripeError.message || 'Unknown Stripe error'
        },
        { status: 500 }
      )
    }

    // Calculate prorated amount if applicable
    let proratedAmount: number | null = null
    if (prorationBehavior === 'create_prorations' && updatedSubscription.latest_invoice) {
      try {
        const invoice = await stripe().invoices.retrieve(updatedSubscription.latest_invoice as string)
        proratedAmount = invoice.amount_due
      } catch (invoiceError) {
        console.warn('⚠️ Could not retrieve prorated invoice:', invoiceError)
      }
    }

    // Update developer in database
    const { error: updateError } = await supabase
      .from('developers')
      .update({
        subscription_plan: newPlan,
        subscription_current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', developerId)

    if (updateError) {
      console.error('❌ ADMIN UPDATE PLAN: Database update error:', updateError)
      // Subscription was updated in Stripe but not in DB - log this critical issue
      console.error(`🚨 CRITICAL: Subscription updated in Stripe but not in DB for developer ${developerId}`)
    }

    // Log admin action to audit trail
    await logAdminAction(
      user.id,
      'update_subscription_plan',
      developer.user_id,
      {
        developer_id: developerId,
        old_plan: oldPlan,
        new_plan: newPlan,
        effective_date: effectiveDate,
        proration_behavior: prorationBehavior,
        prorated_amount: proratedAmount,
        subscription_id: developer.stripe_subscription_id,
      },
      request
    )

    console.log(`✅ ADMIN UPDATE PLAN: ${user.email} updated ${developer.email} from ${oldPlan} to ${newPlan}`)

    return NextResponse.json(
      {
        success: true,
        subscription: {
          id: updatedSubscription.id,
          currentPlan: newPlan,
          status: updatedSubscription.status,
          nextBillingDate: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
          proratedAmount,
        },
        message: `Plan został pomyślnie zaktualizowany z ${oldPlan} na ${newPlan}`
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ ADMIN UPDATE PLAN: Error:', error)

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
        error: 'Błąd serwera podczas aktualizacji planu',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
