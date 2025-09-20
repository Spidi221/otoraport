-- Database extensions for API v1 + Webhooks system
-- Run this in Supabase SQL Editor

-- Table for API keys
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

-- Table for API request logs
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

-- Table for webhook endpoints
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

-- Table for webhook deliveries
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

-- Table for generated reports
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_developer_id ON public.api_keys(developer_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_api_requests_api_key_id ON public.api_requests(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_developer_id ON public.api_requests(developer_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON public.api_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint ON public.api_requests(endpoint);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_developer_id ON public.webhook_endpoints(developer_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_is_active ON public.webhook_endpoints(is_active);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_endpoint_id ON public.webhook_deliveries(webhook_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_attempt_at ON public.webhook_deliveries(next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_reports_developer_id ON public.reports(developer_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

-- RLS Policies
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- API Keys policies
CREATE POLICY "Users can view their own API keys" ON public.api_keys
  FOR SELECT USING (developer_id = auth.uid());

CREATE POLICY "Users can create their own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (developer_id = auth.uid());

CREATE POLICY "Users can update their own API keys" ON public.api_keys
  FOR UPDATE USING (developer_id = auth.uid());

-- API Requests policies (read-only for users)
CREATE POLICY "Users can view their own API requests" ON public.api_requests
  FOR SELECT USING (developer_id = auth.uid());

-- Webhook endpoints policies
CREATE POLICY "Users can manage their own webhook endpoints" ON public.webhook_endpoints
  FOR ALL USING (developer_id = auth.uid());

-- Webhook deliveries policies (read-only for users)
CREATE POLICY "Users can view their own webhook deliveries" ON public.webhook_deliveries
  FOR SELECT USING (
    webhook_endpoint_id IN (
      SELECT id FROM public.webhook_endpoints WHERE developer_id = auth.uid()
    )
  );

-- Reports policies
CREATE POLICY "Users can manage their own reports" ON public.reports
  FOR ALL USING (developer_id = auth.uid());

-- Functions for API analytics

-- Get API usage statistics
CREATE OR REPLACE FUNCTION get_api_usage_stats(
  developer_uuid uuid,
  start_date timestamptz DEFAULT now() - interval '30 days',
  end_date timestamptz DEFAULT now()
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_requests', COUNT(*),
    'success_requests', COUNT(*) FILTER (WHERE response_status BETWEEN 200 AND 299),
    'error_requests', COUNT(*) FILTER (WHERE response_status >= 400),
    'avg_response_time_ms', AVG(response_time_ms),
    'total_data_transferred_bytes', SUM(request_size + response_size),
    'requests_by_endpoint', (
      SELECT jsonb_object_agg(
        endpoint,
        jsonb_build_object(
          'count', COUNT(*),
          'avg_response_time', AVG(response_time_ms)
        )
      )
      FROM public.api_requests
      WHERE developer_id = developer_uuid
        AND created_at BETWEEN start_date AND end_date
      GROUP BY endpoint
    ),
    'requests_by_day', (
      SELECT jsonb_object_agg(
        DATE_TRUNC('day', created_at)::date,
        COUNT(*)
      )
      FROM public.api_requests
      WHERE developer_id = developer_uuid
        AND created_at BETWEEN start_date AND end_date
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at)
    ),
    'top_api_keys', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'key_name', ak.name,
          'request_count', req_count.count,
          'last_used', ak.last_used_at
        )
      )
      FROM public.api_keys ak
      LEFT JOIN (
        SELECT
          api_key_id,
          COUNT(*) as count
        FROM public.api_requests
        WHERE developer_id = developer_uuid
          AND created_at BETWEEN start_date AND end_date
        GROUP BY api_key_id
      ) req_count ON ak.id = req_count.api_key_id
      WHERE ak.developer_id = developer_uuid
      ORDER BY req_count.count DESC NULLS LAST
      LIMIT 5
    )
  ) INTO result
  FROM public.api_requests
  WHERE developer_id = developer_uuid
    AND created_at BETWEEN start_date AND end_date;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get webhook delivery statistics
CREATE OR REPLACE FUNCTION get_webhook_stats(
  developer_uuid uuid,
  start_date timestamptz DEFAULT now() - interval '30 days',
  end_date timestamptz DEFAULT now()
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_deliveries', COUNT(wd.*),
    'successful_deliveries', COUNT(wd.*) FILTER (WHERE wd.status = 'delivered'),
    'failed_deliveries', COUNT(wd.*) FILTER (WHERE wd.status = 'failed'),
    'abandoned_deliveries', COUNT(wd.*) FILTER (WHERE wd.status = 'abandoned'),
    'avg_attempts', AVG(wd.attempt_count),
    'success_rate',
      CASE
        WHEN COUNT(wd.*) > 0 THEN
          COUNT(wd.*) FILTER (WHERE wd.status = 'delivered')::float / COUNT(wd.*)::float
        ELSE 0
      END,
    'deliveries_by_event', (
      SELECT jsonb_object_agg(
        event_type,
        jsonb_build_object(
          'total', COUNT(*),
          'successful', COUNT(*) FILTER (WHERE status = 'delivered'),
          'failed', COUNT(*) FILTER (WHERE status IN ('failed', 'abandoned'))
        )
      )
      FROM public.webhook_deliveries wd2
      INNER JOIN public.webhook_endpoints we2 ON wd2.webhook_endpoint_id = we2.id
      WHERE we2.developer_id = developer_uuid
        AND wd2.created_at BETWEEN start_date AND end_date
      GROUP BY event_type
    ),
    'endpoint_performance', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'endpoint_id', we.id,
          'url', we.url,
          'total_deliveries', delivery_stats.total,
          'success_rate', delivery_stats.success_rate,
          'avg_attempts', delivery_stats.avg_attempts,
          'last_success', we.last_success_at,
          'failure_count', we.failure_count
        )
      )
      FROM public.webhook_endpoints we
      LEFT JOIN (
        SELECT
          webhook_endpoint_id,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'delivered')::float / COUNT(*)::float as success_rate,
          AVG(attempt_count) as avg_attempts
        FROM public.webhook_deliveries
        WHERE created_at BETWEEN start_date AND end_date
        GROUP BY webhook_endpoint_id
      ) delivery_stats ON we.id = delivery_stats.webhook_endpoint_id
      WHERE we.developer_id = developer_uuid
    )
  ) INTO result
  FROM public.webhook_deliveries wd
  INNER JOIN public.webhook_endpoints we ON wd.webhook_endpoint_id = we.id
  WHERE we.developer_id = developer_uuid
    AND wd.created_at BETWEEN start_date AND end_date;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old API logs and webhook deliveries
CREATE OR REPLACE FUNCTION cleanup_api_logs(retention_days integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Clean up old API request logs
  DELETE FROM public.api_requests
  WHERE created_at < now() - (retention_days || ' days')::interval;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Clean up old webhook deliveries (keep only last 30 days)
  DELETE FROM public.webhook_deliveries
  WHERE created_at < now() - '30 days'::interval
    AND status IN ('delivered', 'abandoned');

  -- Clean up expired reports
  DELETE FROM public.reports
  WHERE expires_at < now();

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get API rate limit status
CREATE OR REPLACE FUNCTION get_api_rate_limit_status(
  api_key_hash text,
  window_minutes integer DEFAULT 1
)
RETURNS jsonb AS $$
DECLARE
  api_key_record record;
  request_count integer;
  window_start timestamptz;
  result jsonb;
BEGIN
  -- Get API key details
  SELECT * INTO api_key_record
  FROM public.api_keys
  WHERE key_hash = get_api_rate_limit_status.api_key_hash
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid or expired API key'
    );
  END IF;

  -- Calculate window
  window_start = now() - (window_minutes || ' minutes')::interval;

  -- Count requests in current window
  SELECT COUNT(*) INTO request_count
  FROM public.api_requests
  WHERE api_key_id = api_key_record.id
    AND created_at >= window_start;

  -- Build result
  SELECT jsonb_build_object(
    'valid', true,
    'rate_limit', api_key_record.rate_limit,
    'current_usage', request_count,
    'remaining', GREATEST(0, api_key_record.rate_limit - request_count),
    'reset_at', window_start + (window_minutes || ' minutes')::interval,
    'developer_id', api_key_record.developer_id,
    'permissions', api_key_record.permissions
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update API key last_used_at
CREATE OR REPLACE FUNCTION update_api_key_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.api_keys
  SET last_used_at = NEW.created_at
  WHERE id = NEW.api_key_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_api_key_last_used ON public.api_requests;
CREATE TRIGGER trigger_update_api_key_last_used
  AFTER INSERT ON public.api_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_api_key_last_used();

-- Create scheduled job to clean up old logs (if pg_cron extension is available)
-- SELECT cron.schedule('cleanup-api-logs', '0 2 * * *', 'SELECT cleanup_api_logs(90);');

-- Grants for service role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;