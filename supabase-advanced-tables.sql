-- System logs table for admin panel monitoring
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error')),
  message TEXT NOT NULL,
  details JSONB,
  user_id TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys table for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  rate_limit INTEGER NOT NULL DEFAULT 1000,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhooks table for external integrations
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT,
  verification_token TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integrations table for partner integrations
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_developer_id ON api_keys(developer_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active);

CREATE INDEX IF NOT EXISTS idx_webhooks_developer_id ON webhooks(developer_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(active);

CREATE INDEX IF NOT EXISTS idx_integrations_developer_id ON integrations(developer_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admin access to system_logs" ON system_logs
  FOR ALL USING (true); -- Tylko admini będą mieć dostęp przez aplikację

-- Developer access to their own data
CREATE POLICY "Developers can manage their own API keys" ON api_keys
  FOR ALL USING (auth.uid()::text = (SELECT auth_id FROM developers WHERE id = developer_id));

CREATE POLICY "Developers can manage their own webhooks" ON webhooks
  FOR ALL USING (auth.uid()::text = (SELECT auth_id FROM developers WHERE id = developer_id));

CREATE POLICY "Developers can manage their own integrations" ON integrations
  FOR ALL USING (auth.uid()::text = (SELECT auth_id FROM developers WHERE id = developer_id));

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON api_keys 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at 
  BEFORE UPDATE ON webhooks 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at 
  BEFORE UPDATE ON integrations 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();