-- FAZA 1: Rozszerzenie bazy danych - brakujące pola dla funkcjonalności
-- Wykonać w kolejności na bazie Supabase

-- ===== DEVELOPERS TABLE EXTENSIONS =====

-- Custom domains i presentation pages (Enterprise/Pro features)
ALTER TABLE developers ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS presentation_url VARCHAR(255);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS presentation_generated_at TIMESTAMPTZ;

-- Dodatkowe dane ministerstwa
ALTER TABLE developers ADD COLUMN IF NOT EXISTS krs VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS ceidg VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS regon VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS legal_form VARCHAR(100);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS headquarters_address TEXT;

-- Plan subskrypcji i billing
ALTER TABLE developers ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'trial';
ALTER TABLE developers ADD COLUMN IF NOT EXISTS billing_period VARCHAR(20);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS client_id VARCHAR(100) UNIQUE;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS xml_url VARCHAR(500);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS md5_url VARCHAR(500);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- ===== PAYMENTS TABLE - nowa tabela jeśli nie istnieje =====

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PLN',
    status VARCHAR(50) DEFAULT 'pending', -- pending, initialized, completed, failed
    plan_type VARCHAR(50), -- basic, pro, enterprise
    billing_period VARCHAR(20), -- monthly, yearly
    przelewy24_session_id VARCHAR(100),
    przelewy24_token VARCHAR(255),
    przelewy24_order_id VARCHAR(100),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksy dla performance
CREATE INDEX IF NOT EXISTS idx_payments_developer_id ON payments(developer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(przelewy24_session_id);

-- ===== PROPERTIES TABLE EXTENSIONS - podstawowe pola ministerstwa =====

-- Lokalizacja inwestycji (wymagane przez ministerstwo)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wojewodztwo VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS powiat VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS gmina VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS miejscowosc VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ulica VARCHAR(200);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS numer_nieruchomosci VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS kod_pocztowy VARCHAR(10);

-- Daty obowiązywania cen
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_valid_from DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_valid_to DATE;

-- Status dostępności
ALTER TABLE properties ADD COLUMN IF NOT EXISTS status_dostepnosci VARCHAR(50) DEFAULT 'dostepne';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS data_rezerwacji DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS data_sprzedazy DATE;

-- ===== USERS TABLE dla NextAuth integration =====

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    company_name VARCHAR(255),
    nip VARCHAR(15),
    phone VARCHAR(20),
    plan VARCHAR(50) DEFAULT 'trial',
    subscription_status VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_developers_client_id ON developers(client_id);
CREATE INDEX IF NOT EXISTS idx_properties_wojewodztwo ON properties(wojewodztwo);

-- ===== UPDATE TRIGGERS =====

-- Trigger dla updated_at w developers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_developers_updated_at 
    BEFORE UPDATE ON developers 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- ===== KOMENTARZE =====

COMMENT ON COLUMN developers.custom_domain IS 'Custom domain dla Enterprise (np. mieszkania.devex.pl)';
COMMENT ON COLUMN developers.presentation_url IS 'URL do strony prezentacyjnej (Pro/Enterprise)';  
COMMENT ON COLUMN developers.client_id IS 'Unikalny identyfikator dla URL-i ministerstwa';
COMMENT ON COLUMN developers.xml_url IS 'Publiczny URL do pliku XML dla harvestera';
COMMENT ON COLUMN developers.md5_url IS 'Publiczny URL do sumy kontrolnej MD5';
COMMENT ON COLUMN payments.plan_type IS 'Typ planu: basic, pro, enterprise';
COMMENT ON COLUMN properties.wojewodztwo IS 'Województwo - wymagane przez ministerstwo';

-- ===== DANE TESTOWE (opcjonalnie) =====

-- Przykład developera z pełnymi danymi
/*
INSERT INTO developers (
    email, name, company_name, nip, phone,
    subscription_plan, subscription_status,
    client_id, xml_url, md5_url,
    krs, regon, legal_form, headquarters_address
) VALUES (
    'test@tambud.pl',
    'Jan Kowalski', 
    'TAMBUD Sp. z o.o.',
    '1234567890',
    '+48123456789',
    'pro',
    'active',
    'dev_1234567890_' || extract(epoch from now()),
    'https://otoraport.pl/api/public/dev_1234567890_' || extract(epoch from now()) || '/data.xml',
    'https://otoraport.pl/api/public/dev_1234567890_' || extract(epoch from now()) || '/data.md5',
    '0000123456',
    '12345678901234',
    'spółka z ograniczoną odpowiedzialnością',
    'ul. Budowlana 1, 00-001 Warszawa'
) ON CONFLICT DO NOTHING;
*/

-- ===== WERYFIKACJA =====

-- Sprawdź czy wszystkie kolumny zostały dodane
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'developers' 
AND column_name IN ('custom_domain', 'presentation_url', 'client_id', 'xml_url');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('wojewodztwo', 'price_valid_from', 'status_dostepnosci');

-- Sprawdź czy tabela payments istnieje
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'payments'
);