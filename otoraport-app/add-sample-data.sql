-- ========================================================================
-- DODANIE PRZYKŁADOWYCH DANYCH DO TESTOWANIA
-- ========================================================================

-- 1. Dodaj projekt dla pierwszego dewelopera
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

    -- Wstaw projekt testowy
    INSERT INTO projects (
        id,
        developer_id,
        name,
        location,
        address,
        status,
        created_at
    ) VALUES (
        gen_random_uuid(),
        developer_uuid,
        'Apartamenty Testera',
        'Warszawa, Mokotów',
        'ul. Testowa 123, 02-123 Warszawa',
        'active',
        NOW()
    ) RETURNING id INTO project_uuid;

    RAISE NOTICE 'Stworzono projekt: %', project_uuid;

    -- Dodaj 3 przykładowe mieszkania
    INSERT INTO properties (
        id,
        project_id,
        apartment_number,
        property_type,
        price_per_m2,
        base_price,
        final_price,
        surface_area,
        parking_space,
        parking_price,
        status,
        raw_data,
        -- Ministry fields
        wojewodztwo,
        powiat,
        gmina,
        miejscowosc,
        ulica,
        numer_nieruchomosci,
        kod_pocztowy,
        kondygnacja,
        liczba_pokoi,
        powierzchnia_balkon,
        data_pierwszej_oferty,
        price_valid_from,
        price_valid_to,
        status_dostepnosci,
        created_at,
        updated_at
    ) VALUES
    -- Mieszkanie 1
    (
        gen_random_uuid(),
        project_uuid,
        'A-01',
        'mieszkanie',
        15000.00,
        750000.00,
        780000.00,
        50.0,
        'G-01',
        25000.00,
        'dostępne',
        '{"floor": 1, "rooms": 2}',
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
        '2025-01-01',
        '2025-01-01',
        '2025-12-31',
        'dostępne',
        NOW(),
        NOW()
    ),
    -- Mieszkanie 2
    (
        gen_random_uuid(),
        project_uuid,
        'A-02',
        'mieszkanie',
        14000.00,
        840000.00,
        860000.00,
        60.0,
        'G-02',
        25000.00,
        'dostępne',
        '{"floor": 2, "rooms": 3}',
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
        '2025-01-01',
        '2025-01-01',
        '2025-12-31',
        'dostępne',
        NOW(),
        NOW()
    ),
    -- Mieszkanie 3
    (
        gen_random_uuid(),
        project_uuid,
        'B-01',
        'mieszkanie',
        16000.00,
        1120000.00,
        1150000.00,
        70.0,
        NULL,
        NULL,
        'zarezerwowane',
        '{"floor": 3, "rooms": 4}',
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
        '2025-01-01',
        '2025-01-01',
        '2025-12-31',
        'zarezerwowane',
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Dodano 3 przykładowe mieszkania';

END $$;

-- 2. Sprawdź czy dane zostały dodane
SELECT COUNT(*) as projects_added FROM projects;
SELECT COUNT(*) as properties_added FROM properties;

-- 3. Przetestuj widok ministerialny
SELECT COUNT(*) as ministry_view_count FROM ministry_export_view;

-- 4. Pokaż przykładowe dane z widoku
SELECT
    nazwa_dewelopera,
    nazwa_inwestycji,
    numer_lokalu,
    powierzchnia_uzytkowa,
    cena_za_m2,
    cena_bazowa,
    wojewodztwo,
    status_dostepnosci
FROM ministry_export_view
LIMIT 5;

-- 5. Sprawdź client_id deweloperów (dla testowania API)
SELECT
    company_name,
    client_id,
    subscription_status
FROM developers
WHERE company_name IN ('Rol Best', 'Bartek', 'Bartek Chudzik');

-- ========================================================================
-- SUKCES! Teraz możesz testować endpointy z prawdziwymi danymi
-- ========================================================================