/**
 * API Error Handler
 * Centralized error handling for API routes with security headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { applySecurityHeaders } from './security-headers'

export interface APIError {
  message: string
  code?: string
  status?: number
  details?: unknown
}

/**
 * Create a standardized error response with security headers
 */
export function createAPIErrorResponse(
  error: APIError | Error | string,
  defaultStatus: number = 500
): NextResponse {
  let errorMessage: string
  let errorCode: string | undefined
  let errorStatus: number
  let errorDetails: unknown | undefined

  // Parse error input
  if (typeof error === 'string') {
    errorMessage = error
    errorStatus = defaultStatus
  } else if (error instanceof Error) {
    errorMessage = error.message
    errorStatus = defaultStatus
  } else {
    errorMessage = error.message
    errorCode = error.code
    errorStatus = error.status || defaultStatus
    errorDetails = error.details
  }

  // Create response
  const response = NextResponse.json(
    {
      error: errorMessage,
      ...(errorCode && { code: errorCode }),
      status: errorStatus,
      ...(errorDetails && process.env.NODE_ENV === 'development' && { details: errorDetails })
    },
    { status: errorStatus }
  )

  // Add security headers
  applySecurityHeaders(response.headers)

  return response
}

/**
 * Wrapper for API route handlers with automatic error handling and security headers
 */
export function withAPIErrorHandler<T = unknown>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      const response = await handler(req, context)

      // Add security headers to successful responses too
      applySecurityHeaders(response.headers)

      return response
    } catch (error) {
      console.error('❌ API Error:', error)

      // Log to Sentry in production (if configured)
      if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
        // Server-side only
        try {
          const Sentry = await import('@sentry/nextjs')
          Sentry.captureException(error)
        } catch (sentryError) {
          console.error('Failed to log to Sentry:', sentryError)
        }
      }

      // Return error response with security headers
      if (error instanceof Error) {
        return createAPIErrorResponse({
          message: process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, 500)
      }

      return createAPIErrorResponse('An unexpected error occurred', 500)
    }
  }
}

/**
 * Common API errors for reuse
 */
export const APIErrors = {
  Unauthorized: {
    message: 'Unauthorized - Authentication required',
    code: 'UNAUTHORIZED',
    status: 401
  },
  Forbidden: {
    message: 'Forbidden - You do not have permission to access this resource',
    code: 'FORBIDDEN',
    status: 403
  },
  NotFound: {
    message: 'Resource not found',
    code: 'NOT_FOUND',
    status: 404
  },
  MethodNotAllowed: {
    message: 'Method not allowed',
    code: 'METHOD_NOT_ALLOWED',
    status: 405
  },
  RateLimitExceeded: {
    message: 'Rate limit exceeded - Please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    status: 429
  },
  ValidationError: (details: string) => ({
    message: `Validation error: ${details}`,
    code: 'VALIDATION_ERROR',
    status: 400
  }),
  InternalServerError: {
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    status: 500
  }
} as const
