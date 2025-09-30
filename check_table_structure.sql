-- Check structure of all tables to verify columns exist
-- Run this FIRST to see what columns you actually have

-- Check uploaded_files table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'uploaded_files'
ORDER BY ordinal_position;

-- Check if uploaded_files table exists at all
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'uploaded_files'
) as table_exists;

-- List all tables in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;