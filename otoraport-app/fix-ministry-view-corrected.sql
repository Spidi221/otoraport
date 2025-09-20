-- ========================================================================
-- NAPRAWA WIDOKU MINISTERSTWA - Dopasowanie do rzeczywistej struktury tabeli
-- ========================================================================

-- Usuń stary widok jeśli istnieje
DROP VIEW IF EXISTS ministry_export_view;

-- Stwórz nowy widok z poprawnymi nazwami kolumn
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

    -- Property location
    COALESCE(p.wojewodztwo, 'mazowieckie') AS wojewodztwo,
    COALESCE(p.powiat, 'warszawski') AS powiat,
    COALESCE(p.gmina, 'Warszawa') AS gmina,
    COALESCE(p.miejscowosc, 'Warszawa') AS miejscowosc,
    COALESCE(p.ulica, 'ul. Przykładowa') AS ulica,
    COALESCE(p.numer_nieruchomosci, '1') AS numer_nieruchomosci,
    COALESCE(p.kod_pocztowy, '00-001') AS kod_pocztowy,

    -- Property details (FIXED: używamy apartment_number zamiast property_number)
    p.apartment_number AS numer_lokalu,
    p.property_type AS rodzaj_nieruchomosci,
    p.kondygnacja AS pietro,
    p.liczba_pokoi,

    -- Surface areas (FIXED: używamy surface_area zamiast area)
    p.surface_area AS powierzchnia_uzytkowa,
    p.powierzchnia_balkon,
    p.powierzchnia_taras,
    p.powierzchnia_loggia,
    p.powierzchnia_ogrod,

    -- Prices (FIXED: używamy base_price zamiast total_price)
    p.price_per_m2 AS cena_za_m2,
    p.base_price AS cena_bazowa,
    p.final_price AS cena_finalna,
    p.cena_za_m2_poczatkowa,
    p.cena_bazowa_poczatkowa,

    -- Dates
    p.data_pierwszej_oferty,
    p.price_valid_from AS data_obowiazywania_ceny_od,
    p.price_valid_to AS data_obowiazywania_ceny_do,
    p.data_rezerwacji,
    p.data_sprzedazy,

    -- Additional elements
    p.miejsca_postojowe_nr,
    p.miejsca_postojowe_ceny,
    p.komorki_nr,
    p.komorki_ceny,
    p.pomieszczenia_przynalezne,

    -- Building details
    p.typ_budynku,
    p.rok_budowy,
    p.klasa_energetyczna,
    p.system_grzewczy,
    p.standard_wykonczenia,
    p.dostep_dla_niepelnosprawnych,

    -- Status
    COALESCE(p.status_dostepnosci, p.status, 'dostępne') AS status_dostepnosci,
    p.powod_zmiany_ceny,
    p.uwagi,

    -- Ministry metadata
    COALESCE(p.last_price_change, p.updated_at) AS data_ostatniej_aktualizacji,
    COALESCE(p.ministry_compliant, false) AS ministry_compliant,
    COALESCE(p.xml_generated, false) AS xml_generated

FROM properties p
JOIN projects pr ON p.project_id = pr.id
JOIN developers d ON pr.developer_id = d.id
WHERE p.status != 'archiwalne' OR p.status IS NULL
ORDER BY d.company_name, pr.name, p.apartment_number;

-- Test widoku
SELECT COUNT(*) as total_properties_in_view FROM ministry_export_view;

-- Sprawdź przykładowe dane
SELECT
    nazwa_dewelopera,
    numer_lokalu,
    powierzchnia_uzytkowa,
    cena_za_m2,
    cena_finalna,
    wojewodztwo,
    status_dostepnosci
FROM ministry_export_view
LIMIT 5;

-- ========================================================================
-- AKTUALIZACJA TYPESCRIPTU - informacja dla dewelopera
-- ========================================================================

/*
⚠️  UWAGA: Po uruchomieniu tego skryptu zaktualizuj TypeScript types!

W pliku src/lib/supabase.ts zmień:
- property_number → apartment_number
- area → surface_area
- total_price → base_price

Przykład:
```typescript
properties: {
  Row: {
    id: string
    project_id: string
    apartment_number: string    // ← ZMIENIONE z property_number
    property_type: string
    surface_area: number        // ← ZMIENIONE z area
    price_per_m2: number
    base_price: number          // ← ZMIENIONE z total_price
    final_price: number | null
    // ... reszta pól
  }
}
```
*/

-- Komunikat o ukończeniu (jako komentarz)
-- Ministry view updated successfully! ✅
-- Remember to update TypeScript types in src/lib/supabase.ts