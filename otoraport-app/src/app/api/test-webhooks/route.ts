/**
 * Webhook testing endpoint with signature verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { WebhookManagerWithFallback } from '@/lib/api-v1-fallback';
import { ApiResponseBuilder } from '@/lib/api-v1';

// Simple in-memory storage for webhook testing
const webhookEndpoints = new Map();
const webhookDeliveries: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'create_webhook':
        return await createWebhookEndpoint(data);

      case 'send_test_event':
        return await sendTestEvent(data);

      case 'list_webhooks':
        return await listWebhooks(data);

      case 'list_deliveries':
        return await listDeliveries(data);

      case 'test_signature':
        return await testSignatureVerification(data);

      default:
        return NextResponse.json({
          status: 'error',
          message: 'Invalid action',
          available_actions: ['create_webhook', 'send_test_event', 'list_webhooks', 'list_deliveries', 'test_signature']
        }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function createWebhookEndpoint(data: any) {
  const { developer_id = 'test-dev-123', url, events = ['property.created', 'property.updated'] } = data;

  if (!url) {
    return NextResponse.json({
      status: 'error',
      message: 'url is required'
    }, { status: 400 });
  }

  try {
    const webhook = await WebhookManagerWithFallback.createWebhook(
      developer_id,
      url,
      events.map((event: string) => ({ event_type: event, description: `Test ${event} event` }))
    );

    // Store in memory for testing
    webhookEndpoints.set(webhook.id, webhook);

    return NextResponse.json({
      status: 'success',
      message: 'Webhook endpoint created',
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        is_active: webhook.is_active,
        created_at: webhook.created_at
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function sendTestEvent(data: any) {
  const { webhook_id, event_type = 'property.created', payload = { test: true } } = data;

  if (!webhook_id) {
    return NextResponse.json({
      status: 'error',
      message: 'webhook_id is required'
    }, { status: 400 });
  }

  const webhook = webhookEndpoints.get(webhook_id);
  if (!webhook) {
    return NextResponse.json({
      status: 'error',
      message: 'Webhook not found'
    }, { status: 404 });
  }

  try {
    // Generate signature for verification
    const crypto = require('crypto');
    const eventPayload = JSON.stringify({
      event: event_type,
      data: payload,
      timestamp: new Date().toISOString(),
      delivery_id: `test_delivery_${Date.now()}`
    });

    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(eventPayload)
      .digest('hex');

    // Simulate webhook delivery
    const deliveryResult = await simulateWebhookDelivery(webhook.url, eventPayload, signature, event_type);

    // Store delivery record
    const delivery = {
      id: `test_delivery_${Date.now()}`,
      webhook_endpoint_id: webhook_id,
      event_type,
      payload,
      status: deliveryResult.success ? 'delivered' : 'failed',
      attempt_count: 1,
      response_status: deliveryResult.status,
      response_body: deliveryResult.body,
      created_at: new Date().toISOString(),
      last_attempt_at: new Date().toISOString()
    };

    webhookDeliveries.push(delivery);

    return NextResponse.json({
      status: 'success',
      message: 'Test event sent',
      delivery,
      webhook_response: deliveryResult
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to send test event',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function simulateWebhookDelivery(url: string, payload: string, signature: string, eventType: string) {
  try {
    // Simulate HTTP request to webhook URL
    if (url.includes('localhost') || url.includes('example.com')) {
      // For demo purposes, simulate successful delivery to test URLs
      return {
        success: true,
        status: 200,
        body: 'OK',
        response_time_ms: Math.floor(Math.random() * 100) + 50
      };
    }

    // For real URLs, make actual HTTP request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DevReporter-Signature': `sha256=${signature}`,
        'X-DevReporter-Event': eventType,
        'User-Agent': 'DevReporter-Webhook/1.0'
      },
      body: payload,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text().catch(() => '');

    return {
      success: response.ok,
      status: response.status,
      body: responseBody.substring(0, 1000), // Limit response body size
      response_time_ms: Date.now() - Date.now() // Would be calculated properly in real implementation
    };

  } catch (error) {
    return {
      success: false,
      status: 0,
      body: error instanceof Error ? error.message : 'Unknown error',
      response_time_ms: 0
    };
  }
}

async function listWebhooks(data: any) {
  const { developer_id = 'test-dev-123' } = data;

  const developerWebhooks = Array.from(webhookEndpoints.values())
    .filter((webhook: any) => webhook.developer_id === developer_id);

  return NextResponse.json({
    status: 'success',
    message: `Found ${developerWebhooks.length} webhooks`,
    webhooks: developerWebhooks.map((webhook: any) => ({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      is_active: webhook.is_active,
      created_at: webhook.created_at,
      delivery_count: webhookDeliveries.filter(d => d.webhook_endpoint_id === webhook.id).length
    }))
  });
}

async function listDeliveries(data: any) {
  const { webhook_id, limit = 10 } = data;

  let deliveries = webhookDeliveries;

  if (webhook_id) {
    deliveries = deliveries.filter(d => d.webhook_endpoint_id === webhook_id);
  }

  deliveries = deliveries
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

  return NextResponse.json({
    status: 'success',
    message: `Found ${deliveries.length} deliveries`,
    deliveries
  });
}

async function testSignatureVerification(data: any) {
  const { payload, secret, provided_signature } = data;

  if (!payload || !secret || !provided_signature) {
    return NextResponse.json({
      status: 'error',
      message: 'payload, secret, and provided_signature are required'
    }, { status: 400 });
  }

  try {
    const crypto = require('crypto');
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')}`;

    const isValid = provided_signature === expectedSignature;

    return NextResponse.json({
      status: 'success',
      message: 'Signature verification completed',
      signature_valid: isValid,
      expected_signature: expectedSignature,
      provided_signature,
      payload_hash: crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Signature verification failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook Testing System',
    endpoints: {
      'POST /api/test-webhooks': 'Webhook management and testing',
    },
    actions: {
      create_webhook: {
        description: 'Create a new webhook endpoint',
        parameters: { developer_id: 'string', url: 'string', events: 'array' },
        example: {
          action: 'create_webhook',
          developer_id: 'test-dev-123',
          url: 'https://example.com/webhook',
          events: ['property.created', 'property.updated']
        }
      },
      send_test_event: {
        description: 'Send a test event to a webhook',
        parameters: { webhook_id: 'string', event_type: 'string', payload: 'object' },
        example: {
          action: 'send_test_event',
          webhook_id: 'wh_123',
          event_type: 'property.created',
          payload: { id: 'prop_123', name: 'Test Property' }
        }
      },
      list_webhooks: {
        description: 'List webhook endpoints',
        parameters: { developer_id: 'string' },
        example: { action: 'list_webhooks', developer_id: 'test-dev-123' }
      },
      list_deliveries: {
        description: 'List webhook deliveries',
        parameters: { webhook_id: 'string (optional)', limit: 'number' },
        example: { action: 'list_deliveries', limit: 5 }
      },
      test_signature: {
        description: 'Test webhook signature verification',
        parameters: { payload: 'object', secret: 'string', provided_signature: 'string' },
        example: {
          action: 'test_signature',
          payload: { test: true },
          secret: 'webhook_secret',
          provided_signature: 'sha256=abc123...'
        }
      }
    }
  });
}