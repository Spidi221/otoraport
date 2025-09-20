
-- Sprawdź istniejące konta dla chudziszewski221@gmail.com
SELECT 
  'auth.users' as table_name,
  id, 
  email, 
  provider,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'chudziszewski221@gmail.com'

UNION ALL

SELECT 
  'developers' as table_name,
  id::text, 
  email, 
  'manual'::text as provider,
  created_at,
  updated_at
FROM developers 
WHERE email = 'chudziszewski221@gmail.com';

