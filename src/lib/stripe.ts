/**
 * FAZA 1: Integracja Stripe dla subskrypcji
 * Zastępuje Przelewy24 dla miesięcznych płatności kartą
 */

import Stripe from 'stripe';
import { SUBSCRIPTION_PLANS, SubscriptionPlanType, calculateMonthlyCost } from './subscription-plans';
import { createAdminClient } from './database';

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
  const { error } = await createAdminClient()
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

    const { data, error } = await createAdminClient()
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
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

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

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const developerId = session.metadata?.developer_id;
  const planType = session.metadata?.plan_type;
  const isTrial = session.metadata?.trial === 'true';

  if (!developerId) {
    console.error('No developer_id in checkout session metadata');
    return;
  }

  // Retrieve subscription details
  if (session.subscription) {
    const subscription = await getStripeClient().subscriptions.retrieve(session.subscription as string);

    // Determine subscription status (trialing or active)
    const subscriptionStatus = subscription.status === 'trialing' ? 'trialing' : 'active';
    const trialStatus = isTrial && subscription.status === 'trialing' ? 'active' : null;

    // Update developer with subscription info
    const updateData: Record<string, unknown> = {
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      payment_method_attached: true, // Card was required at checkout
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString(),
    };

    // Set plan type if provided
    if (planType) {
      updateData.subscription_plan = planType;
    }

    // Set trial status if this is a trial
    if (trialStatus) {
      updateData.trial_status = trialStatus;
    }

    await createAdminClient()
      .from('developers')
      .update(updateData)
      .eq('id', developerId);

    console.log(`✅ WEBHOOK: checkout.session.completed - Developer ${developerId}, Status: ${subscriptionStatus}, Trial: ${isTrial}`);

    // Send welcome email for trial start
    if (isTrial && subscription.status === 'trialing') {
      try {
        const { sendDeveloperWelcomeEmail } = await import('./email-service');
        const { data: developer } = await createAdminClient()
          .from('developers')
          .select('*')
          .eq('id', developerId)
          .single();

        if (developer) {
          await sendDeveloperWelcomeEmail(developer);
          console.log(`📧 WEBHOOK: Sent welcome email to ${developer.email}`);
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }
  }

  // Log payment (only if amount was charged)
  if (session.amount_total && session.amount_total > 0) {
    await createAdminClient()
      .from('payments')
      .insert({
        developer_id: developerId,
        amount: session.amount_total / 100, // Convert from cents
        currency: session.currency?.toUpperCase() || 'PLN',
        status: 'succeeded',
        stripe_payment_intent_id: session.payment_intent as string,
        payment_method: 'stripe'
      });
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const developerId = paymentIntent.metadata.developer_id;

  if (developerId) {
    // Aktywuj subskrypcję
    await createAdminClient()
      .from('developers')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);

    // Log payment
    await createAdminClient()
      .from('payments')
      .insert({
        developer_id: developerId,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'succeeded',
        stripe_payment_method_id: paymentIntent.payment_method as string,
        stripe_invoice_id: paymentIntent.invoice as string,
        payment_method: 'stripe'
      });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await getStripeClient().subscriptions.retrieve(invoice.subscription as string);
  const developerId = subscription.metadata.developer_id;

  if (developerId) {
    // Aktualizuj status subskrypcji
    await createAdminClient()
      .from('developers')
      .update({
        subscription_status: 'active',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);

    // Log payment
    await createAdminClient()
      .from('payments')
      .insert({
        developer_id: developerId,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency?.toUpperCase() || 'PLN',
        status: 'succeeded',
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        payment_method: 'stripe'
      });

    console.log(`✅ WEBHOOK: Renewed subscription for developer ${developerId}`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const developerId = subscription.metadata.developer_id;

  if (developerId) {
    // Get current developer state
    const { data: developer } = await createAdminClient()
      .from('developers')
      .select('trial_status, subscription_status')
      .eq('id', developerId)
      .single();

    // Map Stripe status to our subscription_status enum
    let status: 'trialing' | 'active' | 'inactive' | 'cancelled' | 'expired' | 'past_due' = 'inactive';
    let trialStatus: 'active' | 'expired' | 'converted' | 'cancelled' | null = null;

    if (subscription.status === 'active') {
      status = 'active';
      // Check if this is a trial conversion (from trialing to active)
      if (developer?.subscription_status === 'trialing' && developer?.trial_status === 'active') {
        trialStatus = 'converted';
        console.log(`🎉 WEBHOOK: Trial converted to paid for developer ${developerId}`);

        // Send trial conversion email
        try {
          const { data: devData } = await createAdminClient()
            .from('developers')
            .select('*')
            .eq('id', developerId)
            .single();

          if (devData) {
            const { sendTrialConvertedEmail } = await import('./email-service');
            await sendTrialConvertedEmail(devData);
            console.log(`📧 WEBHOOK: Sent trial converted email to ${devData.email}`);
          }
        } catch (emailError) {
          console.error('Failed to send trial conversion email:', emailError);
        }
      }
    } else if (subscription.status === 'trialing') {
      status = 'trialing';
    } else if (subscription.status === 'past_due') {
      status = 'past_due';
    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      status = 'cancelled';
    }

    // Sync additional projects count from Stripe subscription items
    const additionalProjectPriceId = process.env.STRIPE_PRICE_ADDITIONAL_PROJECT_MONTHLY;
    let additionalProjectsCount = 0;

    if (additionalProjectPriceId) {
      const additionalProjectItem = subscription.items.data.find(
        item => item.price.id === additionalProjectPriceId
      );

      if (additionalProjectItem) {
        additionalProjectsCount = additionalProjectItem.quantity || 0;
      }
    }

    const updateData: Record<string, unknown> = {
      subscription_status: status,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      additional_projects_count: additionalProjectsCount,
      updated_at: new Date().toISOString(),
    };

    if (trialStatus) {
      updateData.trial_status = trialStatus;
    }

    await createAdminClient()
      .from('developers')
      .update(updateData)
      .eq('id', developerId);

    console.log(`✅ WEBHOOK: subscription.updated - Developer ${developerId}, Status: ${status}, Additional Projects: ${additionalProjectsCount}, Trial: ${trialStatus || 'no change'}`);
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const developerId = subscription.metadata.developer_id;

  if (!developerId) {
    console.error('No developer_id in subscription metadata');
    return;
  }

  console.log(`⏰ WEBHOOK: trial_will_end - Developer ${developerId}, Trial ends in ~3 days`);

  try {
    // Get developer data
    const { data: developer } = await createAdminClient()
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single();

    if (!developer) {
      console.error(`Developer ${developerId} not found`);
      return;
    }

    // Calculate days remaining
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    const daysLeft = trialEnd
      ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 3;

    // Send trial ending reminder email
    try {
      const { sendTrialEndingReminderEmail } = await import('./email-service');
      await sendTrialEndingReminderEmail(developer, daysLeft);
      console.log(`📧 WEBHOOK: Sent trial ending reminder to ${developer.email} (${daysLeft} days left)`);
    } catch (emailError) {
      console.error('Failed to send trial ending reminder email:', emailError);
    };
  } catch (error) {
    console.error('Error handling trial_will_end:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const developerId = subscription.metadata.developer_id;

  if (developerId) {
    await createAdminClient()
      .from('developers')
      .update({
        subscription_status: 'cancelled',
        subscription_plan: 'trial',
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);

    console.log(`✅ WEBHOOK: Cancelled subscription for developer ${developerId}`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await getStripeClient().subscriptions.retrieve(invoice.subscription as string);
  const developerId = subscription.metadata.developer_id;

  if (developerId) {
    await createAdminClient()
      .from('developers')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);

    // Log failed payment
    await createAdminClient()
      .from('payments')
      .insert({
        developer_id: developerId,
        amount: invoice.amount_due / 100, // Convert from cents
        currency: invoice.currency?.toUpperCase() || 'PLN',
        status: 'failed',
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        payment_method: 'stripe'
      });

    console.log(`⚠️ WEBHOOK: invoice.payment_failed - Developer ${developerId}`);

    // Send payment failed email (we'll implement in Subtask 7)
    try {
      const { data: developer } = await createAdminClient()
        .from('developers')
        .select('*')
        .eq('id', developerId)
        .single();

      if (developer) {
        const { sendPaymentFailedEmail } = await import('./email-service');
        await sendPaymentFailedEmail(developer);
        console.log(`📧 WEBHOOK: Sent payment failed email to ${developer.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send payment failed email:', emailError);
    }
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

/**
 * Add additional project to Pro plan subscription
 * Creates a new subscription item for +50zł/month
 */
export async function addAdditionalProjectToSubscription(
  subscriptionId: string,
  additionalProjectsCount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const stripe = getStripeClient();

    // Get subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    // Find or create subscription item for additional projects
    const additionalProjectPriceId = process.env.STRIPE_PRICE_ADDITIONAL_PROJECT_MONTHLY;

    if (!additionalProjectPriceId) {
      console.error('STRIPE_PRICE_ADDITIONAL_PROJECT_MONTHLY not configured');
      return { success: false, error: 'Additional project pricing not configured' };
    }

    // Check if item already exists
    const existingItem = subscription.items.data.find(
      item => item.price.id === additionalProjectPriceId
    );

    if (existingItem) {
      // Update quantity
      await stripe.subscriptionItems.update(existingItem.id, {
        quantity: additionalProjectsCount
      });
    } else {
      // Create new subscription item
      await stripe.subscriptionItems.create({
        subscription: subscriptionId,
        price: additionalProjectPriceId,
        quantity: additionalProjectsCount
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding additional project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Remove additional project from Pro plan subscription
 */
export async function removeAdditionalProjectFromSubscription(
  subscriptionId: string,
  additionalProjectsCount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const stripe = getStripeClient();

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const additionalProjectPriceId = process.env.STRIPE_PRICE_ADDITIONAL_PROJECT_MONTHLY;

    if (!additionalProjectPriceId) {
      return { success: false, error: 'Configuration error' };
    }

    const existingItem = subscription.items.data.find(
      item => item.price.id === additionalProjectPriceId
    );

    if (!existingItem) {
      return { success: true }; // Nothing to remove
    }

    if (additionalProjectsCount === 0) {
      // Delete the item entirely
      await stripe.subscriptionItems.del(existingItem.id);
    } else {
      // Update quantity
      await stripe.subscriptionItems.update(existingItem.id, {
        quantity: additionalProjectsCount
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing additional project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}