import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-v1';

// GET /api/v1 - API information and health check
export async function GET(request: NextRequest) {
  try {
    const apiInfo = {
      name: 'DevReporter API',
      version: '1.0',
      description: 'REST API for managing real estate properties and reports',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      endpoints: {
        properties: {
          list: 'GET /api/v1/properties',
          create: 'POST /api/v1/properties',
          get: 'GET /api/v1/properties/{id}',
          update: 'PUT /api/v1/properties/{id}',
          delete: 'DELETE /api/v1/properties/{id}'
        },
        reports: {
          list: 'GET /api/v1/reports',
          create: 'POST /api/v1/reports',
          get: 'GET /api/v1/reports/{id}',
          download: 'GET /api/v1/reports/{id}/download'
        },
        webhooks: {
          list: 'GET /api/v1/webhooks',
          create: 'POST /api/v1/webhooks',
          update: 'PUT /api/v1/webhooks/{id}',
          delete: 'DELETE /api/v1/webhooks/{id}',
          events: 'GET /api/v1/webhooks/events'
        },
        keys: {
          list: 'GET /api/v1/keys',
          create: 'POST /api/v1/keys',
          delete: 'DELETE /api/v1/keys'
        }
      },
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer {api_key}',
        note: 'API keys can be created and managed in the dashboard'
      },
      rate_limits: {
        basic: '1,000 requests per minute',
        pro: '5,000 requests per minute',
        enterprise: '10,000 requests per minute'
      },
      webhook_events: [
        'property.created',
        'property.updated',
        'property.deleted',
        'report.generated',
        'report.failed',
        'ministry.sync_success',
        'ministry.sync_failed',
        'subscription.updated'
      ],
      documentation: `${process.env.NEXTAUTH_URL}/docs/api`,
      support: 'support@otoraport.pl'
    };

    return NextResponse.json(
      ApiResponseBuilder.success(apiInfo, 'DevReporter API v1.0 - Ready to serve')
    );

  } catch (error) {
    console.error('API info endpoint error:', error);
    return NextResponse.json(
      ApiResponseBuilder.error('Service temporarily unavailable'),
      { status: 503 }
    );
  }
}