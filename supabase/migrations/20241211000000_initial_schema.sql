-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create developers table
CREATE TABLE IF NOT EXISTS developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  nip TEXT,
  phone TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  ministry_approved BOOLEAN DEFAULT false,
  ministry_email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  property_number TEXT NOT NULL,
  property_type TEXT NOT NULL,
  price_per_m2 DECIMAL(10,2),
  total_price DECIMAL(12,2),
  final_price DECIMAL(12,2),
  area DECIMAL(6,2),
  parking_space TEXT,
  parking_price DECIMAL(10,2),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'xml', 'xlsx')),
  file_size INTEGER,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_files table
CREATE TABLE IF NOT EXISTS generated_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('xml', 'md')),
  file_path TEXT NOT NULL,
  last_generated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  properties_count INTEGER
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'PLN' CHECK (currency IN ('PLN', 'EUR', 'USD')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  przelewy24_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_developers_email ON developers(email);
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_properties_project_id ON properties(project_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_developer_id ON uploaded_files(developer_id);
CREATE INDEX IF NOT EXISTS idx_generated_files_developer_id ON generated_files(developer_id);
CREATE INDEX IF NOT EXISTS idx_payments_developer_id ON payments(developer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON developers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for developers table
CREATE POLICY "Developers can view their own data" ON developers
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Developers can update their own data" ON developers
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for projects table
CREATE POLICY "Developers can view their own projects" ON projects
    FOR SELECT USING (developer_id::text = auth.uid()::text);

CREATE POLICY "Developers can insert their own projects" ON projects
    FOR INSERT WITH CHECK (developer_id::text = auth.uid()::text);

CREATE POLICY "Developers can update their own projects" ON projects
    FOR UPDATE USING (developer_id::text = auth.uid()::text);

CREATE POLICY "Developers can delete their own projects" ON projects
    FOR DELETE USING (developer_id::text = auth.uid()::text);

-- RLS Policies for properties table
CREATE POLICY "Developers can view properties from their projects" ON properties
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE developer_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Developers can insert properties to their projects" ON properties
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE developer_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Developers can update properties from their projects" ON properties
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE developer_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Developers can delete properties from their projects" ON properties
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE developer_id::text = auth.uid()::text
        )
    );

-- RLS Policies for uploaded_files table
CREATE POLICY "Developers can view their own uploaded files" ON uploaded_files
    FOR SELECT USING (developer_id::text = auth.uid()::text);

CREATE POLICY "Developers can insert their own uploaded files" ON uploaded_files
    FOR INSERT WITH CHECK (developer_id::text = auth.uid()::text);

CREATE POLICY "Developers can update their own uploaded files" ON uploaded_files
    FOR UPDATE USING (developer_id::text = auth.uid()::text);

-- RLS Policies for generated_files table
CREATE POLICY "Developers can view their own generated files" ON generated_files
    FOR SELECT USING (developer_id::text = auth.uid()::text);

CREATE POLICY "Developers can insert their own generated files" ON generated_files
    FOR INSERT WITH CHECK (developer_id::text = auth.uid()::text);

CREATE POLICY "Developers can update their own generated files" ON generated_files
    FOR UPDATE USING (developer_id::text = auth.uid()::text);

-- RLS Policies for payments table  
CREATE POLICY "Developers can view their own payments" ON payments
    FOR SELECT USING (developer_id::text = auth.uid()::text);

CREATE POLICY "Developers can insert their own payments" ON payments
    FOR INSERT WITH CHECK (developer_id::text = auth.uid()::text);

-- Public access policies for ministry endpoints (no RLS)
CREATE POLICY "Public read access for generated files" ON generated_files
    FOR SELECT USING (true);

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;