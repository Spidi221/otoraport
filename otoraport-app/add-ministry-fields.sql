-- ========================================================================
-- MINISTRY COMPLIANCE: Add all 58 required fields for dane.gov.pl
-- ========================================================================

-- Note: This migration adds all missing fields required by the Polish Ministry
-- for the real estate price transparency law (ustawa z dnia 21 maja 2025 r.)

-- ========================================================================
-- 1. DEVELOPER TABLE EXTENSIONS (Company details)
-- ========================================================================

ALTER TABLE developers
ADD COLUMN IF NOT EXISTS forma_prawna VARCHAR(100),
ADD COLUMN IF NOT EXISTS wojewodztwo VARCHAR(50),
ADD COLUMN IF NOT EXISTS powiat VARCHAR(50),
ADD COLUMN IF NOT EXISTS gmina VARCHAR(100),
ADD COLUMN IF NOT EXISTS miejscowosc VARCHAR(100),
ADD COLUMN IF NOT EXISTS ulica VARCHAR(200),
ADD COLUMN IF NOT EXISTS numer_budynku VARCHAR(20),
ADD COLUMN IF NOT EXISTS numer_lokalu VARCHAR(20),
ADD COLUMN IF NOT EXISTS kod_pocztowy VARCHAR(10),
ADD COLUMN IF NOT EXISTS strona_www VARCHAR(255),
ADD COLUMN IF NOT EXISTS data_wpisu_krs DATE,
ADD COLUMN IF NOT EXISTS data_wpisu_ceidg DATE;

-- ========================================================================
-- 2. PROJECTS TABLE EXTENSIONS (Investment details)
-- ========================================================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS numer_pozwolenia VARCHAR(100),
ADD COLUMN IF NOT EXISTS data_pozwolenia DATE,
ADD COLUMN IF NOT EXISTS wojewodztwo VARCHAR(50),
ADD COLUMN IF NOT EXISTS powiat VARCHAR(50),
ADD COLUMN IF NOT EXISTS gmina VARCHAR(100),
ADD COLUMN IF NOT EXISTS miejscowosc VARCHAR(100),
ADD COLUMN IF NOT EXISTS ulica VARCHAR(200),
ADD COLUMN IF NOT EXISTS numer_nieruchomosci VARCHAR(50),
ADD COLUMN IF NOT EXISTS kod_pocztowy VARCHAR(10),
ADD COLUMN IF NOT EXISTS dzialka_ewidencyjna VARCHAR(100),
ADD COLUMN IF NOT EXISTS obreb_ewidencyjny VARCHAR(100),
ADD COLUMN IF NOT EXISTS data_rozpoczecia_sprzedazy DATE,
ADD COLUMN IF NOT EXISTS data_zakonczenia_budowy DATE,
ADD COLUMN IF NOT EXISTS liczba_budynkow INTEGER,
ADD COLUMN IF NOT EXISTS liczba_lokali INTEGER;

-- ========================================================================
-- 3. PROPERTIES TABLE EXTENSIONS (58 fields total)
-- ========================================================================

-- Location details (required by ministry)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS wojewodztwo VARCHAR(50),
ADD COLUMN IF NOT EXISTS powiat VARCHAR(50),
ADD COLUMN IF NOT EXISTS gmina VARCHAR(100),
ADD COLUMN IF NOT EXISTS miejscowosc VARCHAR(100),
ADD COLUMN IF NOT EXISTS ulica VARCHAR(200),
ADD COLUMN IF NOT EXISTS numer_nieruchomosci VARCHAR(50),
ADD COLUMN IF NOT EXISTS kod_pocztowy VARCHAR(10);

-- Building and apartment details
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS budynek VARCHAR(50),
ADD COLUMN IF NOT EXISTS klatka VARCHAR(20),
ADD COLUMN IF NOT EXISTS kondygnacja INTEGER,
ADD COLUMN IF NOT EXISTS liczba_kondygnacji INTEGER,
ADD COLUMN IF NOT EXISTS liczba_pokoi DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS uklad_mieszkania VARCHAR(50), -- (rozkładowe, nierozkładowe)
ADD COLUMN IF NOT EXISTS stan_wykonczenia VARCHAR(50), -- (deweloperski, pod klucz, do remontu)
ADD COLUMN IF NOT EXISTS rok_budowy INTEGER,
ADD COLUMN IF NOT EXISTS technologia_budowy VARCHAR(100);

-- Surface areas (detailed breakdown)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS powierzchnia_uzytkowa DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS powierzchnia_calkowita DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS powierzchnia_balkon DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS powierzchnia_taras DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS powierzchnia_loggia DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS powierzchnia_ogrod DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS powierzchnia_piwnicy DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS powierzchnia_strychu DECIMAL(8,2);

-- Price details (historical and current)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS cena_za_m2_poczatkowa DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cena_bazowa_poczatkowa DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS cena_finalna_poczatkowa DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS data_pierwszej_oferty DATE,
ADD COLUMN IF NOT EXISTS cena_za_m2_aktualna DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cena_bazowa_aktualna DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS cena_finalna_aktualna DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS data_obowiazywania_ceny_od DATE,
ADD COLUMN IF NOT EXISTS data_obowiazywania_ceny_do DATE,
ADD COLUMN IF NOT EXISTS waluta VARCHAR(3) DEFAULT 'PLN';

-- Additional elements (parking, storage)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS miejsca_postojowe_liczba INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS miejsca_postojowe_nr TEXT[], -- Array of parking spot numbers
ADD COLUMN IF NOT EXISTS miejsca_postojowe_ceny DECIMAL(10,2)[], -- Array of parking prices
ADD COLUMN IF NOT EXISTS miejsca_postojowe_rodzaj VARCHAR(50), -- (garaż, miejsce zewnętrzne, hala)
ADD COLUMN IF NOT EXISTS komorki_lokatorskie_liczba INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS komorki_lokatorskie_nr TEXT[], -- Array of storage unit numbers
ADD COLUMN IF NOT EXISTS komorki_lokatorskie_ceny DECIMAL(10,2)[], -- Array of storage prices
ADD COLUMN IF NOT EXISTS komorki_lokatorskie_powierzchnie DECIMAL(6,2)[]; -- Array of storage areas

-- Amenities and features
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS pomieszczenia_przynalezne JSONB, -- JSON with additional rooms
ADD COLUMN IF NOT EXISTS winda BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS klimatyzacja BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ogrzewanie VARCHAR(50), -- (miejskie, gazowe, elektryczne, etc.)
ADD COLUMN IF NOT EXISTS dostep_dla_niepelnosprawnych BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ekspozycja VARCHAR(50), -- (północ, południe, wschód, zachód)
ADD COLUMN IF NOT EXISTS widok_z_okien VARCHAR(200);

-- Legal and status information
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS status_sprzedazy VARCHAR(50) DEFAULT 'dostępne', -- (dostępne, zarezerwowane, sprzedane)
ADD COLUMN IF NOT EXISTS data_rezerwacji DATE,
ADD COLUMN IF NOT EXISTS data_sprzedazy DATE,
ADD COLUMN IF NOT EXISTS data_przekazania DATE,
ADD COLUMN IF NOT EXISTS forma_wlasnosci VARCHAR(50), -- (pełna własność, spółdzielcze, TBS)
ADD COLUMN IF NOT EXISTS ksiega_wieczysta VARCHAR(50),
ADD COLUMN IF NOT EXISTS udzial_w_gruncie DECIMAL(10,4);

-- Ministry reporting metadata
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS data_pierwszego_raportu DATE,
ADD COLUMN IF NOT EXISTS data_ostatniej_aktualizacji DATE,
ADD COLUMN IF NOT EXISTS liczba_zmian_ceny INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uwagi_ministerstwo TEXT,
ADD COLUMN IF NOT EXISTS uuid_ministerstwo UUID DEFAULT gen_random_uuid();

-- ========================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ========================================================================

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_properties_location
ON properties(wojewodztwo, powiat, gmina, miejscowosc);

-- Index for price queries
CREATE INDEX IF NOT EXISTS idx_properties_price
ON properties(cena_finalna_aktualna, cena_za_m2_aktualna);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_properties_status
ON properties(status_sprzedazy, data_pierwszej_oferty);

-- Index for ministry reporting
CREATE INDEX IF NOT EXISTS idx_properties_ministry
ON properties(uuid_ministerstwo, data_ostatniej_aktualizacji);

-- ========================================================================
-- 5. CREATE PRICE HISTORY TABLE
-- ========================================================================

CREATE TABLE IF NOT EXISTS property_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    cena_za_m2_przed DECIMAL(10,2),
    cena_za_m2_po DECIMAL(10,2),
    cena_bazowa_przed DECIMAL(12,2),
    cena_bazowa_po DECIMAL(12,2),
    cena_finalna_przed DECIMAL(12,2),
    cena_finalna_po DECIMAL(12,2),
    data_zmiany DATE NOT NULL,
    powod_zmiany VARCHAR(500),
    utworzono_przez UUID REFERENCES developers(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_property
ON property_price_history(property_id, data_zmiany DESC);

-- ========================================================================
-- 6. CREATE TRIGGER FOR PRICE CHANGES
-- ========================================================================

CREATE OR REPLACE FUNCTION track_price_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- If price changed, record in history
    IF (OLD.cena_finalna_aktualna IS DISTINCT FROM NEW.cena_finalna_aktualna) OR
       (OLD.cena_za_m2_aktualna IS DISTINCT FROM NEW.cena_za_m2_aktualna) THEN

        INSERT INTO property_price_history (
            property_id,
            cena_za_m2_przed,
            cena_za_m2_po,
            cena_bazowa_przed,
            cena_bazowa_po,
            cena_finalna_przed,
            cena_finalna_po,
            data_zmiany,
            powod_zmiany
        ) VALUES (
            NEW.id,
            OLD.cena_za_m2_aktualna,
            NEW.cena_za_m2_aktualna,
            OLD.cena_bazowa_aktualna,
            NEW.cena_bazowa_aktualna,
            OLD.cena_finalna_aktualna,
            NEW.cena_finalna_aktualna,
            NOW(),
            'Aktualizacja ceny'
        );

        -- Update change counter
        NEW.liczba_zmian_ceny = COALESCE(OLD.liczba_zmian_ceny, 0) + 1;
        NEW.data_ostatniej_aktualizacji = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS track_property_price_changes ON properties;
CREATE TRIGGER track_property_price_changes
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION track_price_changes();

-- ========================================================================
-- 7. CREATE VIEW FOR MINISTRY EXPORT
-- ========================================================================

CREATE OR REPLACE VIEW ministry_export_view AS
SELECT
    -- Developer info
    d.company_name AS nazwa_dewelopera,
    d.forma_prawna,
    d.nip,
    d.regon,
    d.krs,
    d.ceidg,
    d.phone AS telefon,
    d.email,
    d.strona_www,

    -- Developer address
    d.wojewodztwo AS dev_wojewodztwo,
    d.powiat AS dev_powiat,
    d.gmina AS dev_gmina,
    d.miejscowosc AS dev_miejscowosc,
    d.ulica AS dev_ulica,
    d.numer_budynku AS dev_numer_budynku,
    d.numer_lokalu AS dev_numer_lokalu,
    d.kod_pocztowy AS dev_kod_pocztowy,

    -- Project info
    pr.name AS nazwa_inwestycji,
    pr.numer_pozwolenia,
    pr.data_pozwolenia,

    -- Property location
    COALESCE(p.wojewodztwo, pr.wojewodztwo) AS wojewodztwo,
    COALESCE(p.powiat, pr.powiat) AS powiat,
    COALESCE(p.gmina, pr.gmina) AS gmina,
    COALESCE(p.miejscowosc, pr.miejscowosc) AS miejscowosc,
    COALESCE(p.ulica, pr.ulica) AS ulica,
    COALESCE(p.numer_nieruchomosci, pr.numer_nieruchomosci) AS numer_nieruchomosci,
    COALESCE(p.kod_pocztowy, pr.kod_pocztowy) AS kod_pocztowy,

    -- Property details
    p.property_number AS numer_lokalu,
    p.property_type AS rodzaj_nieruchomosci,
    p.budynek,
    p.klatka,
    p.kondygnacja AS pietro,
    p.liczba_pokoi,
    p.powierzchnia_uzytkowa,
    p.powierzchnia_calkowita,

    -- Prices
    p.cena_za_m2_aktualna AS cena_za_m2,
    p.cena_bazowa_aktualna AS cena_bazowa,
    p.cena_finalna_aktualna AS cena_finalna,
    p.waluta,
    p.data_obowiazywania_ceny_od,
    p.data_obowiazywania_ceny_do,

    -- Additional elements
    p.miejsca_postojowe_liczba,
    p.miejsca_postojowe_nr,
    p.miejsca_postojowe_ceny,
    p.komorki_lokatorskie_liczba,
    p.komorki_lokatorskie_nr,
    p.komorki_lokatorskie_ceny,

    -- Status
    p.status_sprzedazy,
    p.data_pierwszej_oferty,
    p.data_rezerwacji,
    p.data_sprzedazy,

    -- Ministry metadata
    p.uuid_ministerstwo,
    p.data_ostatniej_aktualizacji,
    p.liczba_zmian_ceny

FROM properties p
JOIN projects pr ON p.project_id = pr.id
JOIN developers d ON pr.developer_id = d.id
WHERE p.status_sprzedazy != 'archiwalne'
ORDER BY d.company_name, pr.name, p.property_number;

-- ========================================================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ========================================================================

COMMENT ON TABLE property_price_history IS 'Historia zmian cen nieruchomości wymagana przez Ministerstwo';
COMMENT ON VIEW ministry_export_view IS 'Widok do generowania plików XML dla portalu dane.gov.pl';

-- ========================================================================
-- MIGRATION COMPLETE: All 58 ministry fields added
-- ========================================================================