import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { ApiKeyManager, ApiResponseBuilder, WebhookManager, WEBHOOK_EVENTS } from '@/lib/api-v1';

// GET /api/v1/webhooks - List webhook endpoints
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let apiKey: any = null;
  let requestSize = 0;
  let responseSize = 0;
  let responseStatus = 200;

  try {
    // Validate API key
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      responseStatus = 401;
      return NextResponse.json(
        ApiResponseBuilder.error('Missing or invalid authorization header'),
        { status: 401 }
      );
    }

    const key = authorization.substring(7);
    requestSize = key.length;

    const validation = await ApiKeyManager.validateApiKey(key, 'webhooks', 'read');
    if (!validation.isValid) {
      responseStatus = 401;
      return NextResponse.json(
        ApiResponseBuilder.error(validation.error || 'Invalid API key'),
        { status: 401 }
      );
    }

    apiKey = validation.apiKey;

    // Check rate limiting
    const rateLimit = await ApiKeyManager.checkRateLimit(apiKey.id);
    if (!rateLimit.allowed) {
      responseStatus = 429;
      return NextResponse.json(
        ApiResponseBuilder.rateLimited(rateLimit.remaining, rateLimit.resetAt),
        { status: 429 }
      );
    }

    // Get webhooks from database
    const { data: webhooks, error } = await createAdminClient()
      .from('webhook_endpoints')
      .select(`
        id,
        url,
        events,
        is_active,
        retry_policy,
        last_success_at,
        last_failure_at,
        failure_count,
        created_at
      `)
      .eq('developer_id', apiKey.developer_id);

    if (error) {
      throw error;
    }

    const response = ApiResponseBuilder.success(
      webhooks || [],
      `Retrieved ${webhooks?.length || 0} webhook endpoints`
    );

    const responseBody = JSON.stringify(response);
    responseSize = responseBody.length;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Webhooks GET API error:', error);
    responseStatus = 500;
    return NextResponse.json(
      ApiResponseBuilder.error('Internal server error'),
      { status: 500 }
    );

  } finally {
    if (apiKey) {
      const responseTime = Date.now() - startTime;
      await ApiKeyManager.logApiRequest(
        apiKey.id,
        apiKey.developer_id,
        'GET',
        '/api/v1/webhooks',
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        requestSize,
        responseStatus,
        responseSize,
        responseTime
      );
    }
  }
}

// POST /api/v1/webhooks - Create webhook endpoint
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let apiKey: any = null;
  let requestSize = 0;
  let responseSize = 0;
  let responseStatus = 201;

  try {
    // Validate API key
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      responseStatus = 401;
      return NextResponse.json(
        ApiResponseBuilder.error('Missing or invalid authorization header'),
        { status: 401 }
      );
    }

    const key = authorization.substring(7);
    const validation = await ApiKeyManager.validateApiKey(key, 'webhooks', 'write');
    if (!validation.isValid) {
      responseStatus = 401;
      return NextResponse.json(
        ApiResponseBuilder.error(validation.error || 'Invalid API key'),
        { status: 401 }
      );
    }

    apiKey = validation.apiKey;

    // Check rate limiting
    const rateLimit = await ApiKeyManager.checkRateLimit(apiKey.id);
    if (!rateLimit.allowed) {
      responseStatus = 429;
      return NextResponse.json(
        ApiResponseBuilder.rateLimited(rateLimit.remaining, rateLimit.resetAt),
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    requestSize = JSON.stringify(body).length;

    // Validate required fields
    if (!body.url) {
      responseStatus = 400;
      return NextResponse.json(
        ApiResponseBuilder.error('URL is required'),
        { status: 400 }
      );
    }

    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      responseStatus = 400;
      return NextResponse.json(
        ApiResponseBuilder.error('Events array is required and must not be empty'),
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      responseStatus = 400;
      return NextResponse.json(
        ApiResponseBuilder.error('Invalid URL format'),
        { status: 400 }
      );
    }

    // Validate events
    const validEventTypes = WEBHOOK_EVENTS.map(e => e.event_type);
    const invalidEvents = body.events.filter((event: string) => !validEventTypes.includes(event));
    if (invalidEvents.length > 0) {
      responseStatus = 400;
      return NextResponse.json(
        ApiResponseBuilder.error(`Invalid event types: ${invalidEvents.join(', ')}`),
        { status: 400 }
      );
    }

    // Check webhook limit (max 5 per developer)
    const { count } = await createAdminClient()
      .from('webhook_endpoints')
      .select('id', { count: 'exact' })
      .eq('developer_id', apiKey.developer_id);

    if ((count || 0) >= 5) {
      responseStatus = 400;
      return NextResponse.json(
        ApiResponseBuilder.error('Maximum of 5 webhook endpoints allowed per account'),
        { status: 400 }
      );
    }

    // Create webhook
    const webhook = await WebhookManager.createWebhook(
      apiKey.developer_id,
      body.url,
      body.events.map((eventType: string) => ({
        event_type: eventType,
        description: WEBHOOK_EVENTS.find(e => e.event_type === eventType)?.description || ''
      })),
      body.retry_policy
    );

    // Save to database
    const { data: savedWebhook, error } = await createAdminClient()
      .from('webhook_endpoints')
      .insert({
        id: webhook.id,
        developer_id: webhook.developer_id,
        url: webhook.url,
        secret: webhook.secret,
        events: webhook.events,
        is_active: webhook.is_active,
        retry_policy: webhook.retry_policy,
        failure_count: webhook.failure_count,
        created_at: webhook.created_at
      })
      .select(`
        id,
        url,
        events,
        is_active,
        retry_policy,
        failure_count,
        created_at
      `)
      .single();

    if (error) {
      throw error;
    }

    // Test webhook connection
    try {
      await WebhookManager.sendWebhook(webhook, 'webhook.test', {
        message: 'Webhook endpoint created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (testError) {
      console.warn('Webhook test failed:', testError);
      // Don't fail creation if test fails
    }

    const response = ApiResponseBuilder.success(
      {
        ...savedWebhook,
        secret: `${webhook.secret.substring(0, 8)}...` // Only show preview
      },
      'Webhook endpoint created successfully'
    );

    const responseBody = JSON.stringify(response);
    responseSize = responseBody.length;

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Webhooks POST API error:', error);
    responseStatus = 500;
    return NextResponse.json(
      ApiResponseBuilder.error('Internal server error'),
      { status: 500 }
    );

  } finally {
    if (apiKey) {
      const responseTime = Date.now() - startTime;
      await ApiKeyManager.logApiRequest(
        apiKey.id,
        apiKey.developer_id,
        'POST',
        '/api/v1/webhooks',
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        requestSize,
        responseStatus,
        responseSize,
        responseTime
      );
    }
  }
}

// GET /api/v1/webhooks/events - List available webhook events
export async function GET_EVENTS(request: NextRequest) {
  const startTime = Date.now();
  let apiKey: any = null;

  try {
    // Validate API key
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        ApiResponseBuilder.error('Missing or invalid authorization header'),
        { status: 401 }
      );
    }

    const key = authorization.substring(7);
    const validation = await ApiKeyManager.validateApiKey(key, 'webhooks', 'read');
    if (!validation.isValid) {
      return NextResponse.json(
        ApiResponseBuilder.error(validation.error || 'Invalid API key'),
        { status: 401 }
      );
    }

    apiKey = validation.apiKey;

    const response = ApiResponseBuilder.success(
      WEBHOOK_EVENTS,
      'Available webhook events'
    );

    return NextResponse.json(response);

  } catch (error) {
    console.error('Webhook events API error:', error);
    return NextResponse.json(
      ApiResponseBuilder.error('Internal server error'),
      { status: 500 }
    );

  } finally {
    if (apiKey) {
      const responseTime = Date.now() - startTime;
      await ApiKeyManager.logApiRequest(
        apiKey.id,
        apiKey.developer_id,
        'GET',
        '/api/v1/webhooks/events',
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        0,
        200,
        0,
        responseTime
      );
    }
  }
}