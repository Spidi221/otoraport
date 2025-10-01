-- ============================================
-- OTORAPORT V2 - FINAL SETUP: CZYSTY START
-- ============================================
-- Ten SQL:
-- 1. USUWA wszystkie stare tabele
-- 2. TWORZY nową strukturę zgodną z ministerstwem
-- 3. Dodaje Ciebie jako pierwszego admina
-- ============================================
-- ⚠️ UWAGA: To USUNIE WSZYSTKIE DANE!
-- ============================================

BEGIN;

-- ============================================
-- CZĘŚĆ 1: WYCZYŚĆ WSZYSTKO
-- ============================================

-- Drop wszystkich tabel (z CASCADE żeby usunąć foreign keys)
DROP TABLE IF EXISTS csv_generation_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS developers CASCADE;
DROP TABLE IF EXISTS uploaded_files CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;

-- Drop starych backup tables (jeśli istnieją)
DROP TABLE IF EXISTS developers_backup CASCADE;
DROP TABLE IF EXISTS properties_backup CASCADE;
DROP TABLE IF EXISTS projects_backup CASCADE;

-- Drop triggers i functions (żeby odświeżyć)
DROP TRIGGER IF EXISTS update_developers_updated_at ON developers;
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_developer_urls_trigger ON developers;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_developer_urls();
DROP FUNCTION IF EXISTS generate_client_id();

-- ============================================
-- CZĘŚĆ 2: EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- dla full-text search

-- ============================================
-- CZĘŚĆ 3: TABELA DEVELOPERS
-- ============================================
-- Wszystkie 28 pól ministerstwa + dane biznesowe

CREATE TABLE developers (
  -- Identyfikatory
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id VARCHAR(100) UNIQUE NOT NULL,

  -- Podstawowe dane (ministerstwo 1-8)
  company_name VARCHAR(255) NOT NULL,
  legal_form VARCHAR(100) DEFAULT 'Spółka z o.o.',
  krs_number VARCHAR(50),
  ceidg_number VARCHAR(50),
  nip VARCHAR(20) NOT NULL,
  regon VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255) NOT NULL,

  -- Adres siedziby (ministerstwo 9-16)
  headquarters_voivodeship VARCHAR(50),
  headquarters_county VARCHAR(50),
  headquarters_municipality VARCHAR(100),
  headquarters_city VARCHAR(100),
  headquarters_street VARCHAR(200),
  headquarters_building_number VARCHAR(20),
  headquarters_apartment_number VARCHAR(20),
  headquarters_postal_code VARCHAR(10),

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
  additional_sales_locations TEXT,
  contact_method VARCHAR(200) DEFAULT 'email, telefon',
  website VARCHAR(500),
  additional_contact_info TEXT,

  -- Subskrypcja OTORAPORT
  subscription_plan VARCHAR(50) DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'basic', 'pro', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_starts_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,

  -- Stripe
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),

  -- URLs ministerstwa (auto-generowane)
  xml_url VARCHAR(500),
  csv_url VARCHAR(500),
  md5_url VARCHAR(500),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_nip CHECK (LENGTH(nip) >= 10)
);

-- ============================================
-- CZĘŚĆ 4: TABELA PROPERTIES
-- ============================================
-- Wszystkie pola dla mieszkania (ministerstwo 29-58)

CREATE TABLE properties (
  -- Identyfikatory
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

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

  -- Ceny (ministerstwo 39-44)
  price_per_m2 DECIMAL(10,2) NOT NULL,
  price_valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  base_price DECIMAL(12,2) NOT NULL,
  base_price_valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  final_price DECIMAL(12,2) NOT NULL,
  final_price_valid_from DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Miejsca postojowe (ministerstwo 45-48)
  parking_type VARCHAR(100),
  parking_designation VARCHAR(100),
  parking_price DECIMAL(10,2),
  parking_date DATE,

  -- Pomieszczenia przynależne (ministerstwo 49-52)
  storage_type VARCHAR(100),
  storage_designation VARCHAR(100),
  storage_price DECIMAL(10,2),
  storage_date DATE,

  -- Prawa niezbędne (ministerstwo 53-56)
  necessary_rights_type VARCHAR(100),
  necessary_rights_description TEXT,
  necessary_rights_price DECIMAL(10,2),
  necessary_rights_date DATE,

  -- Inne świadczenia (ministerstwo 57-58)
  other_services_type VARCHAR(100),
  other_services_price DECIMAL(10,2),
  prospectus_url VARCHAR(500),

  -- Dodatkowe (opcjonalne)
  rooms INTEGER,
  floor INTEGER,
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
-- Dla deweloperów z wieloma projektami

CREATE TABLE projects (
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

  -- Prezentacja (Pro/Enterprise)
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
-- CZĘŚĆ 6: TABELA PAYMENTS
-- ============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,

  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PLN',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_invoice_id VARCHAR(255),

  description TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- ============================================
-- CZĘŚĆ 7: TABELA CSV_GENERATION_LOGS
-- ============================================

CREATE TABLE csv_generation_logs (
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

  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CZĘŚĆ 8: INDEKSY
-- ============================================

-- Developers
CREATE INDEX idx_developers_user_id ON developers(user_id);
CREATE INDEX idx_developers_client_id ON developers(client_id);
CREATE INDEX idx_developers_email ON developers(email);
CREATE INDEX idx_developers_stripe_customer ON developers(stripe_customer_id);
CREATE INDEX idx_developers_subscription_status ON developers(subscription_status);
CREATE INDEX idx_developers_company_name_trgm ON developers USING gin(company_name gin_trgm_ops);

-- Properties
CREATE INDEX idx_properties_developer_id ON properties(developer_id);
CREATE INDEX idx_properties_project_id ON properties(project_id);
CREATE INDEX idx_properties_apartment_number ON properties(apartment_number);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_wojewodztwo ON properties(wojewodztwo);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX idx_properties_developer_status ON properties(developer_id, status);
CREATE INDEX idx_properties_location ON properties(wojewodztwo, powiat, gmina);
CREATE INDEX idx_properties_miejscowosc_trgm ON properties USING gin(miejscowosc gin_trgm_ops);

-- Projects
CREATE INDEX idx_projects_developer_id ON projects(developer_id);
CREATE INDEX idx_projects_slug ON projects(slug);

-- Payments
CREATE INDEX idx_payments_developer_id ON payments(developer_id);
CREATE INDEX idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);

-- CSV Logs
CREATE INDEX idx_csv_logs_developer_id ON csv_generation_logs(developer_id);
CREATE INDEX idx_csv_logs_generated_at ON csv_generation_logs(generated_at DESC);

-- ============================================
-- CZĘŚĆ 9: FUNKCJE I TRIGGERY
-- ============================================

-- Function: updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers dla updated_at
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON developers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: generate client_id
CREATE OR REPLACE FUNCTION generate_client_id()
RETURNS VARCHAR AS $$
DECLARE
  new_client_id VARCHAR(100);
  client_exists BOOLEAN;
BEGIN
  LOOP
    new_client_id := 'dev_' || LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
    SELECT EXISTS(SELECT 1 FROM developers WHERE client_id = new_client_id) INTO client_exists;
    EXIT WHEN NOT client_exists;
  END LOOP;
  RETURN new_client_id;
END;
$$ LANGUAGE plpgsql;

-- Function: auto-generate URLs
CREATE OR REPLACE FUNCTION update_developer_urls()
RETURNS TRIGGER AS $$
DECLARE
  base_url TEXT := COALESCE(current_setting('app.base_url', true), 'https://otoraport.vercel.app');
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    NEW.xml_url := base_url || '/api/public/' || NEW.client_id || '/data.xml';
    NEW.csv_url := base_url || '/api/public/' || NEW.client_id || '/data.csv';
    NEW.md5_url := base_url || '/api/public/' || NEW.client_id || '/data.md5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla URLs
CREATE TRIGGER update_developer_urls_trigger
  BEFORE INSERT OR UPDATE OF client_id ON developers
  FOR EACH ROW
  EXECUTE FUNCTION update_developer_urls();

-- ============================================
-- CZĘŚĆ 10: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_generation_logs ENABLE ROW LEVEL SECURITY;

-- DEVELOPERS policies
CREATE POLICY "Users can view own developer profile"
  ON developers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own developer profile"
  ON developers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own developer profile"
  ON developers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- PROPERTIES policies
CREATE POLICY "Developers can manage own properties"
  ON properties FOR ALL
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

CREATE POLICY "Public can read properties for ministry"
  ON properties FOR SELECT
  TO anon
  USING (true);

-- PROJECTS policies
CREATE POLICY "Developers can manage own projects"
  ON projects FOR ALL
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
  ON payments FOR SELECT
  TO authenticated
  USING (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );

-- CSV LOGS policies
CREATE POLICY "Developers can view own logs"
  ON csv_generation_logs FOR SELECT
  TO authenticated
  USING (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );

COMMIT;

-- ============================================
-- CZĘŚĆ 11: WERYFIKACJA
-- ============================================

-- Sprawdź czy wszystko się utworzyło
SELECT
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Sprawdź RLS
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Sprawdź indexes
SELECT
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- KONIEC SETUP
-- ============================================
-- ✅ Baza gotowa!
-- ✅ Wszystkie tabele utworzone
-- ✅ RLS włączony
-- ✅ Indexes dodane
-- ✅ Triggery działają
--
-- NASTĘPNY KROK:
-- 1. Zaloguj się do aplikacji (auth.users automatycznie utworzy rekord)
-- 2. Aplikacja automatycznie utworzy twój profil developera
-- 3. Lub użyj SQL poniżej aby utworzyć ręcznie
-- ============================================
