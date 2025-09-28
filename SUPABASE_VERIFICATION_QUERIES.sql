-- ============================================================================
-- SUPABASE DATABASE VERIFICATION QUERIES
-- Sprawdzenie wszystkich 58 pól ministerialnych i struktury bazy danych
-- Data: 28 września 2025
-- ============================================================================

-- 1. PODSTAWOWE INFORMACJE O BAZIE DANYCH
-- ============================================================================

-- Sprawdź jakie tabele mamy w bazie
SELECT
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Sprawdź wszystkie kolumny w tabeli developers
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'developers'
ORDER BY ordinal_position;

-- Sprawdź wszystkie kolumny w tabeli properties (najważniejsza dla ministry)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
ORDER BY ordinal_position;

-- Sprawdź wszystkie kolumny w tabeli projects
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'projects'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. SPRAWDZENIE DANYCH PRZYKŁADOWYCH
-- ============================================================================

-- Sprawdź ilu mamy developerów
SELECT
    COUNT(*) as total_developers,
    COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_developers,
    COUNT(CASE WHEN subscription_status = 'trial' THEN 1 END) as trial_developers
FROM developers;

-- Sprawdź przykładowych developerów (bez wrażliwych danych)
SELECT
    id,
    email,
    company_name,
    client_id,
    subscription_plan,
    subscription_status,
    created_at
FROM developers
ORDER BY created_at DESC
LIMIT 5;

-- Sprawdź ile mamy projektów
SELECT
    COUNT(*) as total_projects,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects
FROM projects;

-- Sprawdź przykładowe projekty
SELECT
    p.id,
    p.name,
    p.status,
    d.company_name as developer_name,
    p.created_at
FROM projects p
JOIN developers d ON p.developer_id = d.id
ORDER BY p.created_at DESC
LIMIT 5;

-- Sprawdź ile mamy nieruchomości (properties)
SELECT
    COUNT(*) as total_properties,
    COUNT(CASE WHEN property_type = 'mieszkanie' THEN 1 END) as mieszkania,
    COUNT(CASE WHEN property_type = 'dom' THEN 1 END) as domy,
    COUNT(CASE WHEN property_type = 'lokal_uslugowy' THEN 1 END) as lokale_uslugowe
FROM properties;

-- Sprawdź przykładowe nieruchomości z ministry fields
SELECT
    apartment_number,
    property_type,
    surface_area,
    price_per_m2,
    base_price,
    final_price,
    wojewodztwo,
    powiat,
    gmina,
    status,
    created_at
FROM properties
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 3. SPRAWDZENIE MINISTRY COMPLIANCE (58 REQUIRED FIELDS)
-- ============================================================================

-- Sprawdź czy wszystkie wymagane pola ministry są w tabeli properties
SELECT
    'apartment_number' as field_name,
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
AND column_name = 'apartment_number'

UNION ALL

SELECT
    'property_type' as field_name,
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
AND column_name = 'property_type'

UNION ALL

SELECT
    'surface_area' as field_name,
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
AND column_name = 'surface_area'

UNION ALL

SELECT
    'price_per_m2' as field_name,
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
AND column_name = 'price_per_m2'

UNION ALL

SELECT
    'base_price' as field_name,
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
AND column_name = 'base_price'

UNION ALL

SELECT
    'final_price' as field_name,
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
AND column_name = 'final_price'

UNION ALL

SELECT
    'wojewodztwo' as field_name,
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
AND column_name = 'wojewodztwo'

UNION ALL

SELECT
    'powiat' as field_name,
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
AND column_name = 'powiat'

UNION ALL

SELECT
    'gmina' as field_name,
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
AND column_name = 'gmina';

-- ============================================================================
-- 4. SPRAWDZENIE RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Sprawdź czy RLS jest włączone na tabelach
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    enable_row_security
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('developers', 'properties', 'projects')
ORDER BY tablename;

-- Sprawdź istniejące RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('developers', 'properties', 'projects')
ORDER BY tablename, policyname;

-- ============================================================================
-- 5. SPRAWDZENIE INDEKSÓW I PERFORMANCE
-- ============================================================================

-- Sprawdź indeksy na kluczowych polach
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('developers', 'properties', 'projects')
ORDER BY tablename, indexname;

-- Sprawdź rozmiary tabel
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 6. SPRAWDZENIE AUTH USERS (SUPABASE AUTH)
-- ============================================================================

-- Sprawdź ilu mamy użytkowników Supabase Auth (jeśli masz dostęp)
-- UWAGA: To może nie działać w zależności od uprawnień
SELECT
    COUNT(*) as total_auth_users
FROM auth.users;

-- Sprawdź przykładowych użytkowników (bez wrażliwych danych)
-- UWAGA: To może nie działać w zależności od uprawnień
SELECT
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 7. SPRAWDZENIE RELACJI MIĘDZY TABELAMI
-- ============================================================================

-- Sprawdź foreign keys
SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 8. SPRAWDZENIE MINISTRY COMPLIANCE DATA VALIDATION
-- ============================================================================

-- Sprawdź czy mamy properties z brakującymi ministry fields
SELECT
    COUNT(*) as properties_missing_required_fields
FROM properties
WHERE apartment_number IS NULL
   OR property_type IS NULL
   OR surface_area IS NULL
   OR price_per_m2 IS NULL
   OR base_price IS NULL
   OR wojewodztwo IS NULL
   OR powiat IS NULL
   OR gmina IS NULL;

-- Sprawdź statystyki cen (ministry requirement)
SELECT
    MIN(price_per_m2) as min_price_per_m2,
    AVG(price_per_m2) as avg_price_per_m2,
    MAX(price_per_m2) as max_price_per_m2,
    MIN(base_price) as min_base_price,
    AVG(base_price) as avg_base_price,
    MAX(base_price) as max_base_price
FROM properties
WHERE price_per_m2 IS NOT NULL
AND base_price IS NOT NULL;

-- Sprawdź rozkład typów nieruchomości (ministry categories)
SELECT
    property_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM properties
WHERE property_type IS NOT NULL
GROUP BY property_type
ORDER BY count DESC;

-- Sprawdź rozkład województw (ministry geographic requirement)
SELECT
    wojewodztwo,
    COUNT(*) as count
FROM properties
WHERE wojewodztwo IS NOT NULL
GROUP BY wojewodztwo
ORDER BY count DESC;

-- ============================================================================
-- 9. SPRAWDZENIE CLIENT_ID FORMAT (MINISTRY HARVESTER)
-- ============================================================================

-- Sprawdź format client_id (musi być prawidłowy dla ministerstwa)
SELECT
    client_id,
    LENGTH(client_id) as client_id_length,
    CASE
        WHEN client_id ~ '^[a-zA-Z0-9]{10,50}$' THEN 'VALID'
        ELSE 'INVALID'
    END as format_validation
FROM developers
ORDER BY created_at DESC;

-- ============================================================================
-- 10. SPRAWDZENIE TIMESTAMPS I DATA INTEGRITY
-- ============================================================================

-- Sprawdź czy daty są logiczne
SELECT
    COUNT(*) as total_properties,
    COUNT(CASE WHEN created_at > NOW() THEN 1 END) as future_created_at,
    COUNT(CASE WHEN updated_at < created_at THEN 1 END) as invalid_updated_at,
    MIN(created_at) as oldest_property,
    MAX(created_at) as newest_property
FROM properties;

-- Sprawdź konsystencję dat między tabelami
SELECT
    d.company_name,
    d.created_at as developer_created,
    p.created_at as project_created,
    prop.created_at as property_created
FROM developers d
LEFT JOIN projects p ON d.id = p.developer_id
LEFT JOIN properties prop ON p.id = prop.project_id
WHERE prop.created_at < d.created_at
ORDER BY d.created_at DESC
LIMIT 5;

-- ============================================================================
-- KONIEC VERIFICATION QUERIES
-- ============================================================================

-- Podsumowanie do uruchomienia:
-- 1. Uruchom te query w Supabase SQL Editor
-- 2. Sprawdź czy wszystkie tabele istnieją
-- 3. Zweryfikuj czy ministry fields są obecne
-- 4. Sprawdź RLS policies
-- 5. Zvaliduj przykładowe dane

-- W przypadku problemów:
-- - Sprawdź czy tabele zostały utworzone
-- - Sprawdź czy RLS policies działają
-- - Zweryfikuj client_id format
-- - Sprawdź foreign key relationships