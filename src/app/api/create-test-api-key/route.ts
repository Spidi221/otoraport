import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyManagerWithFallback } from '@/lib/api-v1-fallback';
import { API_PERMISSION_TEMPLATES } from '@/lib/api-v1';

export async function POST(request: NextRequest) {
  try {
    const {
      developer_id = 'test-dev-123',
      name = 'Test API Key',
      permissions_template = 'full_access',
      rate_limit = 1000
    } = await request.json().catch(() => ({}));

    // Get permissions from template
    const permissions = API_PERMISSION_TEMPLATES[permissions_template] || API_PERMISSION_TEMPLATES.full_access;

    // Create API key using fallback system
    const { apiKey, plainKey } = await ApiKeyManagerWithFallback.createApiKey(
      developer_id,
      name,
      permissions,
      rate_limit
    );

    return NextResponse.json({
      status: 'success',
      message: 'Test API key created successfully',
      timestamp: new Date().toISOString(),
      api_key: {
        id: apiKey.id,
        name: apiKey.name,
        key_preview: apiKey.key_preview,
        permissions: apiKey.permissions,
        rate_limit: apiKey.rate_limit,
        is_active: apiKey.is_active,
        created_at: apiKey.created_at,
        expires_at: apiKey.expires_at
      },
      plain_key: plainKey,
      warning: 'Store this key securely. It will not be shown again.',
      test_command: `curl -H "Authorization: Bearer ${plainKey}" http://localhost:3000/api/v1/properties-test`
    });

  } catch (error) {
    console.error('Create test API key error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create test API key',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}