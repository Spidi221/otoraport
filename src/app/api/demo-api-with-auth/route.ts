/**
 * Demo API endpoint with working authentication for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-v1';

// Simple in-memory storage for this demo (would be database in production)
const demoApiKeys = new Map([
  ['demo_key_12345', {
    id: 'ak_demo_001',
    developer_id: 'demo-dev-123',
    name: 'Demo API Key',
    permissions: ['properties:read', 'properties:write', 'reports:read'],
    rate_limit: 1000,
    is_active: true,
    created_at: new Date().toISOString()
  }],
  ['demo_key_67890', {
    id: 'ak_demo_002',
    developer_id: 'demo-dev-456',
    name: 'Second Demo Key',
    permissions: ['properties:read'],
    rate_limit: 500,
    is_active: true,
    created_at: new Date().toISOString()
  }]
]);

// Simple rate limiting storage
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

  // Extract API key
  const authHeader = request.headers.get('Authorization');
  const apiKey = extractApiKeyFromHeader(authHeader);

  if (!apiKey) {
    return NextResponse.json(
      ApiResponseBuilder.error('Missing Authorization header. Use: Authorization: Bearer {api_key}', 401, requestId),
      { status: 401 }
    );
  }

  // Validate API key
  const keyData = demoApiKeys.get(apiKey);
  if (!keyData || !keyData.is_active) {
    return NextResponse.json(
      ApiResponseBuilder.error('Invalid or inactive API key', 401, requestId),
      { status: 401 }
    );
  }

  // Check permissions
  if (!keyData.permissions.includes('properties:read')) {
    return NextResponse.json(
      ApiResponseBuilder.error('Insufficient permissions for properties:read', 403, requestId),
      { status: 403 }
    );
  }

  // Check rate limiting
  const now = Date.now();
  const windowSize = 60000; // 1 minute
  const currentWindow = Math.floor(now / windowSize);
  const rateLimitKey = `${keyData.id}_${currentWindow}`;

  let rateLimitData = requestCounts.get(rateLimitKey);
  if (!rateLimitData) {
    rateLimitData = { count: 0, resetTime: (currentWindow + 1) * windowSize };
    requestCounts.set(rateLimitKey, rateLimitData);
  }

  rateLimitData.count++;

  if (rateLimitData.count > keyData.rate_limit) {
    return NextResponse.json(
      ApiResponseBuilder.rateLimited(
        0,
        new Date(rateLimitData.resetTime).toISOString(),
        requestId
      ),
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitData.resetTime).toISOString()
        }
      }
    );
  }

  // Mock properties data
  const mockProperties = [
    {
      id: 'demo_prop_1',
      apartment_number: 'A101',
      property_type: 'mieszkanie',
      price_per_m2: 8500,
      surface_area: 65,
      total_price: 552500,
      location: {
        wojewodztwo: 'mazowieckie',
        powiat: 'warszawa',
        gmina: 'Warszawa',
        miejscowosc: 'Warszawa',
        ulica: 'Demo Street 1'
      },
      features: {
        rooms_count: 3,
        floor: 2,
        balcony_area: 6.5,
        parking_spaces: ['P101']
      },
      status: 'available',
      created_at: '2025-01-01T10:00:00Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo_prop_2',
      apartment_number: 'B201',
      property_type: 'mieszkanie',
      price_per_m2: 9200,
      surface_area: 58,
      total_price: 533600,
      location: {
        wojewodztwo: 'mazowieckie',
        powiat: 'warszawa',
        gmina: 'Warszawa',
        miejscowosc: 'Warszawa',
        ulica: 'Demo Street 2'
      },
      features: {
        rooms_count: 2,
        floor: 3,
        balcony_area: 4.2,
        parking_spaces: []
      },
      status: 'reserved',
      created_at: '2025-01-01T10:15:00Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo_prop_3',
      apartment_number: 'C301',
      property_type: 'mieszkanie',
      price_per_m2: 8800,
      surface_area: 72,
      total_price: 633600,
      location: {
        wojewodztwo: 'mazowieckie',
        powiat: 'warszawa',
        gmina: 'Warszawa',
        miejscowosc: 'Warszawa',
        ulica: 'Demo Street 3'
      },
      features: {
        rooms_count: 4,
        floor: 4,
        balcony_area: 8.0,
        parking_spaces: ['P301', 'P302']
      },
      status: 'sold',
      created_at: '2025-01-01T10:30:00Z',
      updated_at: new Date().toISOString()
    }
  ];

  // Filter by status if requested
  const statusFilter = request.nextUrl.searchParams.get('status');
  const filteredProperties = statusFilter
    ? mockProperties.filter(prop => prop.status === statusFilter)
    : mockProperties;

  // Pagination
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  const responseTime = Date.now() - startTime;
  const remaining = keyData.rate_limit - rateLimitData.count;

  return NextResponse.json(
    ApiResponseBuilder.success(
      paginatedProperties,
      `Retrieved ${paginatedProperties.length} properties`,
      {
        page,
        limit,
        total: filteredProperties.length,
        has_more: endIndex < filteredProperties.length
      },
      requestId
    ),
    {
      headers: {
        'X-Request-ID': requestId,
        'X-API-Version': '1.0',
        'X-Response-Time': `${responseTime}ms`,
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitData.resetTime).toISOString(),
        'X-Developer-ID': keyData.developer_id
      }
    }
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

  // Extract API key
  const authHeader = request.headers.get('Authorization');
  const apiKey = extractApiKeyFromHeader(authHeader);

  if (!apiKey) {
    return NextResponse.json(
      ApiResponseBuilder.error('Missing Authorization header', 401, requestId),
      { status: 401 }
    );
  }

  // Validate API key
  const keyData = demoApiKeys.get(apiKey);
  if (!keyData || !keyData.is_active) {
    return NextResponse.json(
      ApiResponseBuilder.error('Invalid or inactive API key', 401, requestId),
      { status: 401 }
    );
  }

  // Check write permissions
  if (!keyData.permissions.includes('properties:write')) {
    return NextResponse.json(
      ApiResponseBuilder.error('Insufficient permissions for properties:write', 403, requestId),
      { status: 403 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => null);
  if (!body || !body.apartment_number) {
    return NextResponse.json(
      ApiResponseBuilder.error('Request body must include apartment_number', 400, requestId),
      { status: 400 }
    );
  }

  // Mock property creation
  const newProperty = {
    id: `demo_prop_${Date.now()}`,
    apartment_number: body.apartment_number,
    property_type: body.property_type || 'mieszkanie',
    price_per_m2: body.price_per_m2 || 8000,
    surface_area: body.surface_area || 60,
    total_price: (body.price_per_m2 || 8000) * (body.surface_area || 60),
    location: body.location || {
      wojewodztwo: 'mazowieckie',
      powiat: 'warszawa',
      gmina: 'Warszawa',
      miejscowosc: 'Warszawa',
      ulica: 'New Property Street'
    },
    features: body.features || {},
    status: body.status || 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return NextResponse.json(
    ApiResponseBuilder.success(
      newProperty,
      'Property created successfully (demo)',
      undefined,
      requestId
    ),
    {
      status: 201,
      headers: {
        'X-Request-ID': requestId,
        'X-API-Version': '1.0',
        'X-Developer-ID': keyData.developer_id
      }
    }
  );
}

function extractApiKeyFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) {
    return bearerMatch[1];
  }

  if (authHeader.startsWith('demo_key_')) {
    return authHeader;
  }

  return null;
}

// Utility function to list available demo keys
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    message: 'Demo API with Authentication',
    available_demo_keys: [
      {
        key: 'demo_key_12345',
        name: 'Full Access Demo Key',
        permissions: ['properties:read', 'properties:write', 'reports:read'],
        rate_limit: '1000 requests per minute',
        usage: 'curl -H "Authorization: Bearer demo_key_12345" http://localhost:3000/api/demo-api-with-auth'
      },
      {
        key: 'demo_key_67890',
        name: 'Read Only Demo Key',
        permissions: ['properties:read'],
        rate_limit: '500 requests per minute',
        usage: 'curl -H "Authorization: Bearer demo_key_67890" http://localhost:3000/api/demo-api-with-auth'
      }
    ],
    endpoints: {
      'GET /api/demo-api-with-auth': 'List properties with pagination and filtering',
      'POST /api/demo-api-with-auth': 'Create new property (requires write permission)',
      'OPTIONS /api/demo-api-with-auth': 'Get this help information'
    },
    query_parameters: {
      status: 'Filter by property status (available, reserved, sold)',
      page: 'Page number for pagination (default: 1)',
      limit: 'Items per page (default: 10, max: 100)'
    }
  });
}