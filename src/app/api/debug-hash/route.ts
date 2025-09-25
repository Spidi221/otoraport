import { NextRequest, NextResponse } from 'next/server';
import { MockApiStorage } from '@/lib/mock-api-data';

export async function POST(request: NextRequest) {
  try {
    const { test_key } = await request.json();

    if (!test_key) {
      return NextResponse.json({
        error: 'test_key is required'
      }, { status: 400 });
    }

    // Hash the provided key using Node.js crypto
    const crypto = require('crypto');
    const hashedKey = crypto.createHash('sha256').update(test_key).digest('hex');

    // Get all API keys from mock storage
    const allKeys = await MockApiStorage.getApiKeysByDeveloper('test-dev-123');

    // Find matching key
    const matchingKey = allKeys.find(key => key.key_hash === hashedKey);

    return NextResponse.json({
      status: 'debug_info',
      timestamp: new Date().toISOString(),
      input_key: test_key,
      hashed_key: hashedKey,
      available_keys: allKeys.map(key => ({
        id: key.id,
        name: key.name,
        key_preview: key.key_preview,
        key_hash: key.key_hash,
        hash_matches: key.key_hash === hashedKey
      })),
      matching_key: matchingKey ? {
        id: matchingKey.id,
        name: matchingKey.name,
        is_active: matchingKey.is_active
      } : null
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}