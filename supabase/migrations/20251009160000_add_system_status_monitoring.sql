-- Create health_checks table for monitoring system components
CREATE TABLE IF NOT EXISTS public.health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('operational', 'degraded', 'outage')),
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create incidents table for tracking system issues
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  affected_components VARCHAR(100)[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  updates JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create uptime_summaries table for efficient historical data
CREATE TABLE IF NOT EXISTS public.uptime_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  total_checks INTEGER NOT NULL DEFAULT 0,
  successful_checks INTEGER NOT NULL DEFAULT 0,
  uptime_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(component, date)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_health_checks_component ON public.health_checks(component);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON public.health_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON public.health_checks(status);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_started_at ON public.incidents(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);

CREATE INDEX IF NOT EXISTS idx_uptime_summaries_component_date ON public.uptime_summaries(component, date DESC);

-- Enable RLS on tables
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uptime_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view health checks (public status page)
CREATE POLICY "Anyone can view health checks"
  ON public.health_checks
  FOR SELECT
  USING (true);

-- RLS Policy: Only service role can insert health checks
CREATE POLICY "Service role can insert health checks"
  ON public.health_checks
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policy: Anyone can view incidents (public status page)
CREATE POLICY "Anyone can view incidents"
  ON public.incidents
  FOR SELECT
  USING (true);

-- RLS Policy: Admins can create incidents
CREATE POLICY "Admins can create incidents"
  ON public.incidents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.developers
      WHERE developers.user_id = auth.uid()
      AND developers.is_admin = true
    )
  );

-- RLS Policy: Admins can update incidents
CREATE POLICY "Admins can update incidents"
  ON public.incidents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.developers
      WHERE developers.user_id = auth.uid()
      AND developers.is_admin = true
    )
  );

-- RLS Policy: Anyone can view uptime summaries (public status page)
CREATE POLICY "Anyone can view uptime summaries"
  ON public.uptime_summaries
  FOR SELECT
  USING (true);

-- RLS Policy: Only service role can manage uptime summaries
CREATE POLICY "Service role can manage uptime summaries"
  ON public.uptime_summaries
  FOR ALL
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add trigger to update updated_at timestamp on incidents
CREATE TRIGGER set_updated_at_incidents
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to calculate and store daily uptime summaries
CREATE OR REPLACE FUNCTION public.calculate_daily_uptime_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  component_record RECORD;
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- For each component, calculate yesterday's uptime
  FOR component_record IN
    SELECT DISTINCT component FROM public.health_checks
  LOOP
    INSERT INTO public.uptime_summaries (component, date, total_checks, successful_checks, uptime_percentage, avg_response_time_ms)
    SELECT
      component_record.component,
      yesterday,
      COUNT(*) as total_checks,
      COUNT(*) FILTER (WHERE status = 'operational') as successful_checks,
      ROUND((COUNT(*) FILTER (WHERE status = 'operational')::NUMERIC / COUNT(*)) * 100, 2) as uptime_percentage,
      AVG(response_time_ms)::INTEGER as avg_response_time_ms
    FROM public.health_checks
    WHERE component = component_record.component
      AND DATE(checked_at) = yesterday
    ON CONFLICT (component, date)
    DO UPDATE SET
      total_checks = EXCLUDED.total_checks,
      successful_checks = EXCLUDED.successful_checks,
      uptime_percentage = EXCLUDED.uptime_percentage,
      avg_response_time_ms = EXCLUDED.avg_response_time_ms;
  END LOOP;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE public.health_checks IS 'Real-time health check results for all monitored system components';
COMMENT ON TABLE public.incidents IS 'System incidents and their resolution history';
COMMENT ON TABLE public.uptime_summaries IS 'Daily uptime aggregations for efficient historical queries';
COMMENT ON COLUMN public.health_checks.component IS 'Component identifier (e.g., ministry_xml, database, stripe)';
COMMENT ON COLUMN public.health_checks.status IS 'Current health status: operational, degraded, or outage';
COMMENT ON COLUMN public.incidents.severity IS 'Incident severity: minor, major, or critical';
COMMENT ON COLUMN public.incidents.updates IS 'JSON array of incident updates with timestamps';
