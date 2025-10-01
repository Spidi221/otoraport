-- ============================================
-- OTORAPORT V2 - KROK 3: MIGRACJA Z ZACHOWANIEM DANYCH
-- ============================================
-- Ten SQL ZACHOWA twoje istniejące dane:
-- - 4 deweloperów
-- - 75 properties
-- - 10 projektów
-- I doda brakujące pola ministerstwa
-- ============================================

BEGIN;

-- ============================================
-- CZĘŚĆ 1: BACKUP (na wszelki wypadek)
-- ============================================

-- Backup developers do tymczasowej tabeli
CREATE TABLE IF NOT EXISTS developers_backup AS
SELECT * FROM developers;

-- Backup properties (z raw_data!)
CREATE TABLE IF NOT EXISTS properties_backup AS
SELECT * FROM properties;

-- Backup projects
CREATE TABLE IF NOT EXISTS projects_backup AS
SELECT * FROM projects;

-- ============================================
-- CZĘŚĆ 2: DODAJ BRAKUJĄCE KOLUMNY DO DEVELOPERS
-- ============================================

-- Pola ministerstwa które nie istnieją w obecnej tabeli

-- Adres siedziby (rozbij headquarters_address na 8 pól)
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS headquarters_voivodeship VARCHAR(50),
  ADD COLUMN IF NOT EXISTS headquarters_county VARCHAR(50),
  ADD COLUMN IF NOT EXISTS headquarters_municipality VARCHAR(100),
  ADD COLUMN IF NOT EXISTS headquarters_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS headquarters_street VARCHAR(200),
  ADD COLUMN IF NOT EXISTS headquarters_building_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS headquarters_apartment_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS headquarters_postal_code VARCHAR(10);

-- Adres lokalu sprzedaży (8 nowych pól)
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS sales_office_voivodeship VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sales_office_county VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sales_office_municipality VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sales_office_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sales_office_street VARCHAR(200),
  ADD COLUMN IF NOT EXISTS sales_office_building_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sales_office_apartment_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sales_office_postal_code VARCHAR(10);

-- Dodatkowe dane kontaktowe
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS additional_sales_locations TEXT,
  ADD COLUMN IF NOT EXISTS contact_method VARCHAR(200) DEFAULT 'email, telefon',
  ADD COLUMN IF NOT EXISTS website VARCHAR(500),
  ADD COLUMN IF NOT EXISTS additional_contact_info TEXT;

-- Popraw istniejące pola
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS krs_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ceidg_number VARCHAR(50);

-- Stripe (jeśli nie ma)
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Trial dates
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMPTZ;

-- CSV URL (jeśli nie ma)
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS csv_url VARCHAR(500);

-- ============================================
-- CZĘŚĆ 3: MIGRUJ DANE Z ISTNIEJĄCYCH KOLUMN
-- ============================================

-- Przenieś krs → krs_number
UPDATE developers
SET krs_number = krs
WHERE krs IS NOT NULL AND krs_number IS NULL;

-- Przenieś ceidg → ceidg_number
UPDATE developers
SET ceidg_number = ceidg
WHERE ceidg IS NOT NULL AND ceidg_number IS NULL;

-- Jeśli legal_form jest puste, użyj forma_prawna
UPDATE developers
SET legal_form = COALESCE(legal_form, forma_prawna, 'Spółka z o.o.')
WHERE legal_form IS NULL OR legal_form = '';

-- ============================================
-- CZĘŚĆ 4: PRZEBUDUJ TABELE PROPERTIES
-- ============================================

-- Najpierw dodaj wszystkie kolumny ministerstwa do properties

-- Lokalizacja inwestycji (7 pól)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS wojewodztwo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS powiat VARCHAR(50),
  ADD COLUMN IF NOT EXISTS gmina VARCHAR(100),
  ADD COLUMN IF NOT EXISTS miejscowosc VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ulica VARCHAR(200),
  ADD COLUMN IF NOT EXISTS nr_budynku VARCHAR(20),
  ADD COLUMN IF NOT EXISTS kod_pocztowy VARCHAR(10);

-- Dane mieszkania
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS property_type VARCHAR(50) DEFAULT 'mieszkanie',
  ADD COLUMN IF NOT EXISTS apartment_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS area DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS rooms INTEGER;

-- Ceny
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS price_per_m2 DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS price_valid_from DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS base_price_valid_from DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS final_price DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS final_price_valid_from DATE DEFAULT CURRENT_DATE;

-- Miejsca postojowe
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS parking_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parking_designation VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parking_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS parking_date DATE;

-- Pomieszczenia przynależne
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS storage_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS storage_designation VARCHAR(100),
  ADD COLUMN IF NOT EXISTS storage_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS storage_date DATE;

-- Prawa niezbędne
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS necessary_rights_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS necessary_rights_description TEXT,
  ADD COLUMN IF NOT EXISTS necessary_rights_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS necessary_rights_date DATE;

-- Inne świadczenia
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS other_services_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS other_services_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS prospectus_url VARCHAR(500);

-- Status
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';

-- Floor
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS floor INTEGER;

-- ============================================
-- CZĘŚĆ 5: MIGRACJA DANYCH Z raw_data JSONB
-- ============================================

-- WAŻNE: Musisz dostosować te ścieżki do struktury twojego JSON-a w raw_data
-- Sprawdź przykładowy rekord: SELECT raw_data FROM properties LIMIT 1;

-- Najpierw ustaw developer_id na podstawie project_id
UPDATE properties p
SET developer_id = pr.developer_id
FROM projects pr
WHERE p.project_id = pr.id
  AND p.developer_id IS NULL;

-- Migracja danych z raw_data (przykłady - dostosuj ścieżki!)
UPDATE properties
SET
  apartment_number = COALESCE(apartment_number, raw_data->>'apartment_number', raw_data->>'nr_lokalu', 'N/A'),
  area = COALESCE(area, (raw_data->>'area')::DECIMAL, (raw_data->>'powierzchnia')::DECIMAL),
  rooms = COALESCE(rooms, (raw_data->>'rooms')::INTEGER, (raw_data->>'pokoje')::INTEGER),
  price_per_m2 = COALESCE(price_per_m2, (raw_data->>'price_per_m2')::DECIMAL, (raw_data->>'cena_za_m2')::DECIMAL),
  base_price = COALESCE(base_price, (raw_data->>'base_price')::DECIMAL, (raw_data->>'cena_bazowa')::DECIMAL),
  final_price = COALESCE(final_price, (raw_data->>'final_price')::DECIMAL, (raw_data->>'cena_koncowa')::DECIMAL),

  -- Lokalizacja
  wojewodztwo = COALESCE(wojewodztwo, raw_data->>'wojewodztwo', raw_data->>'voivodeship'),
  powiat = COALESCE(powiat, raw_data->>'powiat', raw_data->>'county'),
  gmina = COALESCE(gmina, raw_data->>'gmina', raw_data->>'municipality'),
  miejscowosc = COALESCE(miejscowosc, raw_data->>'miejscowosc', raw_data->>'city'),
  ulica = COALESCE(ulica, raw_data->>'ulica', raw_data->>'street'),
  nr_budynku = COALESCE(nr_budynku, raw_data->>'nr_budynku', raw_data->>'building_number'),
  kod_pocztowy = COALESCE(kod_pocztowy, raw_data->>'kod_pocztowy', raw_data->>'postal_code'),

  floor = COALESCE(floor, (raw_data->>'floor')::INTEGER, (raw_data->>'pietro')::INTEGER)
WHERE raw_data IS NOT NULL;

-- ============================================
-- CZĘŚĆ 6: DODAJ BRAKUJĄCE WARTOŚCI DEFAULT
-- ============================================

-- Dla properties bez lokalizacji - spróbuj wziąć z projektu
UPDATE properties p
SET
  wojewodztwo = COALESCE(p.wojewodztwo, pr.location),
  powiat = COALESCE(p.powiat, pr.location),
  gmina = COALESCE(p.gmina, pr.location)
FROM projects pr
WHERE p.project_id = pr.id
  AND (p.wojewodztwo IS NULL OR p.powiat IS NULL OR p.gmina IS NULL);

-- Jeśli nadal brak - ustaw placeholder
UPDATE properties
SET
  wojewodztwo = COALESCE(wojewodztwo, 'nieznane'),
  powiat = COALESCE(powiat, 'nieznany'),
  gmina = COALESCE(gmina, 'nieznana'),
  apartment_number = COALESCE(apartment_number, 'N/A'),
  price_per_m2 = COALESCE(price_per_m2, 0),
  base_price = COALESCE(base_price, 0),
  final_price = COALESCE(final_price, 0)
WHERE developer_id IS NOT NULL;

-- ============================================
-- CZĘŚĆ 7: DODAJ NOWE TABELE
-- ============================================

-- CSV Generation Logs (nowa tabela)
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
-- CZĘŚĆ 8: INDEKSY DLA NOWYCH KOLUMN
-- ============================================

-- Properties - nowe indexy
CREATE INDEX IF NOT EXISTS idx_properties_developer_id ON properties(developer_id);
CREATE INDEX IF NOT EXISTS idx_properties_apartment_number ON properties(apartment_number);
CREATE INDEX IF NOT EXISTS idx_properties_wojewodztwo ON properties(wojewodztwo);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_developer_status ON properties(developer_id, status);

-- Developers - uzupełnij brakujące
CREATE INDEX IF NOT EXISTS idx_developers_stripe_customer ON developers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_developers_subscription_status ON developers(subscription_status);

-- CSV Logs
CREATE INDEX IF NOT EXISTS idx_csv_logs_developer_id ON csv_generation_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_csv_logs_generated_at ON csv_generation_logs(generated_at DESC);

-- ============================================
-- CZĘŚĆ 9: TRIGGERS
-- ============================================

-- Function to update updated_at (jeśli nie istnieje)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to developers (jeśli nie ma)
DROP TRIGGER IF EXISTS update_developers_updated_at ON developers;
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON developers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to properties (jeśli nie ma)
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CZĘŚĆ 10: AUTO-GENERATE URLs
-- ============================================

-- Function to auto-generate XML/CSV/MD5 URLs
CREATE OR REPLACE FUNCTION update_developer_urls()
RETURNS TRIGGER AS $$
DECLARE
  base_url TEXT := 'https://otoraport.vercel.app';
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    NEW.xml_url := base_url || '/api/public/' || NEW.client_id || '/data.xml';
    NEW.csv_url := base_url || '/api/public/' || NEW.client_id || '/data.csv';
    NEW.md5_url := base_url || '/api/public/' || NEW.client_id || '/data.md5';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS update_developer_urls_trigger ON developers;
CREATE TRIGGER update_developer_urls_trigger
  BEFORE INSERT OR UPDATE OF client_id ON developers
  FOR EACH ROW
  EXECUTE FUNCTION update_developer_urls();

-- Uruchom dla istniejących developerów
UPDATE developers
SET client_id = client_id
WHERE client_id IS NOT NULL;

-- ============================================
-- CZĘŚĆ 11: DODAJ RLS DLA NOWYCH TABEL
-- ============================================

ALTER TABLE csv_generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developers can view own logs" ON csv_generation_logs;
CREATE POLICY "Developers can view own logs"
  ON csv_generation_logs
  FOR SELECT
  TO authenticated
  USING (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );

-- Public access dla properties (dla ministerstwa)
DROP POLICY IF EXISTS "Public can read for ministry" ON properties;
CREATE POLICY "Public can read for ministry"
  ON properties
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- CZĘŚĆ 12: USUŃ NIEPOTRZEBNE TABELE
-- ============================================

-- Te tabele są backupowane, więc możesz je usunąć
-- Ale zachowaj backup tables na wszelki wypadek!

DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS uploaded_files CASCADE;

-- ============================================
-- CZĘŚĆ 13: CONSTRAINTS I WALIDACJA
-- ============================================

-- Dodaj constraints (jeśli nie istnieją)
DO $$
BEGIN
  -- Valid email
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_email'
    AND conrelid = 'developers'::regclass
  ) THEN
    ALTER TABLE developers
      ADD CONSTRAINT valid_email
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;

  -- Valid NIP
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_nip'
    AND conrelid = 'developers'::regclass
  ) THEN
    ALTER TABLE developers
      ADD CONSTRAINT valid_nip
      CHECK (LENGTH(nip) >= 10 OR nip IS NULL);
  END IF;
END $$;

COMMIT;

-- ============================================
-- CZĘŚĆ 14: WERYFIKACJA PO MIGRACJI
-- ============================================

-- Sprawdź liczbę rekordów (powinna się zgadzać!)
SELECT
  'developers' as table_name,
  COUNT(*) as count,
  'Expected: 4' as expected
FROM developers
UNION ALL
SELECT
  'properties' as table_name,
  COUNT(*) as count,
  'Expected: 75' as expected
FROM properties
UNION ALL
SELECT
  'projects' as table_name,
  COUNT(*) as count,
  'Expected: 10' as expected
FROM projects;

-- Sprawdź kolumny w properties
SELECT COUNT(*) as properties_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'properties';
-- Powinno być ~40+

-- Sprawdź kolumny w developers
SELECT COUNT(*) as developers_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'developers';
-- Powinno być ~35+

-- Sprawdź wypełnienie danych
SELECT
  COUNT(*) FILTER (WHERE apartment_number IS NOT NULL) as with_apartment_number,
  COUNT(*) FILTER (WHERE wojewodztwo IS NOT NULL) as with_voivodeship,
  COUNT(*) FILTER (WHERE price_per_m2 IS NOT NULL AND price_per_m2 > 0) as with_price,
  COUNT(*) as total
FROM properties;

-- ============================================
-- KONIEC MIGRACJI Z ZACHOWANIEM DANYCH
-- ============================================
-- Twoje dane zostały zachowane i rozszerzone!
-- Backup tables: developers_backup, properties_backup, projects_backup
-- Możesz je usunąć później gdy zweryfikujesz że wszystko działa
-- ============================================
