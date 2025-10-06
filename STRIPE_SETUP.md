# Stripe Configuration Guide - OTORAPORT Basic Plan

## Overview
This guide explains how to configure Stripe for the OTORAPORT Basic Plan subscription (149 PLN/month).

---

## 1. Create Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create account (use business email)
3. Complete business verification

---

## 2. Create Basic Plan Product

### Step 1: Navigate to Products
1. Go to Stripe Dashboard: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Click **Products** in left sidebar
3. Click **+ Add product** button

### Step 2: Configure Product
Fill in the following details:

**Product Information:**
- **Name:** `OTORAPORT Basic Plan`
- **Description:** `Monthly subscription - CSV parser, ministry compliance, 2 projects`
- **Image:** Upload OTORAPORT logo (optional)

**Pricing:**
- **Pricing model:** Standard pricing
- **Price:** `149.00`
- **Currency:** `PLN` (Polish Zloty)
- **Billing period:** `Monthly`
- **Usage type:** Licensed

**Additional Settings:**
- ✅ Enable **"Customer portal"** (allows customers to manage subscription)
- ✅ Enable **"Promotion codes"** (for discounts/trials)

### Step 3: Save and Copy Price ID
1. Click **Save product**
2. You'll see a **Price ID** like `price_1Abc2DefGhijKlmnOpqrS`
3. **Copy this Price ID** - you'll need it for environment variables

---

## 3. Configure Environment Variables

### Development (.env.local)
```bash
# Stripe Keys (from https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price ID (from Product page)
STRIPE_BASIC_PLAN_PRICE_ID=price_xxxxx
```

### Production (Vercel)
Add the same variables in:
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all 4 Stripe variables
3. Select **Production** environment
4. Redeploy

---

## 4. Test Stripe Checkout Flow

### Test Mode (Development)
Use these test card numbers:

**Success:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Decline:**
- Card: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits

### Test Flow:
1. Start dev server: `npm run dev`
2. Sign up as test user
3. Go to Dashboard
4. Click "Upgrade Now" button
5. Complete checkout with test card
6. Verify:
   - Redirect to success URL
   - Subscription status updated in database
   - Email confirmation sent (if configured)

---

## 5. Enable Webhooks

Webhooks allow Stripe to notify your app about payment events.

### Development (Local Testing)
1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward events:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook secret (starts with `whsec_`)
5. Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

### Production (Vercel)
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. Enter endpoint URL: `https://otoraport.vercel.app/api/stripe/webhook`
4. Select events to listen for:
   - ✅ `checkout.session.completed`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy **Signing secret** (starts with `whsec_`)
7. Add to Vercel env: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

---

## 6. Customer Portal Configuration

Allow customers to manage their subscriptions:

1. Go to Stripe Dashboard → **Settings** → **Customer portal**
2. Enable:
   - ✅ **Update payment method**
   - ✅ **Cancel subscription**
   - ✅ **View invoices**
3. Save settings

---

## 7. Production Checklist

Before launching:

- [ ] Stripe account verified (business details submitted)
- [ ] Basic Plan product created (149 PLN/month)
- [ ] Price ID copied to production env vars
- [ ] Webhook endpoint configured with production URL
- [ ] Webhook secret added to production env vars
- [ ] Customer portal enabled
- [ ] Test successful payment flow in test mode
- [ ] Switch to live mode API keys
- [ ] Test with real card (small amount)
- [ ] Verify subscription activation in database
- [ ] Verify email notifications work

---

## 8. Monitoring & Support

### View Subscriptions
- Stripe Dashboard → **Customers** → View active subscriptions
- Check payment history, failed payments

### Handle Failed Payments
- Stripe automatically retries failed payments
- User status set to `past_due` after first failure
- After 3 failures, subscription cancelled

### Support Resources
- Stripe Docs: [https://stripe.com/docs](https://stripe.com/docs)
- Test Cards: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- Support: [https://support.stripe.com](https://support.stripe.com)

---

## 9. Common Issues & Fixes

### Issue: "Price ID not configured"
**Fix:** Add `STRIPE_BASIC_PLAN_PRICE_ID` to environment variables

### Issue: Webhook signature verification failed
**Fix:**
1. Check webhook secret matches Stripe dashboard
2. Ensure raw body is passed to webhook (Next.js config correct)

### Issue: Payment succeeds but subscription not activated
**Fix:**
1. Check webhook is configured and receiving events
2. Verify database has `current_period_end` and `subscription_status` fields
3. Check logs for webhook errors

---

**Last Updated:** October 6, 2025
**Stripe API Version:** 2024-12-18
