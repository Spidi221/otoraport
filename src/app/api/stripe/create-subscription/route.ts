/**
 * FAZA 1: Endpoint do tworzenia subskrypcji Stripe
 * Zastępuje Przelewy24 dla miesięcznych płatności
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
import { createStripeCustomer, createStripeSubscription, createBillingRecord } from '@/lib/stripe';
import { getDeveloperById } from '@/lib/database';
import { SubscriptionPlanType, SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';
import { applySecurityHeaders, validateEmail } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Sprawdź autoryzację
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      const headers = applySecurityHeaders(new Headers({
        'Content-Type': 'application/json'
      }));
      return new NextResponse(
        JSON.stringify({ error: auth.error || 'Unauthorized' }),
        { status: 401, headers }
      );
    }

    const developerId = auth.developer.id;

    // Pobierz dane z request
    const body = await request.json();
    const { planType, additionalProjects = 0 } = body;

    // Walidacja danych
    if (!planType || !Object.keys(SUBSCRIPTION_PLANS).includes(planType)) {
      const headers = applySecurityHeaders(new Headers({
        'Content-Type': 'application/json'
      }));
      return new NextResponse(
        JSON.stringify({ error: 'Invalid plan type' }),
        { status: 400, headers }
      );
    }

    if (planType !== 'pro' && additionalProjects > 0) {
      const headers = applySecurityHeaders(new Headers({
        'Content-Type': 'application/json'
      }));
      return new NextResponse(
        JSON.stringify({ error: 'Additional projects only available for Pro plan' }),
        { status: 400, headers }
      );
    }

    // Pobierz dane dewelopera
    const developer = await getDeveloperById(developerId);
    if (!developer) {
      const headers = applySecurityHeaders(new Headers({
        'Content-Type': 'application/json'
      }));
      return new NextResponse(
        JSON.stringify({ error: 'Developer not found' }),
        { status: 404, headers }
      );
    }

    // Sprawdź czy już ma Stripe customer
    let customerId = developer.stripe_customer_id;

    if (!customerId) {
      // Utwórz nowego Stripe customer
      const customerResult = await createStripeCustomer(
        developer.email,
        developer.name,
        developer.company_name || undefined
      );

      if (!customerResult.success || !customerResult.customerId) {
        const headers = applySecurityHeaders(new Headers({
          'Content-Type': 'application/json'
        }));
        return new NextResponse(
          JSON.stringify({
            error: 'Failed to create customer',
            details: customerResult.error
          }),
          { status: 500, headers }
        );
      }

      customerId = customerResult.customerId;
    }

    // Utwórz subskrypcję
    const subscriptionResult = await createStripeSubscription(
      developerId,
      customerId,
      planType as SubscriptionPlanType,
      additionalProjects
    );

    if (!subscriptionResult.success) {
      const headers = applySecurityHeaders(new Headers({
        'Content-Type': 'application/json'
      }));
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to create subscription',
          details: subscriptionResult.error
        }),
        { status: 500, headers }
      );
    }

    // Utwórz billing record
    const billingResult = await createBillingRecord(
      developerId,
      planType as SubscriptionPlanType,
      additionalProjects,
      subscriptionResult.subscriptionId
    );

    if (!billingResult.success) {
      console.error('Failed to create billing record:', billingResult.error);
      // Nie przerywamy procesu, ale logujemy błąd
    }

    // Zwróć client_secret do frontend
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        success: true,
        subscription_id: subscriptionResult.subscriptionId,
        client_secret: subscriptionResult.clientSecret,
        plan: {
          type: planType,
          name: SUBSCRIPTION_PLANS[planType as SubscriptionPlanType].displayName,
          additional_projects: additionalProjects
        }
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Error creating Stripe subscription:', error);

    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to create subscription',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers }
    );
  }
}

// GET endpoint dla informacji o planach
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);
    if (!auth.success || !auth.user || !auth.developer) {
      const headers = applySecurityHeaders(new Headers({
        'Content-Type': 'application/json'
      }));
      return new NextResponse(
        JSON.stringify({ error: auth.error || 'Unauthorized' }),
        { status: 401, headers }
      );
    }

    const url = new URL(request.url);
    const planType = url.searchParams.get('plan');

    if (planType && !Object.keys(SUBSCRIPTION_PLANS).includes(planType)) {
      const headers = applySecurityHeaders(new Headers({
        'Content-Type': 'application/json'
      }));
      return new NextResponse(
        JSON.stringify({ error: 'Invalid plan type' }),
        { status: 400, headers }
      );
    }

    const plans = planType
      ? { [planType]: SUBSCRIPTION_PLANS[planType as SubscriptionPlanType] }
      : SUBSCRIPTION_PLANS;

    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        plans,
        currency: 'PLN',
        billing_period: 'monthly'
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Error fetching subscription plans:', error);

    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers }
    );
  }
}