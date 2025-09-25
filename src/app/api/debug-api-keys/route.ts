import { NextRequest, NextResponse } from 'next/server';
import { MockApiStorage } from '@/lib/mock-api-data';

export async function GET(request: NextRequest) {
  try {
    const developerId = request.nextUrl.searchParams.get('developer_id') || 'test-dev-123';

    // Get all API keys for the developer
    const apiKeys = await MockApiStorage.getApiKeysByDeveloper(developerId);

    // Get data summary
    const summary = await MockApiStorage.getDataSummary();

    // Get recent requests
    const requests = await MockApiStorage.getApiRequestsByDeveloper(developerId, 10);

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      developer_id: developerId,
      api_keys: apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        key_preview: key.key_preview,
        permissions: key.permissions,
        rate_limit: key.rate_limit,
        is_active: key.is_active,
        created_at: key.created_at,
        last_used_at: key.last_used_at
      })),
      data_summary: summary,
      recent_requests: requests.slice(0, 5),
      test_instructions: {
        curl_example: apiKeys.length > 0
          ? `curl -H "Authorization: Bearer ${apiKeys[0].key_preview.replace('...', 'FULL_KEY_HERE')}" http://localhost:3000/api/v1/properties-test`
          : 'No API keys found. Initialize sample data first.',
        note: 'The key_preview shows only the first 8 characters. You need the full key for testing.'
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}