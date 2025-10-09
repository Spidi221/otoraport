# Admin Subscription Management API

## Overview

This document describes the admin subscription management API endpoints created for OTO-RAPORT. These endpoints allow administrators to manage user subscriptions, process refunds, view failed payments, and update subscription plans with full audit logging.

## Authentication & Authorization

All endpoints require admin access. The system uses the existing `requireAdmin` middleware which checks:
- User is authenticated (via Supabase Auth)
- User has `is_admin = true` in `developers` table OR has role in `admin_roles` table
- All admin actions are logged to `admin_audit_logs` table

## API Endpoints

### 1. GET /api/admin/subscriptions/list

Lists all active subscriptions with customer details, filtering, sorting, and pagination.

**Query Parameters:**
- `plan` (optional): Filter by plan type (`basic`, `pro`, `enterprise`)
- `status` (optional): Filter by status (`active`, `trialing`, `past_due`, `canceled`, `unpaid`)
- `sort` (optional): Sort by `date`, `revenue`, or `customer` (default: `date`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 25, max: 100)

**Response:**
```typescript
{
  subscriptions: [
    {
      id: string                    // Stripe subscription ID
      customerId: string            // Stripe customer ID
      customerEmail: string
      customerName: string
      companyName: string
      currentPlan: 'basic' | 'pro' | 'enterprise'
      status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
      mrr: number                   // Monthly recurring revenue in PLN grosze
      nextBillingDate: string       // ISO date
      createdAt: string
      trialEnd: string | null
      cancelAt: string | null
    }
  ],
  totalCount: number,
  totalMRR: number,
  page: number,
  limit: number,
  totalPages: number
}
```

**Example:**
```bash
GET /api/admin/subscriptions/list?plan=pro&status=active&sort=revenue&page=1&limit=25
```

---

### 2. GET /api/admin/subscriptions/failed-payments

Lists all failed payment attempts with customer details and failure reasons.

**Query Parameters:**
- `search` (optional): Search by customer email/name
- `plan` (optional): Filter by plan type
- `status` (optional): Filter by status (`failed`, `requires_payment_method`, `requires_action`)
- `startDate` (optional): Filter from date (ISO format)
- `endDate` (optional): Filter to date (ISO format)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 25, max: 100)

**Response:**
```typescript
{
  failedPayments: [
    {
      id: string                    // Payment intent ID
      customerId: string
      customerEmail: string
      customerName: string
      plan: string
      amount: number                // in PLN grosze
      currency: 'pln'
      failureReason: string         // Stripe failure message
      failureCode: string           // Stripe failure code
      attemptedAt: string           // ISO date
      status: 'failed' | 'requires_payment_method' | 'requires_action'
      invoiceId: string | null
    }
  ],
  totalCount: number,
  page: number,
  limit: number,
  totalPages: number
}
```

**Example:**
```bash
GET /api/admin/subscriptions/failed-payments?search=example@email.com&startDate=2025-01-01T00:00:00Z
```

---

### 3. POST /api/admin/subscriptions/refund

Process manual refund for a payment with audit logging.

**Request Body:**
```typescript
{
  paymentIntentId: string        // Required: Stripe payment intent ID
  amount?: number                // Optional: Amount in PLN grosze (defaults to full refund)
  reason: string                 // Required: Admin reason (min 3 chars, max 500)
}
```

**Response (Success):**
```typescript
{
  success: true,
  refund: {
    id: string                   // Refund ID
    amount: number               // Refunded amount in grosze
    currency: string             // 'pln'
    status: 'succeeded' | 'pending' | 'failed'
    created: string              // ISO date
    reason: string               // Admin's reason
  },
  message: string
}
```

**Error Responses:**
- `404`: Payment intent not found
- `400`: Payment not successful / already refunded / invalid amount
- `500`: Stripe error during refund

**Example:**
```bash
POST /api/admin/subscriptions/refund
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890",
  "amount": 14900,
  "reason": "Klient zgłosił problem z usługą"
}
```

**Audit Log:**
- Action: `refund_payment`
- Logged data: payment_intent_id, refund_id, amount, currency, reason, refund_status
- Includes IP address and user agent

---

### 4. POST /api/admin/subscriptions/update-plan

Manually upgrade/downgrade a user's subscription with proration and edge case validation.

**Request Body:**
```typescript
{
  developerId: string                    // Required: Developer UUID
  newPlan: 'basic' | 'pro' | 'enterprise'  // Required: Target plan
  effectiveDate?: 'immediate' | 'next_billing'  // Default: 'next_billing'
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'  // Default: 'create_prorations'
}
```

**Response (Success):**
```typescript
{
  success: true,
  subscription: {
    id: string
    currentPlan: string
    status: string
    nextBillingDate: string      // ISO date
    proratedAmount: number | null  // If prorated, how much will be charged/credited
  },
  message: string                // Polish success message
}
```

**Edge Cases Handled:**
- ✅ Downgrade from Enterprise → Pro: Checks for active custom domains
- ✅ Downgrade to Basic: Validates project count (max 1) and property count (max 20)
- ✅ Trial to paid: Handles trial_end appropriately
- ✅ Same plan: Returns error if plan isn't changing

**Error Responses:**
- `404`: Developer or subscription not found
- `400`: No subscription / same plan / invalid configuration
- `422`: Edge case violations (e.g., too many projects for downgrade)
- `500`: Stripe error or configuration error

**Example:**
```bash
POST /api/admin/subscriptions/update-plan
Content-Type: application/json

{
  "developerId": "550e8400-e29b-41d4-a716-446655440000",
  "newPlan": "pro",
  "effectiveDate": "immediate",
  "prorationBehavior": "create_prorations"
}
```

**Audit Log:**
- Action: `update_subscription_plan`
- Logged data: developer_id, old_plan, new_plan, effective_date, proration_behavior, prorated_amount
- Includes IP address and user agent

---

## Security Features

### 1. Admin Authorization
All endpoints use `requireAdmin()` middleware:
```typescript
const adminCheck = await requireAdmin(request)
if (adminCheck instanceof NextResponse) {
  return adminCheck // 401 or 403 error
}
```

### 2. Input Validation
All inputs validated with Zod schemas:
- Type safety
- Min/max length validation
- Format validation (UUID, email, dates)
- Custom error messages in Polish

### 3. Audit Logging
All admin actions logged to `admin_audit_logs` table:
- Admin user ID
- Action type
- Target user/developer ID
- Action details (JSON)
- IP address
- User agent
- Timestamp

View audit logs:
```sql
SELECT * FROM admin_audit_logs
WHERE action = 'update_subscription_plan'
ORDER BY created_at DESC;
```

### 4. Idempotency
Refund operations use idempotency keys:
```typescript
const idempotencyKey = `refund-${paymentIntentId}-${Date.now()}-${user.id}`
```

This prevents duplicate refunds if the request is retried.

---

## Error Handling

All endpoints follow consistent error format:

**Validation Error (400):**
```json
{
  "error": "Nieprawidłowe dane wejściowe",
  "details": [
    {
      "path": ["paymentIntentId"],
      "message": "Payment Intent ID jest wymagany"
    }
  ]
}
```

**Not Found (404):**
```json
{
  "error": "Nie znaleziono subskrypcji"
}
```

**Business Logic Error (422):**
```json
{
  "error": "Nie można zmienić planu",
  "message": "Wykryto problemy z downgrade:",
  "issues": [
    "Użytkownik ma 3 aktywnych projektów, a Basic pozwala na 1"
  ]
}
```

**Server Error (500):**
```json
{
  "error": "Błąd serwera podczas przetwarzania",
  "message": "Detailed error message"
}
```

---

## Database Schema

### admin_audit_logs table (already exists)
```sql
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Indexes:
- `idx_admin_audit_logs_admin_user_id` on `admin_user_id`
- `idx_admin_audit_logs_target_user_id` on `target_user_id`
- `idx_admin_audit_logs_created_at` on `created_at DESC`

RLS Policies:
- Admins can SELECT
- System can INSERT (service role)

---

## Environment Variables Required

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...

# Stripe Price IDs (for update-plan endpoint)
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ADDITIONAL_PROJECT_MONTHLY=price_...

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Testing Checklist

### Manual Testing

**Subscriptions List:**
- [ ] Fetch all subscriptions without filters
- [ ] Filter by plan (basic, pro, enterprise)
- [ ] Filter by status (active, trialing, past_due)
- [ ] Sort by date, revenue, customer
- [ ] Test pagination (page 1, 2, 3)
- [ ] Verify MRR calculation includes additional projects

**Failed Payments:**
- [ ] Fetch all failed payments
- [ ] Search by customer email
- [ ] Filter by date range
- [ ] Filter by plan and status
- [ ] Test pagination

**Refund:**
- [ ] Process full refund
- [ ] Process partial refund
- [ ] Try to refund already refunded payment (should error)
- [ ] Try to refund non-existent payment (should 404)
- [ ] Verify audit log entry created

**Update Plan:**
- [ ] Upgrade from Basic → Pro
- [ ] Upgrade from Pro → Enterprise
- [ ] Downgrade from Enterprise → Pro (without custom domain)
- [ ] Try downgrade with custom domain (should 422)
- [ ] Try downgrade to Basic with too many projects (should 422)
- [ ] Try immediate vs next_billing effective date
- [ ] Try different proration behaviors
- [ ] Verify audit log entry created
- [ ] Verify database updated correctly

### Security Testing
- [ ] Try accessing without authentication (should 401)
- [ ] Try accessing as non-admin user (should 403)
- [ ] Verify all admin actions logged to audit_logs
- [ ] Verify idempotency key prevents duplicate refunds

---

## Files Created

### API Routes
1. `/src/app/api/admin/subscriptions/list/route.ts` - Subscriptions list endpoint
2. `/src/app/api/admin/subscriptions/failed-payments/route.ts` - Failed payments endpoint
3. `/src/app/api/admin/subscriptions/refund/route.ts` - Refund processing endpoint
4. `/src/app/api/admin/subscriptions/update-plan/route.ts` - Plan update endpoint

### Validation Schemas
5. `/src/lib/schemas/admin-subscription-schemas.ts` - Zod validation schemas

### Documentation
6. `/docs/ADMIN_SUBSCRIPTION_API.md` - This file

---

## Integration with Admin Panel

These API endpoints are designed to be consumed by the admin panel UI. Recommended UI components:

**SubscriptionsList.tsx:**
```typescript
const { data } = await fetch('/api/admin/subscriptions/list?sort=revenue&page=1')
// Display table with customer info, plan, MRR, status
```

**FailedPaymentsList.tsx:**
```typescript
const { data } = await fetch('/api/admin/subscriptions/failed-payments')
// Display table with failure reasons, amounts, customer info
```

**RefundModal.tsx:**
```typescript
await fetch('/api/admin/subscriptions/refund', {
  method: 'POST',
  body: JSON.stringify({ paymentIntentId, amount, reason })
})
```

**UpdatePlanModal.tsx:**
```typescript
await fetch('/api/admin/subscriptions/update-plan', {
  method: 'POST',
  body: JSON.stringify({ developerId, newPlan, effectiveDate })
})
```

---

## Future Enhancements

1. **Rate Limiting**: Add rate limits for refund/update-plan endpoints
2. **Bulk Operations**: Support bulk plan updates
3. **Subscription Analytics**: Aggregate metrics (MRR trends, churn rate)
4. **Email Notifications**: Send email to user when admin changes their plan
5. **Webhook Processing**: Handle Stripe webhooks for subscription updates
6. **Export Functionality**: Export subscription data to CSV/Excel

---

## Support

For questions or issues with these endpoints, contact the development team or create an issue in the project repository.

**Last Updated:** 2025-10-09
**Version:** 1.0.0
