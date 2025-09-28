-- Deweloperzy/Klienci
CREATE TABLE developers (
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

-- Projekty deweloperskie
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nieruchomości
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  property_number TEXT NOT NULL,
  property_type TEXT NOT NULL,
  price_per_m2 DECIMAL,
  total_price DECIMAL,
  final_price DECIMAL,
  area DECIMAL,
  parking_space TEXT,
  parking_price DECIMAL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pliki wgrane przez deweloperów
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wygenerowane pliki dla ministerstwa
CREATE TABLE generated_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('xml', 'md')),
  file_path TEXT NOT NULL,
  last_generated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  properties_count INTEGER
);

-- Płatności
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'PLN',
  status TEXT NOT NULL,
  przelewy24_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeksy dla lepszej wydajności
CREATE INDEX idx_developers_email ON developers(email);
CREATE INDEX idx_projects_developer_id ON projects(developer_id);
CREATE INDEX idx_properties_project_id ON properties(project_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_uploaded_files_developer_id ON uploaded_files(developer_id);
CREATE INDEX idx_generated_files_developer_id ON generated_files(developer_id);
CREATE INDEX idx_payments_developer_id ON payments(developer_id);

-- Funkcja do automatycznego ustawiania updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggery dla updated_at
CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON developers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - podstawowa konfiguracja
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Polityki RLS - deweloperzy widzą tylko swoje dane
CREATE POLICY "Developers can view own data" ON developers
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Developers can view own projects" ON projects
    FOR ALL USING (developer_id IN (SELECT id FROM developers WHERE auth.uid()::text = id::text));

CREATE POLICY "Developers can view own properties" ON properties
    FOR ALL USING (project_id IN (
        SELECT p.id FROM projects p 
        JOIN developers d ON p.developer_id = d.id 
        WHERE auth.uid()::text = d.id::text
    ));

CREATE POLICY "Developers can view own files" ON uploaded_files
    FOR ALL USING (developer_id IN (SELECT id FROM developers WHERE auth.uid()::text = id::text));

CREATE POLICY "Developers can view own generated files" ON generated_files
    FOR ALL USING (developer_id IN (SELECT id FROM developers WHERE auth.uid()::text = id::text));

CREATE POLICY "Developers can view own payments" ON payments
    FOR ALL USING (developer_id IN (SELECT id FROM developers WHERE auth.uid()::text = id::text));