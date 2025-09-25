import { NextRequest, NextResponse } from 'next/server';
import { MockApiStorage } from '@/lib/mock-api-data';
import { ApiKey } from '@/lib/api-v1';

export async function POST(request: NextRequest) {
  try {
    const { action = 'test' } = await request.json().catch(() => ({}));

    if (action === 'create') {
      // Create a test API key directly
      const testKey: ApiKey = {
        id: 'test_key_123',
        developer_id: 'test-dev-123',
        name: 'Direct Test Key',
        key_hash: 'test_hash_123',
        key_preview: 'ot_direct...',
        permissions: [{ resource: 'properties', actions: ['read'], scopes: ['own'] }],
        rate_limit: 1000,
        is_active: true,
        created_at: new Date().toISOString()
      };

      await MockApiStorage.createApiKey(testKey);

      return NextResponse.json({
        status: 'created',
        message: 'Test key created directly',
        key: testKey
      });
    }

    if (action === 'check') {
      // Check what keys exist
      const allKeys = await MockApiStorage.getApiKeysByDeveloper('test-dev-123');
      const summary = await MockApiStorage.getDataSummary();

      return NextResponse.json({
        status: 'checked',
        message: 'Mock storage checked',
        keys: allKeys,
        summary
      });
    }

    if (action === 'find') {
      // Try to find the test key
      const foundKey = await MockApiStorage.findApiKeyByHash('test_hash_123');

      return NextResponse.json({
        status: 'searched',
        message: 'Search completed',
        found_key: foundKey
      });
    }

    return NextResponse.json({
      status: 'error',
      message: 'Invalid action',
      available_actions: ['create', 'check', 'find']
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}