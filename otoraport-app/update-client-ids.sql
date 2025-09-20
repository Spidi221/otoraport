-- ========================================================================
-- AKTUALIZACJA CLIENT_ID na dłuższe wartości (min 10 znaków)
-- ========================================================================

-- Zaktualizuj client_id dla deweloperów na dłuższe wartości
UPDATE developers
SET client_id = 'rolbestcompany123'
WHERE company_name = 'Rol Best';

UPDATE developers
SET client_id = 'chudzikbartek456'
WHERE company_name = 'Bartek';

UPDATE developers
SET client_id = 'chudziszewski789'
WHERE company_name = 'Bartek Chudzik';

-- Sprawdź zaktualizowane client_id
SELECT
    company_name,
    client_id,
    subscription_status,
    LENGTH(client_id) as client_id_length
FROM developers
ORDER BY created_at DESC;