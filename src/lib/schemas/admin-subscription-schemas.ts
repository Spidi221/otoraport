/**
 * Zod Validation Schemas for Admin Subscription Management APIs
 * Task: Admin Subscription Management with Stripe Integration
 */

import { z } from 'zod'

// ============================================================================
// Query Parameter Schemas
// ============================================================================

export const subscriptionListQuerySchema = z.object({
  plan: z.enum(['basic', 'pro', 'enterprise']).optional(),
  status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'unpaid']).optional(),
  sort: z.enum(['date', 'revenue', 'customer']).optional().default('date'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
})

export const failedPaymentsQuerySchema = z.object({
  search: z.string().optional(),
  plan: z.enum(['basic', 'pro', 'enterprise']).optional(),
  status: z.enum(['failed', 'requires_payment_method', 'requires_action']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
})

// ============================================================================
// Request Body Schemas
// ============================================================================

export const refundRequestSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment Intent ID jest wymagany'),
  amount: z.number().int().positive().optional(),
  reason: z.string().min(3, 'Powód zwrotu musi mieć co najmniej 3 znaki').max(500, 'Powód zwrotu jest za długi'),
})

export const updatePlanRequestSchema = z.object({
  developerId: z.string().uuid('Nieprawidłowe ID developera'),
  newPlan: z.enum(['basic', 'pro', 'enterprise'], {
    errorMap: () => ({ message: 'Plan musi być jednym z: basic, pro, enterprise' })
  }),
  effectiveDate: z.enum(['immediate', 'next_billing'], {
    errorMap: () => ({ message: 'Effective date musi być: immediate lub next_billing' })
  }).default('next_billing'),
  prorationBehavior: z.enum(['create_prorations', 'none', 'always_invoice'], {
    errorMap: () => ({ message: 'Proration behavior jest nieprawidłowy' })
  }).default('create_prorations'),
})

// ============================================================================
// Response Type Inference
// ============================================================================

export type SubscriptionListQuery = z.infer<typeof subscriptionListQuerySchema>
export type FailedPaymentsQuery = z.infer<typeof failedPaymentsQuerySchema>
export type RefundRequest = z.infer<typeof refundRequestSchema>
export type UpdatePlanRequest = z.infer<typeof updatePlanRequestSchema>
