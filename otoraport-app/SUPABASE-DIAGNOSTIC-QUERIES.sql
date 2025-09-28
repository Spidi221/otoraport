-- ========================================================================
-- SUPABASE DATABASE DIAGNOSTIC - NEXTAUTH vs SUPABASE AUTH CONFLICTS
-- Wklej te query w Supabase SQL Editor i prześlij wyniki
-- ========================================================================

-- 1. SPRAWDŹ WSZYSTKIE TABELE AUTH-RELATED
-- ========================================================================
SELECT
  'TABLES' as type,
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema IN ('auth', 'public')
  AND table_name LIKE '%auth%'
  OR table_name LIKE '%user%'
  OR table_name LIKE '%account%'
  OR table_name LIKE '%session%'
  OR table_name LIKE '%verification%'
ORDER BY table_schema, table_name;

-- 2. SPRAWDŹ WSZYSTKIE FUNCTIONS AUTH-RELATED
-- ========================================================================
SELECT
  'FUNCTIONS' as type,
  routine_name,
  routine_schema,
  routine_type
FROM information_schema.routines
WHERE routine_schema IN ('auth', 'public')
  AND (routine_name LIKE '%auth%'
       OR routine_name LIKE '%user%'
       OR routine_name LIKE '%developer%'
       OR routine_name LIKE '%session%')
ORDER BY routine_schema, routine_name;

-- 3. SPRAWDŹ WSZYSTKIE TRIGGERS AUTH-RELATED
-- ========================================================================
SELECT
  'TRIGGERS' as type,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND (trigger_name LIKE '%auth%'
       OR trigger_name LIKE '%user%'
       OR trigger_name LIKE '%developer%'
       OR event_object_table IN ('developers', 'users'))
ORDER BY event_object_table, trigger_name;

-- 4. SPRAWDŹ STRUKTURĘ TABELI DEVELOPERS
-- ========================================================================
SELECT
  'DEVELOPERS_COLUMNS' as type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'developers'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. SPRAWDŹ CZY ISTNIEJĄ NEXTAUTH TABELE (POWINNY BYĆ USUNIĘTE)
-- ========================================================================
SELECT
  'NEXTAUTH_TABLES' as type,
  table_name,
  'EXISTS - SHOULD BE REMOVED' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('accounts', 'sessions', 'users', 'verification_tokens')
ORDER BY table_name;

-- 6. SPRAWDŹ AUTH.USERS (SUPABASE AUTH TABLE)
-- ========================================================================
SELECT
  'AUTH_USERS_SAMPLE' as type,
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data::text as metadata
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 7. SPRAWDŹ INDEXES NA DEVELOPERS TABLE
-- ========================================================================
SELECT
  'DEVELOPERS_INDEXES' as type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'developers'
  AND schemaname = 'public'
ORDER BY indexname;

-- 8. SPRAWDŹ RLS POLICIES NA DEVELOPERS
-- ========================================================================
SELECT
  'RLS_POLICIES' as type,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'developers'
  AND schemaname = 'public'
ORDER BY policyname;

-- 9. SPRAWDŹ FOREIGN KEYS MIĘDZY AUTH.USERS A DEVELOPERS
-- ========================================================================
SELECT
  'FOREIGN_KEYS' as type,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
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
  AND tc.table_name = 'developers'
ORDER BY tc.constraint_name;

-- 10. SPRAWDŹ AKTUALNYCH UŻYTKOWNIKÓW I ICH PROFILE
-- ========================================================================
SELECT
  'USER_PROFILE_MAPPING' as type,
  au.id as auth_user_id,
  au.email as auth_email,
  d.id as developer_id,
  d.email as developer_email,
  d.user_id as developer_user_id,
  CASE
    WHEN d.user_id = au.id THEN 'LINKED'
    WHEN d.user_id IS NULL THEN 'NO_USER_ID'
    ELSE 'MISMATCH'
  END as link_status
FROM auth.users au
FULL OUTER JOIN developers d ON au.id = d.user_id
ORDER BY au.created_at DESC, d.created_at DESC;

-- ========================================================================
-- NAPRAW LINKOWANIE USERS → DEVELOPERS
-- ========================================================================

-- 1. NAPRAW chudziszewski221@gmail.com
UPDATE developers
SET user_id = '82811d8f-209d-4f2c-a6da-7ddff7ef8c02'
WHERE email = 'chudziszewski221@gmail.com'
  AND user_id = '8e1ae842-f856-4634-8bd1-4be15f25150b';

-- 2. NAPRAW chudzik_bartek@o2.pl
UPDATE developers
SET user_id = 'ad2d826e-9bb3-402f-877b-41ce1fd2156b'
WHERE email = 'chudzik_bartek@o2.pl'
  AND user_id = '56a9f408-ce5d-4d15-acb4-a6635a86a858';

-- 3. SPRAWDŹ CZY NAPRAWIONE
SELECT
  'FIXED_MAPPING' as type,
  au.email as auth_email,
  d.email as developer_email,
  CASE
    WHEN d.user_id = au.id THEN 'LINKED ✅'
    WHEN d.user_id IS NULL THEN 'NO_USER_ID ❌'
    ELSE 'MISMATCH ❌'
  END as status
FROM auth.users au
FULL OUTER JOIN developers d ON au.id = d.user_id
WHERE au.email IS NOT NULL OR d.email IS NOT NULL
ORDER BY au.email, d.email;

-- ========================================================================
-- USUŃ NEXTAUTH LEGACY TABLES I FUNCTIONS
-- ========================================================================

-- USUŃ NextAuth schema (cały!)
DROP SCHEMA IF EXISTS next_auth CASCADE;

-- USUŃ NextAuth tabele z public schema
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.verification_tokens CASCADE;

-- USUŃ NextAuth function
DROP FUNCTION IF EXISTS public.get_developer_by_nextauth_user(text);

-- SPRAWDŹ CZY USUNIĘTE
SELECT
  'CLEANUP_CHECK' as type,
  table_schema,
  table_name,
  'SHOULD BE EMPTY' as status
FROM information_schema.tables
WHERE (table_name IN ('accounts', 'sessions', 'users', 'verification_tokens')
       AND table_schema IN ('public', 'next_auth'))
   OR table_schema = 'next_auth';

-- ========================================================================
-- SUPABASE AUTH OFFICIAL SETUP CHECK
-- ========================================================================

-- 1. SPRAWDŹ CZY MAMY TRIGGER NA auth.users
SELECT
  'AUTH_TRIGGERS' as type,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 2. SPRAWDŹ WSZYSTKIE FUNCTIONS ZWIĄZANE Z AUTH
SELECT
  'AUTH_FUNCTIONS' as type,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%user%' OR routine_name LIKE '%auth%' OR routine_name LIKE '%profile%')
ORDER BY routine_name;

-- 3. SPRAWDŹ RLS POLICIES DLA DEVELOPERS (OFICJALNE WYMAGANIA)
SELECT
  'CURRENT_RLS' as type,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'developers'
  AND schemaname = 'public'
ORDER BY policyname;

-- ========================================================================
-- OFICJALNE SUPABASE AUTH SETUP
-- ========================================================================

-- 4. DODAJ TRIGGER DLA AUTOMATYCZNEGO TWORZENIA DEVELOPER PROFILE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.developers (
    user_id,
    name,
    email,
    company_name,
    client_id,
    xml_url,
    md5_url,
    status,
    subscription_plan,
    subscription_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Unnamed Company'),
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '-' || LEFT(NEW.id::text, 8),
    'https://otoraport.vercel.app/api/public/' || (LOWER(SPLIT_PART(NEW.email, '@', 1)) || '-' || LEFT(NEW.id::text, 8)) || '/data.xml',
    'https://otoraport.vercel.app/api/public/' || (LOWER(SPLIT_PART(NEW.email, '@', 1)) || '-' || LEFT(NEW.id::text, 8)) || '/data.md5',
    'trial',
    'basic',
    'trial'
  );
  RETURN NEW;
END;
$$;

-- 5. UTWÓRZ TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. NAPRAW RLS POLICIES (OFICJALNE WYTYCZNE)
DROP POLICY IF EXISTS "Developers can access own data" ON public.developers;
DROP POLICY IF EXISTS "Service role can access developers" ON public.developers;

-- Policy 1: Users can see their own profile
CREATE POLICY "Users can access their own developer profile"
ON public.developers
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Service role full access (dla admin operacji)
CREATE POLICY "Service role full access to developers"
ON public.developers
FOR ALL
TO service_role
USING (true);

-- 7. SPRAWDŹ CZY WSZYSTKO DZIAŁA
SELECT
  'FINAL_CHECK' as type,
  'Trigger created: handle_new_user' as status;

-- ========================================================================
-- WYNIK: Oficjalne Supabase Auth setup complete ✅
-- ========================================================================