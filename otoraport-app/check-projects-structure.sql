-- ========================================================================
-- SPRAWDŹ RZECZYWISTĄ STRUKTURĘ TABELI PROJECTS
-- ========================================================================

-- Sprawdź kolumny w tabeli projects
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Sprawdź także kolumny w tabeli properties
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;