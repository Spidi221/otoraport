-- Add deployment logs table for tracking presentation deployments
CREATE TABLE IF NOT EXISTS deployment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    deployment_type TEXT NOT NULL CHECK (deployment_type IN ('subdomain', 'custom_domain')),
    deployment_url TEXT,
    properties_count INTEGER,
    projects_count INTEGER,
    file_size_html INTEGER,
    deployment_status TEXT NOT NULL DEFAULT 'pending' CHECK (deployment_status IN ('success', 'failed', 'pending')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deployment_logs_developer_id ON deployment_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_created_at ON deployment_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_status ON deployment_logs(deployment_status);

-- Add fields to developers table for presentation functionality
ALTER TABLE developers 
ADD COLUMN IF NOT EXISTS presentation_url TEXT,
ADD COLUMN IF NOT EXISTS presentation_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS presentation_deployed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE;

-- Add indexes for new developer fields
CREATE INDEX IF NOT EXISTS idx_developers_custom_domain ON developers(custom_domain);
CREATE INDEX IF NOT EXISTS idx_developers_presentation_url ON developers(presentation_url);

-- Add RLS (Row Level Security) policies
ALTER TABLE deployment_logs ENABLE ROW LEVEL SECURITY;

-- Allow developers to see only their own deployment logs
CREATE POLICY "Developers can view their own deployment logs"
    ON deployment_logs FOR SELECT
    USING (developer_id = (SELECT id FROM developers WHERE email = auth.jwt() ->> 'email'));

-- Allow developers to insert their own deployment logs (via API)
CREATE POLICY "API can insert deployment logs"
    ON deployment_logs FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE deployment_logs IS 'Tracks presentation site deployments for Pro/Enterprise plans';
COMMENT ON COLUMN deployment_logs.deployment_type IS 'Type of deployment: subdomain (*.otoraport.pl) or custom_domain';
COMMENT ON COLUMN deployment_logs.deployment_url IS 'Final URL where the presentation site was deployed';
COMMENT ON COLUMN deployment_logs.file_size_html IS 'Size of generated HTML file in bytes';
COMMENT ON COLUMN deployment_logs.deployment_status IS 'Status of deployment: success, failed, or pending';

-- Add missing fields to projects table if needed
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add missing fields to properties table for presentation functionality
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS floor INTEGER,
ADD COLUMN IF NOT EXISTS rooms INTEGER,
ADD COLUMN IF NOT EXISTS building_number TEXT;

-- Update database comments
COMMENT ON COLUMN projects.description IS 'Project description for presentation pages';
COMMENT ON COLUMN properties.floor IS 'Floor number for presentation display';
COMMENT ON COLUMN properties.rooms IS 'Number of rooms for filtering';
COMMENT ON COLUMN properties.building_number IS 'Building identifier within project';