import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const results = [];

    // Create api_keys table
    const createApiKeysTable = `
      CREATE TABLE IF NOT EXISTS public.api_keys (
        id text PRIMARY KEY,
        developer_id uuid REFERENCES public.developers(id) ON DELETE CASCADE,
        name text NOT NULL,
        key_hash text NOT NULL UNIQUE,
        key_preview text NOT NULL,
        permissions jsonb NOT NULL DEFAULT '[]',
        rate_limit integer NOT NULL DEFAULT 1000,
        is_active boolean NOT NULL DEFAULT true,
        last_used_at timestamptz,
        created_at timestamptz DEFAULT now(),
        expires_at timestamptz
      );
    `;

    try {
      const { error: apiKeysError } = await createAdminClient.rpc('exec', { sql: createApiKeysTable });
      if (apiKeysError) throw apiKeysError;
      results.push({ table: 'api_keys', status: 'created' });
    } catch (err) {
      results.push({ table: 'api_keys', status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
    }

    // Create api_requests table
    const createApiRequestsTable = `
      CREATE TABLE IF NOT EXISTS public.api_requests (
        id text PRIMARY KEY,
        api_key_id text REFERENCES public.api_keys(id) ON DELETE CASCADE,
        developer_id uuid REFERENCES public.developers(id) ON DELETE CASCADE,
        method text NOT NULL,
        endpoint text NOT NULL,
        ip_address text,
        user_agent text,
        request_size integer DEFAULT 0,
        response_status integer NOT NULL,
        response_size integer DEFAULT 0,
        response_time_ms integer DEFAULT 0,
        created_at timestamptz DEFAULT now()
      );
    `;

    try {
      const { error: apiRequestsError } = await createAdminClient.rpc('exec', { sql: createApiRequestsTable });
      if (apiRequestsError) throw apiRequestsError;
      results.push({ table: 'api_requests', status: 'created' });
    } catch (err) {
      results.push({ table: 'api_requests', status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
    }

    // Create webhook_endpoints table
    const createWebhookEndpointsTable = `
      CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
        id text PRIMARY KEY,
        developer_id uuid REFERENCES public.developers(id) ON DELETE CASCADE,
        url text NOT NULL,
        secret text NOT NULL,
        events jsonb NOT NULL DEFAULT '[]',
        is_active boolean NOT NULL DEFAULT true,
        retry_policy jsonb NOT NULL DEFAULT '{"max_attempts": 3, "backoff_strategy": "exponential", "initial_delay_seconds": 1, "max_delay_seconds": 300}',
        last_success_at timestamptz,
        last_failure_at timestamptz,
        failure_count integer DEFAULT 0,
        created_at timestamptz DEFAULT now()
      );
    `;

    try {
      const { error: webhooksError } = await createAdminClient.rpc('exec', { sql: createWebhookEndpointsTable });
      if (webhooksError) throw webhooksError;
      results.push({ table: 'webhook_endpoints', status: 'created' });
    } catch (err) {
      results.push({ table: 'webhook_endpoints', status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
    }

    // Create webhook_deliveries table
    const createWebhookDeliveriesTable = `
      CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
        id text PRIMARY KEY,
        webhook_endpoint_id text REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
        event_type text NOT NULL,
        payload jsonb NOT NULL,
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'abandoned')),
        attempt_count integer DEFAULT 0,
        last_attempt_at timestamptz DEFAULT now(),
        next_attempt_at timestamptz,
        response_status integer,
        response_body text,
        created_at timestamptz DEFAULT now()
      );
    `;

    try {
      const { error: deliveriesError } = await createAdminClient.rpc('exec', { sql: createWebhookDeliveriesTable });
      if (deliveriesError) throw deliveriesError;
      results.push({ table: 'webhook_deliveries', status: 'created' });
    } catch (err) {
      results.push({ table: 'webhook_deliveries', status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
    }

    // Create reports table
    const createReportsTable = `
      CREATE TABLE IF NOT EXISTS public.reports (
        id text PRIMARY KEY,
        developer_id uuid REFERENCES public.developers(id) ON DELETE CASCADE,
        type text NOT NULL CHECK (type IN ('ministry_xml', 'analytics', 'custom')),
        status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
        file_url text,
        md5_hash text,
        properties_count integer DEFAULT 0,
        generated_at timestamptz,
        expires_at timestamptz,
        metadata jsonb DEFAULT '{}',
        created_at timestamptz DEFAULT now()
      );
    `;

    try {
      const { error: reportsError } = await createAdminClient.rpc('exec', { sql: createReportsTable });
      if (reportsError) throw reportsError;
      results.push({ table: 'reports', status: 'created' });
    } catch (err) {
      results.push({ table: 'reports', status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
    }

    const successCount = results.filter(r => r.status === 'created').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      status: errorCount === 0 ? 'success' : 'partial_success',
      message: `Created ${successCount}/5 tables successfully`,
      timestamp: new Date().toISOString(),
      results,
      next_steps: errorCount > 0 ? 'Some tables failed to create. You may need to run the SQL manually in Supabase.' : 'All tables created successfully. You can now test the API.'
    });

  } catch (error) {
    console.error('Create API tables error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create API tables',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      note: 'The Supabase exec function may not be available. Please run the SQL script manually.'
    }, { status: 500 });
  }
}