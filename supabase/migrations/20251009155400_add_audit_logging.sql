-- Create audit_logs table for comprehensive system activity tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_developer_id ON public.audit_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON public.audit_logs(resource_id);

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.developers
      WHERE developers.user_id = auth.uid()
      AND developers.is_admin = true
    )
  );

-- RLS Policy: Only service role can insert audit logs (no direct user inserts)
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Prevent updates and deletes to maintain immutability (append-only)
-- No UPDATE or DELETE policies = no one can update or delete

-- Comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Immutable audit log of all system activities';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (e.g., login, upload, delete, subscription_change)';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Type of resource affected (e.g., property, subscription, auth)';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'ID of the specific resource affected (if applicable)';
COMMENT ON COLUMN public.audit_logs.changes IS 'JSON object containing before/after state for data modifications';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional contextual information about the event';
