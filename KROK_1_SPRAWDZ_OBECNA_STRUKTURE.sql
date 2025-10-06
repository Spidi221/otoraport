-- ============================================
-- OTORAPORT V2 - KROK 1: SPRAWDZENIE OBECNEJ STRUKTURY BAZY
-- ============================================
-- Wykonaj ten SQL w Supabase SQL Editor
-- Pokaże wszystkie tabele i kolumny które obecnie masz
-- ============================================

-- 1. LISTA WSZYSTKICH TABEL W SCHEMACIE PUBLIC
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. STRUKTURA TABELI: developers
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'developers'
ORDER BY ordinal_position;

-- 3. STRUKTURA TABELI: properties
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'properties'
ORDER BY ordinal_position;

-- 4. STRUKTURA TABELI: projects (jeśli istnieje)
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
ORDER BY ordinal_position;

-- 5. SPRAWDZENIE RLS (Row Level Security)
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. LISTA WSZYSTKICH RLS POLICIES
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
ORDER BY tablename, policyname;

-- 7. INDEKSY NA TABELACH
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 8. FOREIGN KEYS (klucze obce)
SELECT
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
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 9. LICZBA REKORDÓW W KAŻDEJ TABELI
SELECT
  'developers' as table_name,
  COUNT(*) as record_count
FROM developers
UNION ALL
SELECT
  'properties' as table_name,
  COUNT(*) as record_count
FROM properties
UNION ALL
SELECT
  'projects' as table_name,
  COUNT(*) as record_count
FROM projects;

-- ============================================
-- KONIEC SPRAWDZENIA
-- ============================================
-- Skopiuj wyniki i wklej do czatu, abym mógł
-- zobaczyć dokładnie co masz w bazie
-- ============================================
