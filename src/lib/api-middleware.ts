/**
 * API v1 Middleware - Comprehensive request authentication and rate limiting
 * This middleware provides production-ready API key validation and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyManager, ApiResponseBuilder, type ApiKey } from './api-v1';

export interface ApiRequestContext {
  apiKey: ApiKey;
  developerId: string;
  requestId: string;
  startTime: number;
}

export interface ApiMiddlewareOptions {
  requiredResource: string;
  requiredAction: string;
  skipRateLimit?: boolean;
  customRateLimit?: number;
}

/**
 * Main API middleware function that handles authentication, rate limiting, and logging
 */
export async function withApiAuthentication<T>(
  request: NextRequest,
  options: ApiMiddlewareOptions,
  handler: (request: NextRequest, context: ApiRequestContext) => Promise<NextResponse<T>>
): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

  // Extract API key from headers
  const authHeader = request.headers.get('Authorization');
  const apiKey = extractApiKeyFromHeader(authHeader);

  if (!apiKey) {
    return NextResponse.json(
      ApiResponseBuilder.error('Missing or invalid Authorization header. Use: Authorization: Bearer ot_your_api_key', 401, requestId),
      { status: 401 }
    );
  }

  try {
    // Validate API key and permissions
    const validation = await ApiKeyManager.validateApiKey(
      apiKey,
      options.requiredResource,
      options.requiredAction
    );

    if (!validation.isValid || !validation.apiKey) {
      await logFailedRequest(
        request,
        'invalid_api_key',
        401,
        startTime,
        requestId,
        validation.error
      );

      return NextResponse.json(
        ApiResponseBuilder.error(validation.error || 'Invalid API key', 401, requestId),
        { status: 401 }
      );
    }

    // Check rate limiting (unless explicitly skipped)
    if (!options.skipRateLimit) {
      const rateLimitCheck = await ApiKeyManager.checkRateLimit(validation.apiKey.id);

      if (!rateLimitCheck.allowed) {
        await logFailedRequest(
          request,
          'rate_limited',
          429,
          startTime,
          requestId,
          'Rate limit exceeded'
        );

        return NextResponse.json(
          ApiResponseBuilder.rateLimited(
            rateLimitCheck.remaining,
            rateLimitCheck.resetAt,
            requestId
          ),
          {
            status: 429,
            headers: {
              'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
              'X-RateLimit-Reset': rateLimitCheck.resetAt
            }
          }
        );
      }
    }

    // Create request context
    const context: ApiRequestContext = {
      apiKey: validation.apiKey,
      developerId: validation.apiKey.developer_id,
      requestId,
      startTime
    };

    // Call the actual handler
    const response = await handler(request, context);

    // Log successful request
    await logSuccessfulRequest(request, context, response, startTime);

    // Add standard headers
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-API-Version', '1.0');

    return response;

  } catch (error) {
    console.error('API Middleware Error:', error);

    await logFailedRequest(
      request,
      'internal_error',
      500,
      startTime,
      requestId,
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      ApiResponseBuilder.error('Internal server error', 500, requestId),
      { status: 500 }
    );
  }
}

/**
 * Specialized middleware for webhook endpoints
 */
export async function withWebhookAuthentication(
  request: NextRequest,
  handler: (request: NextRequest, context: ApiRequestContext) => Promise<NextResponse>
): Promise<NextResponse> {
  return withApiAuthentication(
    request,
    {
      requiredResource: 'webhooks',
      requiredAction: 'write',
      skipRateLimit: true // Webhooks often have different rate limiting needs
    },
    handler
  );
}

/**
 * Read-only middleware for GET endpoints
 */
export async function withReadOnlyAuth(
  request: NextRequest,
  resource: string,
  handler: (request: NextRequest, context: ApiRequestContext) => Promise<NextResponse>
): Promise<NextResponse> {
  return withApiAuthentication(
    request,
    {
      requiredResource: resource,
      requiredAction: 'read'
    },
    handler
  );
}

/**
 * Write middleware for POST/PUT/PATCH endpoints
 */
export async function withWriteAuth(
  request: NextRequest,
  resource: string,
  handler: (request: NextRequest, context: ApiRequestContext) => Promise<NextResponse>
): Promise<NextResponse> {
  return withApiAuthentication(
    request,
    {
      requiredResource: resource,
      requiredAction: 'write'
    },
    handler
  );
}

/**
 * Helper function to extract API key from Authorization header
 */
function extractApiKeyFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;

  // Support both "Bearer token" and "token" formats
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) {
    return bearerMatch[1];
  }

  // Direct token (fallback)
  if (authHeader.startsWith('ot_')) {
    return authHeader;
  }

  return null;
}

/**
 * Log successful API request for analytics and monitoring
 */
async function logSuccessfulRequest(
  request: NextRequest,
  context: ApiRequestContext,
  response: NextResponse,
  startTime: number
): Promise<void> {
  try {
    const responseTime = Date.now() - startTime;
    const requestSize = getRequestSize(request);
    const responseSize = getResponseSize(response);

    await ApiKeyManager.logApiRequest(
      context.apiKey.id,
      context.developerId,
      request.method,
      getEndpointPath(request.url),
      getClientIP(request),
      request.headers.get('User-Agent') || '',
      requestSize,
      response.status,
      responseSize,
      responseTime
    );
  } catch (error) {
    console.error('Failed to log successful request:', error);
    // Don't throw - logging failures shouldn't break the request
  }
}

/**
 * Log failed API request for security monitoring
 */
async function logFailedRequest(
  request: NextRequest,
  reason: string,
  statusCode: number,
  startTime: number,
  requestId: string,
  errorMessage?: string
): Promise<void> {
  try {
    const responseTime = Date.now() - startTime;
    const requestSize = getRequestSize(request);

    // For failed requests, we can't use ApiKeyManager.logApiRequest
    // since we might not have a valid API key
    console.error(`API Request Failed [${requestId}]:`, {
      method: request.method,
      url: request.url,
      reason,
      statusCode,
      errorMessage,
      responseTime,
      requestSize,
      userAgent: request.headers.get('User-Agent'),
      ip: getClientIP(request)
    });
  } catch (error) {
    console.error('Failed to log failed request:', error);
  }
}

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  // Try various headers in order of preference
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-forwarded',
    'forwarded'
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return value.split(',')[0].trim();
    }
  }

  // Fallback to connection remote address (may not be available in all environments)
  return 'unknown';
}

/**
 * Extract endpoint path from full URL for cleaner logging
 */
function getEndpointPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return url;
  }
}

/**
 * Estimate request size from headers and body
 */
function getRequestSize(request: NextRequest): number {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10);
  }

  // Fallback estimation based on headers
  let size = 0;
  request.headers.forEach((value, key) => {
    size += key.length + value.length + 4; // +4 for ": " and "\r\n"
  });

  return size;
}

/**
 * Estimate response size
 */
function getResponseSize(response: NextResponse): number {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10);
  }

  // Estimate based on response headers (body size is harder to get)
  let size = 0;
  response.headers.forEach((value, key) => {
    size += key.length + value.length + 4;
  });

  return size;
}

/**
 * Development helper to validate API setup
 */
export async function validateApiSetup(): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  // Check database connectivity
  try {
    const { createAdminClient } = await import('./supabase');
    const { data, error } = await createAdminClient()
      .from('api_keys')
      .select('id')
      .limit(1);

    if (error) {
      errors.push(`Database connectivity error: ${error.message}`);
    }
  } catch (error) {
    errors.push(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check if required database tables exist
  const requiredTables = ['api_keys', 'api_requests', 'webhook_endpoints', 'webhook_deliveries', 'reports'];
  for (const table of requiredTables) {
    try {
      const { createAdminClient } = await import('./supabase');
      const { error } = await createAdminClient()
        .from(table)
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        errors.push(`Required table '${table}' does not exist in database`);
      }
    } catch (error) {
      warnings.push(`Could not verify table '${table}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}