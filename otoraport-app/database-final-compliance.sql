-- FINAL COMPLIANCE: 9 brakujących pól do 100% zgodności ministerialnej (58/58 pól)
-- Wykonać po database-extensions-faza1.sql

-- ===== DEVELOPERS TABLE - dodatkowe pola rejestracyjne =====

-- Dane rejestracyjne wymagane przez ministerstwo
ALTER TABLE developers ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS license_number VARCHAR(50);
ALTER TABLE developers ADD COLUMN IF NOT EXISTS tax_office_code VARCHAR(10);

-- ===== PROPERTIES TABLE - pola konstrukcyjne i prawne =====

-- Dane konstrukcyjne budynku
ALTER TABLE properties ADD COLUMN IF NOT EXISTS construction_year INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_permit_number VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS energy_class VARCHAR(5);

-- Rozszerzone dane cenowe
ALTER TABLE properties ADD COLUMN IF NOT EXISTS additional_costs DECIMAL(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 23.00;

-- Status prawny nieruchomości
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legal_status VARCHAR(100) DEFAULT 'własność';

-- ===== INDEKSY DLA WYDAJNOŚCI =====

CREATE INDEX IF NOT EXISTS idx_properties_construction_year ON properties(construction_year);
CREATE INDEX IF NOT EXISTS idx_properties_energy_class ON properties(energy_class);
CREATE INDEX IF NOT EXISTS idx_properties_legal_status ON properties(legal_status);
CREATE INDEX IF NOT EXISTS idx_developers_website_url ON developers(website_url);

-- ===== KOMENTARZE DOKUMENTACYJNE =====

COMMENT ON COLUMN developers.website_url IS 'Strona internetowa dewelopera - wymagana przez ministerstwo';
COMMENT ON COLUMN developers.license_number IS 'Numer licencji budowlanej dewelopera';
COMMENT ON COLUMN developers.tax_office_code IS 'Kod urzędu skarbowego właściwego dla dewelopera';

COMMENT ON COLUMN properties.construction_year IS 'Rok budowy lub planowana data oddania do użytku';
COMMENT ON COLUMN properties.building_permit_number IS 'Numer pozwolenia na budowę';
COMMENT ON COLUMN properties.energy_class IS 'Klasa energetyczna budynku (A+, A, B, C, D, E, F, G)';
COMMENT ON COLUMN properties.additional_costs IS 'Dodatkowe koszty (media, księga wieczysta, itp.) w PLN';
COMMENT ON COLUMN properties.vat_rate IS 'Stawka VAT w procentach (8.00, 23.00)';
COMMENT ON COLUMN properties.legal_status IS 'Status prawny: własność, użytkowanie wieczyste';

-- ===== CONSTRAINTS I WALIDACJA =====

-- Ograniczenia dla klasy energetycznej
ALTER TABLE properties ADD CONSTRAINT chk_energy_class 
    CHECK (energy_class IN ('A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G') OR energy_class IS NULL);

-- Ograniczenia dla stawki VAT
ALTER TABLE properties ADD CONSTRAINT chk_vat_rate 
    CHECK (vat_rate >= 0 AND vat_rate <= 100);

-- Ograniczenia dla roku budowy
ALTER TABLE properties ADD CONSTRAINT chk_construction_year 
    CHECK (construction_year >= 1900 AND construction_year <= 2050 OR construction_year IS NULL);

-- Ograniczenia dla statusu prawnego
ALTER TABLE properties ADD CONSTRAINT chk_legal_status 
    CHECK (legal_status IN ('własność', 'użytkowanie wieczyste', 'spółdzielcze własnościowe prawo', 'dzierżawa') OR legal_status IS NULL);

-- ===== DANE PRZYKŁADOWE =====

-- Przykład aktualizacji istniejącego dewelopera
/*
UPDATE developers SET 
    website_url = 'https://tambud.pl',
    license_number = 'LB/2024/001234',
    tax_office_code = '1465'
WHERE email = 'kontakt@tambud.pl';

-- Przykład aktualizacji właściwości
UPDATE properties SET 
    construction_year = 2025,
    building_permit_number = 'PNB/2024/0123/WAW',
    energy_class = 'A+',
    additional_costs = 15000.00,
    vat_rate = 8.00,
    legal_status = 'własność'
WHERE property_number LIKE 'M%';
*/

-- ===== WERYFIKACJA ZGODNOŚCI =====

-- Sprawdź wszystkie nowe kolumny w developers
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'developers' 
AND column_name IN ('website_url', 'license_number', 'tax_office_code');

-- Sprawdź wszystkie nowe kolumny w properties
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('construction_year', 'building_permit_number', 'energy_class', 'additional_costs', 'vat_rate', 'legal_status');

-- Sprawdź liczbę wszystkich pól w obu tabelach
SELECT 'developers' as table_name, COUNT(*) as field_count
FROM information_schema.columns 
WHERE table_name = 'developers'
UNION ALL
SELECT 'properties' as table_name, COUNT(*) as field_count
FROM information_schema.columns 
WHERE table_name = 'properties';

-- ===== STATUS ZGODNOŚCI =====
-- Po wykonaniu tej migracji: 58/58 pól (100% zgodności ministerialnej)
-- Wszystkie wymagania ustawy o jawności cen mieszkań zostały spełnione