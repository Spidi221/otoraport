-- ========================================================================
-- DIAGNOZA BAZY DANYCH - sprawdź co jest w tabelach
-- ========================================================================

-- 1. Sprawdź liczbę deweloperów
SELECT 'developers' as table_name, COUNT(*) as count FROM developers
UNION ALL
-- 2. Sprawdź liczbę projektów
SELECT 'projects' as table_name, COUNT(*) as count FROM projects
UNION ALL
-- 3. Sprawdź liczbę właściwości
SELECT 'properties' as table_name, COUNT(*) as count FROM properties;

-- 4. Sprawdź przykładowych deweloperów (jeśli istnieją)
SELECT
    id,
    company_name,
    client_id,
    subscription_status,
    created_at
FROM developers
LIMIT 3;

-- 5. Sprawdź przykładowe projekty (jeśli istnieją)
SELECT
    id,
    developer_id,
    name,
    status,
    created_at
FROM projects
LIMIT 3;

-- 6. Sprawdź przykładowe właściwości (jeśli istnieją)
SELECT
    id,
    project_id,
    apartment_number,
    property_type,
    surface_area,
    base_price,
    status,
    created_at
FROM properties
LIMIT 3;

-- 7. Sprawdź powiązania między tabelami
SELECT
    d.company_name,
    COUNT(pr.id) as projects_count,
    COUNT(p.id) as properties_count
FROM developers d
LEFT JOIN projects pr ON pr.developer_id = d.id
LEFT JOIN properties p ON p.project_id = pr.id
GROUP BY d.id, d.company_name
ORDER BY d.created_at DESC;