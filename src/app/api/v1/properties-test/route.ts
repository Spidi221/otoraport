/**
 * Test API endpoint using fallback authentication system
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyManagerWithFallback } from '@/lib/api-v1-fallback';
import { ApiResponseBuilder } from '@/lib/api-v1';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

  // Extract API key from headers
  const authHeader = request.headers.get('Authorization');
  const apiKey = extractApiKeyFromHeader(authHeader);

  if (!apiKey) {
    return NextResponse.json(
      ApiResponseBuilder.error('Missing or invalid Authorization header. Use: Authorization: Bearer {api_key}', 401, requestId),
      { status: 401 }
    );
  }

  try {
    // Validate API key using fallback system
    const validation = await ApiKeyManagerWithFallback.validateApiKey(
      apiKey,
      'properties',
      'read'
    );

    if (!validation.isValid || !validation.apiKey) {
      return NextResponse.json(
        ApiResponseBuilder.error(validation.error || 'Invalid API key', 401, requestId),
        { status: 401 }
      );
    }

    // Check rate limiting
    const rateLimitCheck = await ApiKeyManagerWithFallback.checkRateLimit(validation.apiKey.id);

    if (!rateLimitCheck.allowed) {
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

    // Mock properties data for testing
    const mockProperties = [
      {
        id: 'prop_1',
        apartment_number: 'A1',
        property_type: 'mieszkanie',
        price_per_m2: 8500,
        surface_area: 65,
        total_price: 552500,
        location: {
          wojewodztwo: 'mazowieckie',
          powiat: 'warszawa',
          gmina: 'Warszawa',
          miejscowosc: 'Warszawa',
          ulica: 'Testowa 1'
        },
        features: {
          rooms_count: 3,
          floor: 2,
          parking_spaces: ['P1']
        },
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prop_2',
        apartment_number: 'B2',
        property_type: 'mieszkanie',
        price_per_m2: 9200,
        surface_area: 58,
        total_price: 533600,
        location: {
          wojewodztwo: 'mazowieckie',
          powiat: 'warszawa',
          gmina: 'Warszawa',
          miejscowosc: 'Warszawa',
          ulica: 'Testowa 2'
        },
        features: {
          rooms_count: 2,
          floor: 3,
          parking_spaces: []
        },
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Log the API request
    const responseTime = Date.now() - startTime;
    await ApiKeyManagerWithFallback.logApiRequest(
      validation.apiKey.id,
      validation.apiKey.developer_id,
      'GET',
      '/api/v1/properties-test',
      getClientIP(request),
      request.headers.get('User-Agent') || '',
      getRequestSize(request),
      200,
      JSON.stringify(mockProperties).length,
      responseTime
    );

    return NextResponse.json(
      ApiResponseBuilder.success(
        mockProperties,
        `Retrieved ${mockProperties.length} properties (test data)`,
        {
          page: 1,
          limit: 50,
          total: mockProperties.length,
          has_more: false
        },
        requestId
      ),
      {
        headers: {
          'X-Request-ID': requestId,
          'X-API-Version': '1.0',
          'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
          'X-RateLimit-Reset': rateLimitCheck.resetAt
        }
      }
    );

  } catch (error) {
    console.error('Properties test API error:', error);
    return NextResponse.json(
      ApiResponseBuilder.error('Internal server error', 500, requestId),
      { status: 500 }
    );
  }
}

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

function getClientIP(request: NextRequest): string {
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'x-forwarded',
    'forwarded'
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      return value.split(',')[0].trim();
    }
  }

  return 'unknown';
}

function getRequestSize(request: NextRequest): number {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10);
  }

  let size = 0;
  request.headers.forEach((value, key) => {
    size += key.length + value.length + 4;
  });

  return size;
}