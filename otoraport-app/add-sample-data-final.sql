-- ========================================================================
-- DODANIE PRZYKŁADOWYCH DANYCH (FINALNA WERSJA - zgodna z rzeczywistą strukturą)
-- ========================================================================

-- 1. Sprawdź strukturę tabeli projects
SELECT column_name FROM information_schema.columns WHERE table_name = 'projects';

-- 2. Dodaj projekt dla pierwszego dewelopera
DO $$
DECLARE
    developer_uuid UUID;
    project_uuid UUID;
BEGIN
    -- Znajdź pierwszego dewelopera (Rol Best)
    SELECT id INTO developer_uuid
    FROM developers
    WHERE company_name = 'Rol Best'
    LIMIT 1;

    -- Jeśli nie ma dewelopera, użyj pierwszego dostępnego
    IF developer_uuid IS NULL THEN
        SELECT id INTO developer_uuid
        FROM developers
        LIMIT 1;
    END IF;

    -- Wstaw projekt testowy (tylko z kolumnami które istnieją)
    INSERT INTO projects (
        id,
        developer_id,
        name,
        location,
        status,
        created_at
    ) VALUES (
        gen_random_uuid(),
        developer_uuid,
        'Apartamenty Testera',
        'Warszawa, Mokotów, ul. Testowa 123',
        'active',
        NOW()
    ) RETURNING id INTO project_uuid;

    RAISE NOTICE 'Stworzono projekt: %', project_uuid;

    -- Dodaj 3 przykładowe mieszkania z pełnymi danymi ministerialnymi
    INSERT INTO properties (
        -- Basic fields
        id,
        project_id,
        apartment_number,
        property_type,
        surface_area,
        price_per_m2,
        base_price,
        final_price,
        status,

        -- Ministry location fields
        wojewodztwo,
        powiat,
        gmina,
        miejscowosc,
        ulica,
        numer_nieruchomosci,
        kod_pocztowy,

        -- Property details
        kondygnacja,
        liczba_pokoi,
        powierzchnia_balkon,
        powierzchnia_taras,

        -- Dates
        data_pierwszej_oferty,
        price_valid_from,
        price_valid_to,

        -- Status
        status_dostepnosci,

        -- Building details
        typ_budynku,
        rok_budowy,
        klasa_energetyczna,
        system_grzewczy,
        standard_wykonczenia,
        dostep_dla_niepelnosprawnych,

        -- Timestamps
        created_at,
        updated_at,
        ministry_compliant,
        xml_generated
    ) VALUES
    -- Mieszkanie 1
    (
        gen_random_uuid(),
        project_uuid,
        'A-01',
        'mieszkanie',
        50.0,
        15000.00,
        750000.00,
        780000.00,
        'dostępne',

        'mazowieckie',
        'warszawski',
        'Warszawa',
        'Warszawa',
        'ul. Testowa',
        '123',
        '02-123',

        1,
        2.0,
        6.5,
        NULL,

        '2025-01-01',
        '2025-01-01',
        '2025-12-31',

        'dostępne',

        'budynek mieszkalny wielorodzinny',
        2025,
        'A',
        'miejskie',
        'deweloperski',
        false,

        NOW(),
        NOW(),
        true,
        false
    ),
    -- Mieszkanie 2
    (
        gen_random_uuid(),
        project_uuid,
        'A-02',
        'mieszkanie',
        60.0,
        14000.00,
        840000.00,
        860000.00,
        'dostępne',

        'mazowieckie',
        'warszawski',
        'Warszawa',
        'Warszawa',
        'ul. Testowa',
        '123',
        '02-123',

        2,
        3.0,
        8.0,
        5.0,

        '2025-01-01',
        '2025-01-01',
        '2025-12-31',

        'dostępne',

        'budynek mieszkalny wielorodzinny',
        2025,
        'A',
        'miejskie',
        'deweloperski',
        true,

        NOW(),
        NOW(),
        true,
        false
    ),
    -- Mieszkanie 3
    (
        gen_random_uuid(),
        project_uuid,
        'B-01',
        'mieszkanie',
        70.0,
        16000.00,
        1120000.00,
        1150000.00,
        'zarezerwowane',

        'mazowieckie',
        'warszawski',
        'Warszawa',
        'Warszawa',
        'ul. Testowa',
        '123',
        '02-123',

        3,
        4.0,
        10.0,
        NULL,

        '2025-01-01',
        '2025-01-01',
        '2025-12-31',

        'zarezerwowane',

        'budynek mieszkalny wielorodzinny',
        2025,
        'B+',
        'miejskie',
        'premium',
        true,

        NOW(),
        NOW(),
        true,
        false
    );

    RAISE NOTICE 'Dodano 3 przykładowe mieszkania z pełnymi danymi ministerialnymi';

END $$;

-- 3. Sprawdź czy dane zostały dodane
SELECT
    'projects' as table_name,
    COUNT(*) as count
FROM projects
UNION ALL
SELECT
    'properties' as table_name,
    COUNT(*) as count
FROM properties;

-- 4. Test widoku ministerialnego
SELECT COUNT(*) as ministry_view_records FROM ministry_export_view;

-- 5. Pokaż kompletne dane z widoku ministerialnego
SELECT
    nazwa_dewelopera,
    nazwa_inwestycji,
    numer_lokalu,
    powierzchnia_uzytkowa,
    cena_za_m2,
    cena_bazowa,
    wojewodztwo,
    powiat,
    gmina,
    miejscowosc,
    ulica,
    kod_pocztowy,
    status_dostepnosci,
    klasa_energetyczna,
    ministry_compliant
FROM ministry_export_view
ORDER BY numer_lokalu;

-- 6. Sprawdź client_id deweloperów (dla API testing)
SELECT
    company_name,
    client_id,
    subscription_status
FROM developers
ORDER BY created_at DESC;

-- ========================================================================
-- SUKCES! Teraz masz pełne dane ministerialne gotowe do testowania
-- ========================================================================