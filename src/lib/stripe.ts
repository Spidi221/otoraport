/**
 * FAZA 1: Integracja Stripe dla subskrypcji
 * Zastępuje Przelewy24 dla miesięcznych płatności kartą
 */

import Stripe from 'stripe';
import { SUBSCRIPTION_PLANS, SubscriptionPlanType, calculateMonthlyCost } from './subscription-plans';
import { supabaseAdmin } from './database';

// Lazy Stripe client initialization to prevent build errors
let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia', // Latest API version
      typescript: true,
    });
  }
  return stripe;
}

// Export function instead of client directly
export { getStripeClient as stripe };

/**
 * Tworzy Stripe Customer dla dewelopera
 */
export async function createStripeCustomer(
  email: string,
  name: string,
  companyName?: string
): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const customer = await getStripeClient().customers.create({
      email,
      name,
      metadata: {
        company_name: companyName || '',
        source: 'devreporter'
      },
      description: `DevReporter customer: ${companyName || name}`
    });

    return {
      success: true,
      customerId: customer.id
    };
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Tworzy subskrypcję Stripe
 */
export async function createStripeSubscription(
  developerId: string,
  customerId: string,
  planType: SubscriptionPlanType,
  additionalProjects: number = 0
): Promise<{ success: boolean; subscriptionId?: string; clientSecret?: string; error?: string }> {
  try {
    const plan = SUBSCRIPTION_PLANS[planType];
    const totalAmount = calculateMonthlyCost(planType, additionalProjects);

    // Utwórz product jeśli nie istnieje
    const productName = `${plan.displayName}${additionalProjects > 0 ? ` + ${additionalProjects} dodatkowe projekty` : ''}`;

    const product = await getStripeClient().products.create({
      name: productName,
      description: `DevReporter ${plan.displayName} subscription`,
      metadata: {
        plan_type: planType,
        additional_projects: additionalProjects.toString(),
        developer_id: developerId
      }
    });

    // Utwórz price
    const price = await getStripeClient().prices.create({
      product: product.id,
      unit_amount: totalAmount,
      currency: 'pln',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: planType,
        additional_projects: additionalProjects.toString()
      }
    });

    // Utwórz subskrypcję
    const subscription = await getStripeClient().subscriptions.create({
      customer: customerId,
      items: [{
        price: price.id,
        quantity: 1
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        developer_id: developerId,
        plan_type: planType,
        additional_projects: additionalProjects.toString()
      }
    });

    // Pobierz client_secret z payment_intent
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    // Zapisz w bazie danych
    await updateDeveloperStripeInfo(developerId, customerId, subscription.id);

    return {
      success: true,
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret || undefined
    };

  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Aktualizuje informacje Stripe w bazie danych
 */
async function updateDeveloperStripeInfo(
  developerId: string,
  customerId: string,
  subscriptionId: string
) {
  const { error } = await supabaseAdmin
    .from('developers')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', developerId);

  if (error) {
    console.error('Error updating developer Stripe info:', error);
    throw error;
  }
}

/**
 * Tworzy billing record w bazie danych
 */
export async function createBillingRecord(
  developerId: string,
  planType: SubscriptionPlanType,
  additionalProjects: number = 0,
  stripeSubscriptionId?: string
): Promise<{ success: boolean; billingId?: string; error?: string }> {
  try {
    const plan = SUBSCRIPTION_PLANS[planType];
    const basePlanPrice = plan.price;
    const additionalProjectsFee = (planType === 'pro' && additionalProjects > 0)
      ? additionalProjects * (plan.additionalProjectFee || 0)
      : 0;
    const totalMonthlyCost = basePlanPrice + additionalProjectsFee;

    const { data, error } = await supabaseAdmin
      .from('subscription_billing')
      .insert({
        developer_id: developerId,
        base_plan_price: basePlanPrice,
        additional_projects_fee: additionalProjectsFee,
        total_monthly_cost: totalMonthlyCost,
        billing_date: new Date().toISOString().split('T')[0],
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        stripe_subscription_id: stripeSubscriptionId,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      billingId: data.id
    };

  } catch (error) {
    console.error('Error creating billing record:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Obsługuje webhook od Stripe
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { success: true };

  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const developerId = paymentIntent.metadata.developer_id;

  if (developerId) {
    // Aktywuj subskrypcję
    await supabaseAdmin
      .from('developers')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);

    // Log payment
    await supabaseAdmin
      .from('payments')
      .insert({
        developer_id: developerId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'completed',
        stripe_payment_method_id: paymentIntent.payment_method as string,
        stripe_invoice_id: paymentIntent.invoice as string,
        payment_method: 'stripe',
        is_subscription: true,
        completed_at: new Date().toISOString()
      });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await getStripeClient().subscriptions.retrieve(invoice.subscription as string);
  const developerId = subscription.metadata.developer_id;

  if (developerId) {
    // Aktualizuj status subskrypcji
    await supabaseAdmin
      .from('developers')
      .update({
        subscription_status: 'active',
        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);

    // Aktualizuj billing record
    await supabaseAdmin
      .from('subscription_billing')
      .update({
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        status: 'active',
        next_billing_date: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const developerId = subscription.metadata.developer_id;

  if (developerId) {
    const status = subscription.status === 'active' ? 'active' : 'inactive';

    await supabaseAdmin
      .from('developers')
      .update({
        subscription_status: status,
        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const developerId = subscription.metadata.developer_id;

  if (developerId) {
    await supabaseAdmin
      .from('developers')
      .update({
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);

    // Aktualizuj billing record
    await supabaseAdmin
      .from('subscription_billing')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await getStripeClient().subscriptions.retrieve(invoice.subscription as string);
  const developerId = subscription.metadata.developer_id;

  if (developerId) {
    await supabaseAdmin
      .from('developers')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);

    // Log failed payment
    await supabaseAdmin
      .from('payments')
      .insert({
        developer_id: developerId,
        amount: invoice.amount_due,
        currency: 'PLN',
        status: 'failed',
        stripe_invoice_id: invoice.id,
        payment_method: 'stripe',
        is_subscription: true
      });
  }
}

/**
 * Pobiera informacje o subskrypcji Stripe
 */
export async function getStripeSubscriptionInfo(subscriptionId: string) {
  try {
    const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'latest_invoice']
    });

    return {
      success: true,
      subscription
    };
  } catch (error) {
    console.error('Error retrieving Stripe subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Anuluje subskrypcję Stripe
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    if (immediately) {
      await getStripeClient().subscriptions.cancel(subscriptionId);
    } else {
      await getStripeClient().subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error canceling Stripe subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}