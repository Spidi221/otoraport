import { NextResponse } from 'next/server'
import { applySecurityHeaders } from '@/lib/security'

/**
 * Standardized API response types
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    [key: string]: any
  }
}

export interface ApiErrorResponse {
  success: false
  error: string
  details?: string[]
  code?: string
  timestamp?: string
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Standard HTTP status codes for API responses
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: ApiSuccessResponse<T>['meta'],
  status: number = HTTP_STATUS.OK
): NextResponse {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta })
  }

  const headers = applySecurityHeaders(new Headers({
    'Content-Type': 'application/json'
  }))

  return new NextResponse(JSON.stringify(response), {
    status,
    headers
  })
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: string[],
  code?: string
): NextResponse {
  const response: ApiErrorResponse = {
    success: false,
    error,
    ...(details && { details }),
    ...(code && { code }),
    timestamp: new Date().toISOString()
  }

  const headers = applySecurityHeaders(new Headers({
    'Content-Type': 'application/json'
  }))

  // Log error for monitoring
  console.error(`API Error ${status}:`, response)

  return new NextResponse(JSON.stringify(response), {
    status,
    headers
  })
}

/**
 * Common error response creators
 */
export const ErrorResponses = {
  badRequest: (message = 'Nieprawidłowe żądanie', details?: string[]) =>
    createErrorResponse(message, HTTP_STATUS.BAD_REQUEST, details, 'BAD_REQUEST'),

  unauthorized: (message = 'Brak autoryzacji') =>
    createErrorResponse(message, HTTP_STATUS.UNAUTHORIZED, undefined, 'UNAUTHORIZED'),

  forbidden: (message = 'Brak uprawnień') =>
    createErrorResponse(message, HTTP_STATUS.FORBIDDEN, undefined, 'FORBIDDEN'),

  notFound: (message = 'Nie znaleziono') =>
    createErrorResponse(message, HTTP_STATUS.NOT_FOUND, undefined, 'NOT_FOUND'),

  methodNotAllowed: (message = 'Metoda niedozwolona') =>
    createErrorResponse(message, HTTP_STATUS.METHOD_NOT_ALLOWED, undefined, 'METHOD_NOT_ALLOWED'),

  conflict: (message = 'Konflikt danych') =>
    createErrorResponse(message, HTTP_STATUS.CONFLICT, undefined, 'CONFLICT'),

  validationError: (message = 'Błąd walidacji', details?: string[]) =>
    createErrorResponse(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, details, 'VALIDATION_ERROR'),

  rateLimitExceeded: (message = 'Za dużo żądań', retryAfter?: number) => {
    const headers = applySecurityHeaders(new Headers({
      'Content-Type': 'application/json',
      ...(retryAfter && { 'Retry-After': retryAfter.toString() })
    }))

    const response: ApiErrorResponse = {
      success: false,
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString()
    }

    return new NextResponse(JSON.stringify(response), {
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
      headers
    })
  },

  internalServerError: (message = 'Wewnętrzny błąd serwera') =>
    createErrorResponse(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, undefined, 'INTERNAL_ERROR')
}

/**
 * Success response creators
 */
export const SuccessResponses = {
  ok: <T>(data: T, message?: string) =>
    createSuccessResponse(data, message, undefined, HTTP_STATUS.OK),

  created: <T>(data: T, message = 'Utworzono pomyślnie') =>
    createSuccessResponse(data, message, undefined, HTTP_STATUS.CREATED),

  noContent: () => {
    const headers = applySecurityHeaders(new Headers())
    return new NextResponse(null, {
      status: HTTP_STATUS.NO_CONTENT,
      headers
    })
  },

  paginated: <T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ) =>
    createSuccessResponse(
      data,
      message,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      HTTP_STATUS.OK
    )
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('API route error:', error)

      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('not found')) {
          return ErrorResponses.notFound(error.message)
        }
        if (error.message.includes('unauthorized')) {
          return ErrorResponses.unauthorized(error.message)
        }
        if (error.message.includes('forbidden')) {
          return ErrorResponses.forbidden(error.message)
        }
        if (error.message.includes('validation')) {
          return ErrorResponses.validationError(error.message)
        }

        return ErrorResponses.internalServerError(
          process.env.NODE_ENV === 'development' ? error.message : 'Wystąpił błąd serwera'
        )
      }

      return ErrorResponses.internalServerError()
    }
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): string[] {
  const missingFields: string[] = []

  for (const field of requiredFields) {
    if (!body || body[field] === undefined || body[field] === null || body[field] === '') {
      missingFields.push(field)
    }
  }

  return missingFields
}

/**
 * Parse and validate JSON request body
 */
export async function parseRequestBody(request: Request): Promise<any> {
  try {
    const body = await request.json()
    return body
  } catch (error) {
    throw new Error('Nieprawidłowy format JSON')
  }
}

/**
 * Response time tracker middleware
 */
export function withResponseTimeTracking<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  endpoint?: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()

    try {
      const result = await handler(...args)
      const duration = Date.now() - startTime

      // Log slow requests (>1000ms)
      if (duration > 1000) {
        console.warn(`⚠️  Slow API response: ${endpoint || 'unknown'} took ${duration}ms`)
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ API error in ${endpoint || 'unknown'} after ${duration}ms:`, error)
      throw error
    }
  }
}

/**
 * HTTP method validator
 */
export function validateHttpMethod(
  request: Request,
  allowedMethods: string[]
): NextResponse | null {
  if (!allowedMethods.includes(request.method)) {
    return ErrorResponses.methodNotAllowed(
      `Metoda ${request.method} nie jest obsługiwana. Dozwolone: ${allowedMethods.join(', ')}`
    )
  }
  return null
}