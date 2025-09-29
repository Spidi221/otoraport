import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { ApiKeyManager, ApiResponseBuilder, ReportApiModel, WebhookManager } from '@/lib/api-v1';
import { generateXMLFile } from '@/lib/generators';
import crypto from 'crypto';

// GET /api/v1/reports - List reports
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

    const validation = await ApiKeyManager.validateApiKey(key, 'reports', 'read');
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Build query for reports
    let query = createAdminClient
      .from('reports')
      .select(`
        id,
        type,
        status,
        file_url,
        md5_hash,
        properties_count,
        generated_at,
        expires_at,
        metadata,
        created_at
      `)
      .eq('developer_id', apiKey.developer_id);

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination and sorting
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: reports, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform to API model
    const apiReports: ReportApiModel[] = (reports || []).map(report => ({
      id: report.id,
      type: report.type,
      status: report.status,
      file_url: report.file_url,
      md5_hash: report.md5_hash,
      properties_count: report.properties_count,
      generated_at: report.generated_at,
      expires_at: report.expires_at,
      metadata: report.metadata || {
        format: 'xml',
        size_bytes: 0,
        ministry_compliant: true
      }
    }));

    const response = ApiResponseBuilder.success(
      apiReports,
      `Retrieved ${apiReports.length} reports`,
      {
        page,
        limit,
        total: count || apiReports.length,
        has_more: apiReports.length === limit
      }
    );

    const responseBody = JSON.stringify(response);
    responseSize = responseBody.length;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Reports API error:', error);
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
        '/api/v1/reports',
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

// POST /api/v1/reports - Generate new report
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let apiKey: any = null;
  let requestSize = 0;
  let responseSize = 0;
  let responseStatus = 202; // Accepted

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
    const validation = await ApiKeyManager.validateApiKey(key, 'reports', 'write');
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

    const reportType = body.type || 'ministry_xml';
    const format = body.format || 'xml';
    const propertyFilters = body.filters || {};

    // Validate report type
    if (!['ministry_xml', 'analytics', 'custom'].includes(reportType)) {
      responseStatus = 400;
      return NextResponse.json(
        ApiResponseBuilder.error('Invalid report type. Must be: ministry_xml, analytics, or custom'),
        { status: 400 }
      );
    }

    // Create report record
    const reportId = `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: report, error: createError } = await createAdminClient()
      .from('reports')
      .insert({
        id: reportId,
        developer_id: apiKey.developer_id,
        type: reportType,
        status: 'generating',
        properties_count: 0,
        metadata: {
          format,
          filters: propertyFilters,
          requested_via: 'api'
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Generate report asynchronously
    generateReportAsync(reportId, apiKey.developer_id, reportType, format, propertyFilters);

    // Return report status
    const apiReport: ReportApiModel = {
      id: report.id,
      type: report.type,
      status: report.status,
      properties_count: report.properties_count,
      metadata: report.metadata || {
        format: 'xml',
        size_bytes: 0,
        ministry_compliant: true
      }
    };

    const response = ApiResponseBuilder.success(
      apiReport,
      'Report generation started. Check status with GET /api/v1/reports/{id}'
    );

    const responseBody = JSON.stringify(response);
    responseSize = responseBody.length;

    return NextResponse.json(response, { status: 202 });

  } catch (error) {
    console.error('Reports POST API error:', error);
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
        '/api/v1/reports',
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

async function generateReportAsync(
  reportId: string,
  developerId: string,
  type: string,
  format: string,
  filters: any
) {
  try {
    // Get properties for report
    let query = createAdminClient
      .from('properties')
      .select('*')
      .eq('developer_id', developerId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status_dostepnosci', filters.status);
    }
    if (filters.property_type) {
      query = query.eq('property_type', filters.property_type);
    }
    if (filters.location) {
      query = query.eq('wojewodztwo', filters.location);
    }

    const { data: properties, error } = await query;

    if (error) {
      throw error;
    }

    let fileContent: string;
    let fileName: string;
    let contentType: string;

    if (type === 'ministry_xml') {
      // Generate ministry-compliant XML
      // Generate XML content using the file generator
      fileContent = generateXMLFile(developerId, properties || []);
      fileName = `ministry_report_${Date.now()}.xml`;
      contentType = 'application/xml';
    } else if (type === 'analytics') {
      // Generate analytics report (JSON)
      fileContent = JSON.stringify({
        total_properties: properties?.length || 0,
        avg_price_per_m2: properties?.reduce((sum, p) => sum + (p.price_per_m2 || 0), 0) / (properties?.length || 1),
        price_distribution: calculatePriceDistribution(properties || []),
        location_breakdown: calculateLocationBreakdown(properties || []),
        generated_at: new Date().toISOString()
      }, null, 2);
      fileName = `analytics_report_${Date.now()}.json`;
      contentType = 'application/json';
    } else {
      // Custom format
      fileContent = generateCustomReport(properties || [], format);
      fileName = `custom_report_${Date.now()}.${format}`;
      contentType = format === 'json' ? 'application/json' : 'text/plain';
    }

    // Calculate MD5 hash
    const md5Hash = crypto.createHash('md5').update(fileContent).digest('hex');

    // In production, upload to file storage (S3, etc.)
    const fileUrl = `${process.env.NEXTAUTH_URL}/api/v1/reports/${reportId}/download`;

    // Update report with results
    await createAdminClient()
      .from('reports')
      .update({
        status: 'completed',
        file_url: fileUrl,
        md5_hash: md5Hash,
        properties_count: properties?.length || 0,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        metadata: {
          format,
          size_bytes: Buffer.byteLength(fileContent, 'utf8'),
          ministry_compliant: type === 'ministry_xml',
          file_name: fileName,
          content_type: contentType,
          file_content: fileContent // Store content temporarily
        }
      })
      .eq('id', reportId);

    // Send webhook notification
    await sendWebhookEvent('report.generated', {
      id: reportId,
      type,
      status: 'completed',
      file_url: fileUrl,
      md5_hash: md5Hash,
      properties_count: properties?.length || 0
    }, developerId);

  } catch (error) {
    console.error('Report generation error:', error);

    // Update report with error status
    await createAdminClient()
      .from('reports')
      .update({
        status: 'failed',
        metadata: {
          error_message: error.message,
          failed_at: new Date().toISOString()
        }
      })
      .eq('id', reportId);

    // Send webhook notification
    await sendWebhookEvent('report.failed', {
      id: reportId,
      error: error.message
    }, developerId);
  }
}

function calculatePriceDistribution(properties: any[]) {
  const ranges = [
    { min: 0, max: 5000, label: '0-5k zł/m²' },
    { min: 5000, max: 10000, label: '5k-10k zł/m²' },
    { min: 10000, max: 15000, label: '10k-15k zł/m²' },
    { min: 15000, max: 20000, label: '15k-20k zł/m²' },
    { min: 20000, max: Infinity, label: '20k+ zł/m²' }
  ];

  return ranges.map(range => ({
    ...range,
    count: properties.filter(p =>
      p.price_per_m2 >= range.min && p.price_per_m2 < range.max
    ).length
  }));
}

function calculateLocationBreakdown(properties: any[]) {
  const breakdown: Record<string, number> = {};

  properties.forEach(property => {
    const location = property.wojewodztwo || 'Unknown';
    breakdown[location] = (breakdown[location] || 0) + 1;
  });

  return Object.entries(breakdown).map(([location, count]) => ({
    location,
    count
  }));
}

function generateCustomReport(properties: any[], format: string): string {
  if (format === 'json') {
    return JSON.stringify(properties, null, 2);
  } else if (format === 'csv') {
    const headers = ['id', 'apartment_number', 'property_type', 'price_per_m2', 'surface_area', 'total_price'];
    const rows = properties.map(p =>
      headers.map(h => p[h] || '').join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  return JSON.stringify(properties, null, 2);
}

async function sendWebhookEvent(eventType: string, data: any, developerId: string) {
  try {
    const { data: webhooks } = await createAdminClient()
      .from('webhook_endpoints')
      .select('*')
      .eq('developer_id', developerId)
      .eq('is_active', true);

    if (!webhooks || webhooks.length === 0) return;

    for (const webhook of webhooks) {
      const subscribesToEvent = webhook.events.some((event: any) => event.event_type === eventType);
      if (subscribesToEvent) {
        await WebhookManager.sendWebhook(webhook, eventType, data);
      }
    }
  } catch (error) {
    console.error('Webhook sending error:', error);
  }
}