-- ============================================
-- OTORAPORT V2 - KROK 2: PEŁNA MIGRACJA STRUKTURY BAZY
-- ============================================
-- Wykonaj ten SQL w Supabase SQL Editor
-- UWAGA: To utworzy/zaktualizuje tabele zgodnie z wymaganiami ministerstwa
-- ============================================

BEGIN;

-- ============================================
-- CZĘŚĆ 1: EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- dla szybkiego wyszukiwania tekstowego

-- ============================================
-- CZĘŚĆ 2: DROP NIEPOTRZEBNYCH TABEL (jeśli istnieją)
-- ============================================

-- Usuń tabele które nie są potrzebne w nowym systemie
DROP TABLE IF EXISTS uploaded_files CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS subscription_logs CASCADE;

-- ============================================
-- CZĘŚĆ 3: TABELA DEVELOPERS
-- ============================================
-- Zawiera wszystkie 28 pól wymaganych przez ministerstwo + dane biznesowe

CREATE TABLE IF NOT EXISTS developers (
  -- Identyfikatory
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id VARCHAR(100) UNIQUE NOT NULL,

  -- Podstawowe dane kontaktowe (wymagane przez ministerstwo 1-8)
  name VARCHAR(255), -- alias dla company_name (legacy)
  company_name VARCHAR(255) NOT NULL,
  legal_form VARCHAR(100) DEFAULT 'Spółka z o.o.', -- forma prawna
  krs_number VARCHAR(50), -- nr KRS
  ceidg_number VARCHAR(50), -- nr CEIDG
  nip VARCHAR(20) NOT NULL,
  regon VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255) NOT NULL,

  -- Adres siedziby (ministerstwo 9-16)
  headquarters_voivodeship VARCHAR(50), -- województwo siedziby
  headquarters_county VARCHAR(50), -- powiat siedziby
  headquarters_municipality VARCHAR(100), -- gmina siedziby
  headquarters_city VARCHAR(100), -- miejscowość siedziby
  headquarters_street VARCHAR(200), -- ulica siedziby
  headquarters_building_number VARCHAR(20), -- nr budynku siedziby
  headquarters_apartment_number VARCHAR(20), -- nr lokalu siedziby
  headquarters_postal_code VARCHAR(10), -- kod pocztowy siedziby

  -- Adres lokalu sprzedaży (ministerstwo 17-24)
  sales_office_voivodeship VARCHAR(50),
  sales_office_county VARCHAR(50),
  sales_office_municipality VARCHAR(100),
  sales_office_city VARCHAR(100),
  sales_office_street VARCHAR(200),
  sales_office_building_number VARCHAR(20),
  sales_office_apartment_number VARCHAR(20),
  sales_office_postal_code VARCHAR(10),

  -- Dodatkowe dane kontaktowe (ministerstwo 25-28)
  additional_sales_locations TEXT, -- dodatkowe lokalizacje sprzedaży
  contact_method VARCHAR(200) DEFAULT 'email, telefon', -- sposób kontaktu
  website VARCHAR(500), -- adres strony www
  additional_contact_info TEXT, -- dodatkowe informacje kontaktowe

  -- Dane biznesowe OTORAPORT
  subscription_plan VARCHAR(50) DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'basic', 'pro', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMPTZ,
  subscription_starts_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,

  -- Stripe integration
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),

  -- URLs ministerstwa (automatycznie generowane)
  xml_url VARCHAR(500), -- URL do Harvester XML
  csv_url VARCHAR(500), -- URL do CSV
  md5_url VARCHAR(500), -- URL do MD5

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_nip CHECK (LENGTH(nip) >= 10),
  CONSTRAINT valid_client_id CHECK (LENGTH(client_id) >= 10)
);

-- ============================================
-- CZĘŚĆ 4: TABELA PROPERTIES
-- ============================================
-- Zawiera wszystkie pola dla pojedynczego mieszkania (dane ministerstwa 29-58)

CREATE TABLE IF NOT EXISTS properties (
  -- Identyfikatory
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- opcjonalnie

  -- Lokalizacja inwestycji (ministerstwo 29-35)
  wojewodztwo VARCHAR(50) NOT NULL,
  powiat VARCHAR(50) NOT NULL,
  gmina VARCHAR(100) NOT NULL,
  miejscowosc VARCHAR(100),
  ulica VARCHAR(200),
  nr_budynku VARCHAR(20),
  kod_pocztowy VARCHAR(10),

  -- Podstawowe dane mieszkania (ministerstwo 36-38)
  property_type VARCHAR(50) DEFAULT 'mieszkanie' CHECK (property_type IN ('mieszkanie', 'dom')),
  apartment_number VARCHAR(50) NOT NULL,
  area DECIMAL(8,2), -- powierzchnia w m2

  -- Ceny i daty (ministerstwo 39-44)
  price_per_m2 DECIMAL(10,2) NOT NULL,
  price_valid_from DATE NOT NULL DEFAULT CURRENT_DATE,

  base_price DECIMAL(12,2) NOT NULL, -- powierzchnia × cena za m²
  base_price_valid_from DATE NOT NULL DEFAULT CURRENT_DATE,

  final_price DECIMAL(12,2) NOT NULL, -- z dodatkami
  final_price_valid_from DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Miejsca postojowe (ministerstwo 45-48)
  parking_type VARCHAR(100), -- rodzaj miejsca postojowego
  parking_designation VARCHAR(100), -- oznaczenie miejsca postojowego
  parking_price DECIMAL(10,2), -- cena miejsca postojowego
  parking_date DATE, -- data obowiązywania ceny

  -- Pomieszczenia przynależne (ministerstwo 49-52)
  storage_type VARCHAR(100), -- rodzaj pomieszczenia
  storage_designation VARCHAR(100), -- oznaczenie pomieszczenia
  storage_price DECIMAL(10,2), -- cena
  storage_date DATE, -- data

  -- Prawa niezbędne do korzystania (ministerstwo 53-56)
  necessary_rights_type VARCHAR(100),
  necessary_rights_description TEXT,
  necessary_rights_price DECIMAL(10,2),
  necessary_rights_date DATE,

  -- Inne świadczenia pieniężne (ministerstwo 57-58)
  other_services_type VARCHAR(100),
  other_services_price DECIMAL(10,2),

  -- Dodatkowe dane
  prospectus_url VARCHAR(500), -- adres strony z prospektem
  rooms INTEGER, -- liczba pokoi (opcjonalne)
  floor INTEGER, -- piętro (opcjonalne)
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_apartment_number CHECK (LENGTH(apartment_number) > 0),
  CONSTRAINT valid_prices CHECK (
    price_per_m2 > 0 AND
    base_price > 0 AND
    final_price > 0 AND
    final_price >= base_price
  )
);

-- ============================================
-- CZĘŚĆ 5: TABELA PROJECTS
-- ============================================
-- Dla deweloperów z wieloma projektami (feature Pro/Enterprise)

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,

  -- Lokalizacja projektu
  voivodeship VARCHAR(50),
  county VARCHAR(50),
  municipality VARCHAR(100),
  city VARCHAR(100),
  street VARCHAR(200),
  building_number VARCHAR(20),
  postal_code VARCHAR(10),

  -- Prezentacja (feature Pro/Enterprise)
  presentation_enabled BOOLEAN DEFAULT false,
  custom_domain VARCHAR(255),
  logo_url VARCHAR(500),
  banner_url VARCHAR(500),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_slug CHECK (slug ~* '^[a-z0-9-]+$')
);

-- ============================================
-- CZĘŚĆ 6: TABELA PAYMENTS (Stripe)
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,

  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PLN',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_invoice_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),

  description TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- ============================================
-- CZĘŚĆ 7: TABELA CSV_GENERATION_LOGS
-- ============================================
-- Historia generowania raportów CSV/XML dla ministerstwa

CREATE TABLE IF NOT EXISTS csv_generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,

  generation_type VARCHAR(50) NOT NULL CHECK (generation_type IN ('manual', 'scheduled', 'api')),
  file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('csv', 'xml', 'md5')),

  csv_url TEXT,
  xml_url TEXT,
  md5_hash VARCHAR(32),

  properties_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,

  generated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_properties_count CHECK (properties_count >= 0)
);

-- ============================================
-- CZĘŚĆ 8: INDEKSY DLA WYDAJNOŚCI
-- ============================================

-- Developers
CREATE INDEX IF NOT EXISTS idx_developers_user_id ON developers(user_id);
CREATE INDEX IF NOT EXISTS idx_developers_client_id ON developers(client_id);
CREATE INDEX IF NOT EXISTS idx_developers_email ON developers(email);
CREATE INDEX IF NOT EXISTS idx_developers_stripe_customer ON developers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_developers_subscription_status ON developers(subscription_status);

-- Properties
CREATE INDEX IF NOT EXISTS idx_properties_developer_id ON properties(developer_id);
CREATE INDEX IF NOT EXISTS idx_properties_project_id ON properties(project_id);
CREATE INDEX IF NOT EXISTS idx_properties_apartment_number ON properties(apartment_number);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_wojewodztwo ON properties(wojewodztwo);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- Composite indexes dla częstych zapytań
CREATE INDEX IF NOT EXISTS idx_properties_developer_status ON properties(developer_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(wojewodztwo, powiat, gmina);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_developer_id ON payments(developer_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- CSV Generation Logs
CREATE INDEX IF NOT EXISTS idx_csv_logs_developer_id ON csv_generation_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_csv_logs_generated_at ON csv_generation_logs(generated_at DESC);

-- Full-text search indexes (do szukania po nazwie, mieście, etc.)
CREATE INDEX IF NOT EXISTS idx_developers_company_name_trgm ON developers USING gin(company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_miejscowosc_trgm ON properties USING gin(miejscowosc gin_trgm_ops);

-- ============================================
-- CZĘŚĆ 9: TRIGGERS (updated_at)
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_developers_updated_at ON developers;
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON developers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CZĘŚĆ 10: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_generation_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (jeśli istnieją)
DROP POLICY IF EXISTS "Developers can view own data" ON developers;
DROP POLICY IF EXISTS "Developers can update own data" ON developers;
DROP POLICY IF EXISTS "Users can insert own developer profile" ON developers;
DROP POLICY IF EXISTS "Developers can manage own properties" ON properties;
DROP POLICY IF EXISTS "Developers can manage own projects" ON projects;
DROP POLICY IF EXISTS "Developers can view own payments" ON payments;
DROP POLICY IF EXISTS "Developers can view own logs" ON csv_generation_logs;
DROP POLICY IF EXISTS "Public can read for ministry" ON properties;

-- DEVELOPERS policies
CREATE POLICY "Developers can view own data"
  ON developers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Developers can update own data"
  ON developers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own developer profile"
  ON developers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- PROPERTIES policies
CREATE POLICY "Developers can manage own properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );

-- Public access for ministry endpoints (bez autentykacji)
CREATE POLICY "Public can read for ministry"
  ON properties
  FOR SELECT
  TO anon
  USING (true);

-- PROJECTS policies
CREATE POLICY "Developers can manage own projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );

-- PAYMENTS policies
CREATE POLICY "Developers can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );

-- CSV GENERATION LOGS policies
CREATE POLICY "Developers can view own logs"
  ON csv_generation_logs
  FOR SELECT
  TO authenticated
  USING (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- CZĘŚĆ 11: FUNKCJE POMOCNICZE
-- ============================================

-- Function to generate client_id automatically
CREATE OR REPLACE FUNCTION generate_client_id()
RETURNS VARCHAR AS $$
DECLARE
  new_client_id VARCHAR(100);
  client_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random client_id: dev_ + 12 random chars
    new_client_id := 'dev_' || LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));

    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM developers WHERE client_id = new_client_id) INTO client_exists;

    -- Exit if unique
    EXIT WHEN NOT client_exists;
  END LOOP;

  RETURN new_client_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate URLs for developer
CREATE OR REPLACE FUNCTION update_developer_urls()
RETURNS TRIGGER AS $$
DECLARE
  base_url TEXT := 'https://otoraport.vercel.app'; -- zmień w production
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    NEW.xml_url := base_url || '/api/public/' || NEW.client_id || '/data.xml';
    NEW.csv_url := base_url || '/api/public/' || NEW.client_id || '/data.csv';
    NEW.md5_url := base_url || '/api/public/' || NEW.client_id || '/data.md5';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for auto-generating URLs
DROP TRIGGER IF EXISTS update_developer_urls_trigger ON developers;
CREATE TRIGGER update_developer_urls_trigger
  BEFORE INSERT OR UPDATE OF client_id ON developers
  FOR EACH ROW
  EXECUTE FUNCTION update_developer_urls();

-- ============================================
-- CZĘŚĆ 12: SEED DATA (Opcjonalne - usuń jeśli nie potrzebujesz)
-- ============================================

-- Możesz zakomentować tę część jeśli nie chcesz testowych danych

/*
-- Test developer (tylko dla development)
INSERT INTO developers (
  user_id,
  client_id,
  company_name,
  legal_form,
  nip,
  email,
  phone,
  headquarters_voivodeship,
  headquarters_city,
  headquarters_postal_code,
  website,
  subscription_plan
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- użyje pierwszego usera z auth
  'dev_test_123456',
  'INPRO S.A.',
  'Spółka Akcyjna',
  '1234567890',
  'kontakt@inpro.pl',
  '+48 123 456 789',
  'mazowieckie',
  'Warszawa',
  '00-001',
  'https://inpro.pl',
  'trial'
) ON CONFLICT (client_id) DO NOTHING;
*/

COMMIT;

-- ============================================
-- KONIEC MIGRACJI
-- ============================================
-- Struktura bazy gotowa!
-- Możesz teraz przetestować endpointy API
-- ============================================

-- Sprawdź czy wszystko się utworzyło:
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
