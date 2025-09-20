/**
 * FAZA 1: Stripe Webhook Handler
 * Obsługuje eventy płatności z Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, handleStripeWebhook } from '@/lib/stripe';
import { applySecurityHeaders } from '@/lib/security';

// Stripe wymaga raw body dla weryfikacji podpisu
export async function POST(request: NextRequest) {
  try {
    // Pobierz raw body
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return new NextResponse('Missing signature', { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return new NextResponse('Webhook secret not configured', { status: 500 });
    }

    // Zweryfikuj webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new NextResponse(
        `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        { status: 400 }
      );
    }

    console.log(`Received Stripe webhook: ${event.type}`);

    // Obsłuż event
    const result = await handleStripeWebhook(event);

    if (!result.success) {
      console.error('Error processing webhook:', result.error);
      return new NextResponse(
        JSON.stringify({ error: 'Webhook processing failed' }),
        {
          status: 500,
          headers: applySecurityHeaders(new Headers({
            'Content-Type': 'application/json'
          }))
        }
      );
    }

    // Zwróć potwierdzenie
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json'
    }));

    return new NextResponse(
      JSON.stringify({
        received: true,
        event_type: event.type,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Unexpected error in Stripe webhook:', error);

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

// Stripe webhooks używają tylko POST
export async function GET() {
  const headers = applySecurityHeaders(new Headers({
    'Content-Type': 'application/json'
  }));

  return new NextResponse(
    JSON.stringify({
      error: 'Method not allowed. Stripe webhooks require POST.',
      allowed_methods: ['POST']
    }),
    { status: 405, headers }
  );
}