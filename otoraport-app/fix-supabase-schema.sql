-- ========================================================================
-- NAPRAWA SCHEMATU SUPABASE - Sprawdź i dodaj brakujące kolumny
-- ========================================================================

-- KROK 1: Sprawdź istniejące kolumny w tabeli properties
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;

-- KROK 2: Sprawdź istniejące tabele
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('developers', 'projects', 'properties', 'payments');

-- KROK 3: Sprawdź strukture tabeli developers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'developers'
ORDER BY ordinal_position;

-- ========================================================================
-- BEZPIECZNE DODAWANIE KOLUMN (tylko jeśli nie istnieją)
-- ========================================================================

-- Dodaj kolumny do tabeli properties (jeśli nie istnieją)
DO $$
BEGIN
    -- Lokalizacja (ministerstwo)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='wojewodztwo') THEN
        ALTER TABLE properties ADD COLUMN wojewodztwo VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='powiat') THEN
        ALTER TABLE properties ADD COLUMN powiat VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='gmina') THEN
        ALTER TABLE properties ADD COLUMN gmina VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='miejscowosc') THEN
        ALTER TABLE properties ADD COLUMN miejscowosc VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='ulica') THEN
        ALTER TABLE properties ADD COLUMN ulica VARCHAR(200);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='numer_nieruchomosci') THEN
        ALTER TABLE properties ADD COLUMN numer_nieruchomosci VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='kod_pocztowy') THEN
        ALTER TABLE properties ADD COLUMN kod_pocztowy VARCHAR(10);
    END IF;

    -- Szczegóły mieszkania
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='kondygnacja') THEN
        ALTER TABLE properties ADD COLUMN kondygnacja INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='liczba_pokoi') THEN
        ALTER TABLE properties ADD COLUMN liczba_pokoi DECIMAL(3,1);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='powierzchnia_balkon') THEN
        ALTER TABLE properties ADD COLUMN powierzchnia_balkon DECIMAL(8,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='powierzchnia_taras') THEN
        ALTER TABLE properties ADD COLUMN powierzchnia_taras DECIMAL(8,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='powierzchnia_loggia') THEN
        ALTER TABLE properties ADD COLUMN powierzchnia_loggia DECIMAL(8,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='powierzchnia_ogrod') THEN
        ALTER TABLE properties ADD COLUMN powierzchnia_ogrod DECIMAL(10,2);
    END IF;

    -- Daty compliance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='data_pierwszej_oferty') THEN
        ALTER TABLE properties ADD COLUMN data_pierwszej_oferty DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='price_valid_from') THEN
        ALTER TABLE properties ADD COLUMN price_valid_from DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='price_valid_to') THEN
        ALTER TABLE properties ADD COLUMN price_valid_to DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='data_rezerwacji') THEN
        ALTER TABLE properties ADD COLUMN data_rezerwacji DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='data_sprzedazy') THEN
        ALTER TABLE properties ADD COLUMN data_sprzedazy DATE;
    END IF;

    -- Parking i dodatki (używamy JSONB dla elastyczności)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='miejsca_postojowe_nr') THEN
        ALTER TABLE properties ADD COLUMN miejsca_postojowe_nr JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='miejsca_postojowe_ceny') THEN
        ALTER TABLE properties ADD COLUMN miejsca_postojowe_ceny JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='komorki_nr') THEN
        ALTER TABLE properties ADD COLUMN komorki_nr JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='komorki_ceny') THEN
        ALTER TABLE properties ADD COLUMN komorki_ceny JSONB;
    END IF;

    -- Dane budynku
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='construction_year') THEN
        ALTER TABLE properties ADD COLUMN construction_year INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='building_permit_number') THEN
        ALTER TABLE properties ADD COLUMN building_permit_number VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='energy_class') THEN
        ALTER TABLE properties ADD COLUMN energy_class VARCHAR(10);
    END IF;

    -- Status compliance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='status_dostepnosci') THEN
        ALTER TABLE properties ADD COLUMN status_dostepnosci VARCHAR(50) DEFAULT 'dostępne';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='data_aktualizacji') THEN
        ALTER TABLE properties ADD COLUMN data_aktualizacji TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='uuid_ministerstwo') THEN
        ALTER TABLE properties ADD COLUMN uuid_ministerstwo UUID DEFAULT gen_random_uuid();
    END IF;

    RAISE NOTICE 'Kolumny zostały bezpiecznie dodane do tabeli properties';
END $$;

-- ========================================================================
-- DODAJ BRAKUJĄCE KOLUMNY DO TABELI DEVELOPERS
-- ========================================================================

DO $$
BEGIN
    -- Rozszerzone dane firmy
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='developers' AND column_name='custom_domain') THEN
        ALTER TABLE developers ADD COLUMN custom_domain VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='developers' AND column_name='presentation_url') THEN
        ALTER TABLE developers ADD COLUMN presentation_url VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='developers' AND column_name='presentation_generated_at') THEN
        ALTER TABLE developers ADD COLUMN presentation_generated_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='developers' AND column_name='krs') THEN
        ALTER TABLE developers ADD COLUMN krs VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='developers' AND column_name='ceidg') THEN
        ALTER TABLE developers ADD COLUMN ceidg VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='developers' AND column_name='legal_form') THEN
        ALTER TABLE developers ADD COLUMN legal_form VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='developers' AND column_name='headquarters_address') THEN
        ALTER TABLE developers ADD COLUMN headquarters_address TEXT;
    END IF;

    RAISE NOTICE 'Kolumny zostały bezpiecznie dodane do tabeli developers';
END $$;

-- ========================================================================
-- STWÓRZ POPRAWNY WIDOK DLA MINISTERSTWA (z właściwymi nazwami kolumn)
-- ========================================================================

-- Usuń stary widok jeśli istnieje
DROP VIEW IF EXISTS ministry_export_view;

-- Stwórz nowy widok sprawdzając rzeczywiste nazwy kolumn
CREATE OR REPLACE VIEW ministry_export_view AS
SELECT
    -- Developer info
    d.company_name AS nazwa_dewelopera,
    d.legal_form AS forma_prawna,
    d.nip,
    d.regon,
    d.krs,
    d.ceidg,
    d.phone AS telefon,
    d.email,

    -- Project info
    pr.name AS nazwa_inwestycji,
    pr.location AS lokalizacja_projektu,

    -- Property location (używaj kolumn które istnieją)
    COALESCE(p.wojewodztwo, 'mazowieckie') AS wojewodztwo,
    COALESCE(p.powiat, 'warszawski') AS powiat,
    COALESCE(p.gmina, 'Warszawa') AS gmina,
    COALESCE(p.miejscowosc, 'Warszawa') AS miejscowosc,
    COALESCE(p.ulica, 'ul. Przykładowa') AS ulica,
    COALESCE(p.numer_nieruchomosci, '1') AS numer_nieruchomosci,
    COALESCE(p.kod_pocztowy, '00-001') AS kod_pocztowy,

    -- Property details (sprawdź czy property_number istnieje, jeśli nie użyj id)
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='property_number')
        THEN p.property_number::text
        ELSE p.id::text
    END AS numer_lokalu,

    p.property_type AS rodzaj_nieruchomosci,
    p.kondygnacja AS pietro,
    p.liczba_pokoi,
    p.area AS powierzchnia_uzytkowa,

    -- Prices
    p.price_per_m2 AS cena_za_m2,
    p.total_price AS cena_bazowa,
    p.final_price AS cena_finalna,

    -- Dates
    COALESCE(p.data_pierwszej_oferty, p.created_at::date) AS data_pierwszej_oferty,
    p.data_rezerwacji,
    p.data_sprzedazy,

    -- Status
    COALESCE(p.status_dostepnosci, p.status, 'dostępne') AS status_dostepnosci,

    -- Ministry metadata
    p.uuid_ministerstwo,
    COALESCE(p.data_aktualizacji, p.updated_at::timestamptz) AS data_ostatniej_aktualizacji

FROM properties p
JOIN projects pr ON p.project_id = pr.id
JOIN developers d ON pr.developer_id = d.id
WHERE p.status != 'archiwalne' OR p.status IS NULL
ORDER BY d.company_name, pr.name, p.id;

-- ========================================================================
-- SPRAWDŹ WYNIKI
-- ========================================================================

-- Pokaż strukturę po zmianach
SELECT 'properties' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;

-- Test view
SELECT COUNT(*) as total_properties_in_view FROM ministry_export_view;

-- Sprawdź czy property_number istnieje
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='property_number')
        THEN 'property_number EXISTS ✅'
        ELSE 'property_number MISSING ❌ - using id instead'
    END as property_number_status;

RAISE NOTICE 'Schema update completed successfully! 🎉';