-- ========================================================================
-- TEST WIDOKU MINISTERIALNEGO - sprawdź czy dane są widoczne
-- ========================================================================

-- 1. Sprawdź czy widok zwraca dane
SELECT COUNT(*) as records_in_ministry_view FROM ministry_export_view;

-- 2. Sprawdź konkretne dane z widoku
SELECT
    nazwa_dewelopera,
    nazwa_inwestycji,
    numer_lokalu,
    powierzchnia_uzytkowa,
    cena_bazowa,
    wojewodztwo,
    status_dostepnosci
FROM ministry_export_view
ORDER BY numer_lokalu;

-- 3. Sprawdź bezpośrednio z tabel czy dane istnieją
SELECT
    d.company_name,
    d.client_id,
    pr.name as project_name,
    COUNT(p.id) as properties_count
FROM developers d
LEFT JOIN projects pr ON pr.developer_id = d.id
LEFT JOIN properties p ON p.project_id = pr.id
WHERE d.client_id = 'rolbestcompany123'
GROUP BY d.id, d.company_name, d.client_id, pr.id, pr.name;

-- 4. Sprawdź szczegóły powiązań
SELECT
    'developers' as table_name,
    COUNT(*) as count
FROM developers
WHERE client_id = 'rolbestcompany123'
UNION ALL
SELECT
    'projects' as table_name,
    COUNT(*) as count
FROM projects pr
JOIN developers d ON pr.developer_id = d.id
WHERE d.client_id = 'rolbestcompany123'
UNION ALL
SELECT
    'properties' as table_name,
    COUNT(*) as count
FROM properties p
JOIN projects pr ON p.project_id = pr.id
JOIN developers d ON pr.developer_id = d.id
WHERE d.client_id = 'rolbestcompany123';