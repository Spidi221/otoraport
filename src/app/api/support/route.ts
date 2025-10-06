/**
 * Support Request API Endpoint
 * Handles customer support inquiries with auto-responder and team forwarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendSupportAutoResponder, forwardSupportRequestToTeam } from '@/lib/support-email'
import { withAPIErrorHandler, createAPIErrorResponse, APIErrors } from '@/lib/api-error-handler'

interface SupportRequest {
  name: string
  email: string
  subject: string
  message: string
  category?: 'technical' | 'billing' | 'general' | 'urgent'
  developerEmail?: string
}

/**
 * POST /api/support
 * Submit a support request
 */
export const POST = withAPIErrorHandler(async (request: NextRequest) => {
  const body: SupportRequest = await request.json()

  // Validate required fields
  if (!body.name || !body.email || !body.subject || !body.message) {
    return createAPIErrorResponse(
      APIErrors.ValidationError('Missing required fields: name, email, subject, message')
    )
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    return createAPIErrorResponse(
      APIErrors.ValidationError('Invalid email format')
    )
  }

  // Validate category if provided
  const validCategories = ['technical', 'billing', 'general', 'urgent']
  if (body.category && !validCategories.includes(body.category)) {
    return createAPIErrorResponse(
      APIErrors.ValidationError('Invalid category. Must be one of: technical, billing, general, urgent')
    )
  }

  // Send auto-responder to user
  await sendSupportAutoResponder(body)

  // Forward request to support team
  await forwardSupportRequestToTeam(body)

  return NextResponse.json(
    {
      success: true,
      message: 'Support request submitted successfully. You will receive a confirmation email shortly.'
    },
    { status: 200 }
  )
})
