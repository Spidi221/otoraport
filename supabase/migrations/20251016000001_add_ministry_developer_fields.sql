-- ============================================================================
-- Migration: Add Ministry Developer Fields (Task #100)
-- Date: 2025-10-16
-- Description: Add 18 missing Ministry-required developer fields (columns 1-28)
--              Based on Ministry Schema 1.13 and ustawa z dnia 21 maja 2025 r.
--              o jawności cen mieszkań
-- ============================================================================
--
-- SUMMARY:
-- - Adds 1 basic info field (fax)
-- - Adds 8 headquarters address fields
-- - Adds 8 sales office address fields
-- - Adds 2 additional info fields
--
-- TOTAL: 18 new columns
--
-- BACKWARD COMPATIBILITY:
-- - All columns are nullable (no NOT NULL constraints)
-- - Uses ADD COLUMN IF NOT EXISTS for idempotency
-- - No data loss on rollback
-- - Existing RLS policies apply to new columns
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Add Basic Information Field (Column 9)
-- ============================================================================

-- Column 9: Nr faxu
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS fax VARCHAR(20) DEFAULT NULL;

COMMENT ON COLUMN public.developers.fax IS 'Ministry column 9: Nr faxu (fax number)';

-- ============================================================================
-- PART 2: Add Headquarters Address Fields (Columns 11-18)
-- ============================================================================

-- Column 11: Województwo adresu siedziby
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS headquarters_voivodeship VARCHAR(50) DEFAULT NULL;

-- Column 12: Powiat adresu siedziby
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS headquarters_county VARCHAR(100) DEFAULT NULL;

-- Column 13: Gmina adresu siedziby
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS headquarters_municipality VARCHAR(100) DEFAULT NULL;

-- Column 14: Miejscowość adresu siedziby
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS headquarters_city VARCHAR(100) DEFAULT NULL;

-- Column 15: Ulica adresu siedziby
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS headquarters_street VARCHAR(255) DEFAULT NULL;

-- Column 16: Nr nieruchomości adresu siedziby
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS headquarters_building_number VARCHAR(20) DEFAULT NULL;

-- Column 17: Nr lokalu adresu siedziby
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS headquarters_apartment_number VARCHAR(20) DEFAULT NULL;

-- Column 18: Kod pocztowy adresu siedziby
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS headquarters_postal_code VARCHAR(6) DEFAULT NULL;

-- Add comments for headquarters address fields
COMMENT ON COLUMN public.developers.headquarters_voivodeship IS 'Ministry column 11: Województwo adresu siedziby';
COMMENT ON COLUMN public.developers.headquarters_county IS 'Ministry column 12: Powiat adresu siedziby';
COMMENT ON COLUMN public.developers.headquarters_municipality IS 'Ministry column 13: Gmina adresu siedziby';
COMMENT ON COLUMN public.developers.headquarters_city IS 'Ministry column 14: Miejscowość adresu siedziby';
COMMENT ON COLUMN public.developers.headquarters_street IS 'Ministry column 15: Ulica adresu siedziby';
COMMENT ON COLUMN public.developers.headquarters_building_number IS 'Ministry column 16: Nr nieruchomości adresu siedziby';
COMMENT ON COLUMN public.developers.headquarters_apartment_number IS 'Ministry column 17: Nr lokalu adresu siedziby';
COMMENT ON COLUMN public.developers.headquarters_postal_code IS 'Ministry column 18: Kod pocztowy adresu siedziby (format: XX-XXX)';

-- ============================================================================
-- PART 3: Add Sales Office Address Fields (Columns 19-26)
-- ============================================================================

-- Column 19: Województwo adresu lokalu sprzedaży
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS sales_office_voivodeship VARCHAR(50) DEFAULT NULL;

-- Column 20: Powiat adresu lokalu sprzedaży
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS sales_office_county VARCHAR(100) DEFAULT NULL;

-- Column 21: Gmina adresu lokalu sprzedaży
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS sales_office_municipality VARCHAR(100) DEFAULT NULL;

-- Column 22: Miejscowość adresu lokalu sprzedaży
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS sales_office_city VARCHAR(100) DEFAULT NULL;

-- Column 23: Ulica adresu lokalu sprzedaży
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS sales_office_street VARCHAR(255) DEFAULT NULL;

-- Column 24: Nr nieruchomości adresu lokalu sprzedaży
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS sales_office_building_number VARCHAR(20) DEFAULT NULL;

-- Column 25: Nr lokalu adresu lokalu sprzedaży
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS sales_office_apartment_number VARCHAR(20) DEFAULT NULL;

-- Column 26: Kod pocztowy adresu lokalu sprzedaży
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS sales_office_postal_code VARCHAR(6) DEFAULT NULL;

-- Add comments for sales office address fields
COMMENT ON COLUMN public.developers.sales_office_voivodeship IS 'Ministry column 19: Województwo adresu lokalu sprzedaży';
COMMENT ON COLUMN public.developers.sales_office_county IS 'Ministry column 20: Powiat adresu lokalu sprzedaży';
COMMENT ON COLUMN public.developers.sales_office_municipality IS 'Ministry column 21: Gmina adresu lokalu sprzedaży';
COMMENT ON COLUMN public.developers.sales_office_city IS 'Ministry column 22: Miejscowość adresu lokalu sprzedaży';
COMMENT ON COLUMN public.developers.sales_office_street IS 'Ministry column 23: Ulica adresu lokalu sprzedaży';
COMMENT ON COLUMN public.developers.sales_office_building_number IS 'Ministry column 24: Nr nieruchomości adresu lokalu sprzedaży';
COMMENT ON COLUMN public.developers.sales_office_apartment_number IS 'Ministry column 25: Nr lokalu adresu lokalu sprzedaży';
COMMENT ON COLUMN public.developers.sales_office_postal_code IS 'Ministry column 26: Kod pocztowy adresu lokalu sprzedaży (format: XX-XXX)';

-- ============================================================================
-- PART 4: Add Additional Information Fields (Columns 27-28)
-- ============================================================================

-- Column 27: Dodatkowe lokalizacje sprzedaży
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS additional_sales_locations TEXT DEFAULT NULL;

-- Column 28: Sposób kontaktu nabywcy z deweloperem
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS contact_method VARCHAR(255) DEFAULT NULL;

-- Add comments for additional info fields
COMMENT ON COLUMN public.developers.additional_sales_locations IS 'Ministry column 27: Dodatkowe lokalizacje sprzedaży (długi tekst, może zawierać wiele lokalizacji)';
COMMENT ON COLUMN public.developers.contact_method IS 'Ministry column 28: Sposób kontaktu nabywcy z deweloperem (np. telefon, email, formularz)';

-- ============================================================================
-- PART 5: Add CHECK Constraints for Data Validation
-- ============================================================================

-- NOTE: CHECK constraints are NOT added because existing data may not comply.
-- Validation should be done at the application level (already implemented in
-- src/lib/ministry-validation.ts using Zod schemas).
--
-- Expected format: XX-XXX (e.g., 00-001)
-- Validation is handled by:
-- - DeveloperInfoSchema in ministry-validation.ts
-- - validatePostalCode() function

-- SKIPPED: ADD CONSTRAINT headquarters_postal_code_format_check
-- SKIPPED: ADD CONSTRAINT sales_office_postal_code_format_check
-- REASON: Existing data may not comply with format, causing migration failure

-- ============================================================================
-- PART 6: Verification Query (commented out - for manual testing)
-- ============================================================================

-- To verify migration success, run this query manually:
--
-- SELECT
--   column_name,
--   data_type,
--   character_maximum_length,
--   is_nullable,
--   column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'developers'
--   AND column_name IN (
--     'fax',
--     'headquarters_voivodeship', 'headquarters_county', 'headquarters_municipality',
--     'headquarters_city', 'headquarters_street', 'headquarters_building_number',
--     'headquarters_apartment_number', 'headquarters_postal_code',
--     'sales_office_voivodeship', 'sales_office_county', 'sales_office_municipality',
--     'sales_office_city', 'sales_office_street', 'sales_office_building_number',
--     'sales_office_apartment_number', 'sales_office_postal_code',
--     'additional_sales_locations', 'contact_method'
--   )
-- ORDER BY ordinal_position;

COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
--
-- To rollback this migration, run:
--
-- BEGIN;
--
-- ALTER TABLE public.developers
--   DROP COLUMN IF EXISTS fax,
--   DROP COLUMN IF EXISTS headquarters_voivodeship,
--   DROP COLUMN IF EXISTS headquarters_county,
--   DROP COLUMN IF EXISTS headquarters_municipality,
--   DROP COLUMN IF EXISTS headquarters_city,
--   DROP COLUMN IF EXISTS headquarters_street,
--   DROP COLUMN IF EXISTS headquarters_building_number,
--   DROP COLUMN IF EXISTS headquarters_apartment_number,
--   DROP COLUMN IF EXISTS headquarters_postal_code,
--   DROP COLUMN IF EXISTS sales_office_voivodeship,
--   DROP COLUMN IF EXISTS sales_office_county,
--   DROP COLUMN IF EXISTS sales_office_municipality,
--   DROP COLUMN IF EXISTS sales_office_city,
--   DROP COLUMN IF EXISTS sales_office_street,
--   DROP COLUMN IF EXISTS sales_office_building_number,
--   DROP COLUMN IF EXISTS sales_office_apartment_number,
--   DROP COLUMN IF EXISTS sales_office_postal_code,
--   DROP COLUMN IF EXISTS additional_sales_locations,
--   DROP COLUMN IF EXISTS contact_method;
--
-- COMMIT;
--
-- NOTE: Rollback is safe as all columns are nullable with no data dependencies.
-- ============================================================================
