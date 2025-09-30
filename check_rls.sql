-- Check RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('developers', 'properties', 'uploaded_files', 'payments')
ORDER BY tablename;
