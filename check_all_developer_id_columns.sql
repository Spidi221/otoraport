-- Check which tables have developer_id column
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'developer_id'
ORDER BY table_name;

-- Also check for similar columns (user_id, etc)
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name LIKE '%developer%' OR column_name LIKE '%user_id%')
ORDER BY table_name, column_name;