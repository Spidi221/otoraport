-- ==============================================
-- FIXED RLS SETUP - Based on actual table structure
-- ==============================================
--
-- From check_all_developer_id_columns.sql we know:
-- - developers: has user_id (NOT developer_id)
-- - properties: likely has project_id → projects → developer_id
-- - payments, uploaded_files, projects: have developer_id
--

-- 1. Enable RLS on all core tables
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- DROP EXISTING POLICIES
-- ==============================================

-- Developers
DROP POLICY IF EXISTS "Developers can view own profile" ON developers;
DROP POLICY IF EXISTS "Developers can update own profile" ON developers;
DROP POLICY IF EXISTS "Service role full access to developers" ON developers;

-- Projects
DROP POLICY IF EXISTS "Developers can view own projects" ON projects;
DROP POLICY IF EXISTS "Developers can insert own projects" ON projects;
DROP POLICY IF EXISTS "Developers can update own projects" ON projects;
DROP POLICY IF EXISTS "Developers can delete own projects" ON projects;
DROP POLICY IF EXISTS "Service role full access to projects" ON projects;

-- Properties (through projects)
DROP POLICY IF EXISTS "Developers can view own properties" ON properties;
DROP POLICY IF EXISTS "Developers can insert own properties" ON properties;
DROP POLICY IF EXISTS "Developers can update own properties" ON properties;
DROP POLICY IF EXISTS "Developers can delete own properties" ON properties;
DROP POLICY IF EXISTS "Service role full access to properties" ON properties;

-- Uploaded files
DROP POLICY IF EXISTS "Developers can view own files" ON uploaded_files;
DROP POLICY IF EXISTS "Developers can insert own files" ON uploaded_files;
DROP POLICY IF EXISTS "Developers can update own files" ON uploaded_files;
DROP POLICY IF EXISTS "Developers can delete own files" ON uploaded_files;
DROP POLICY IF EXISTS "Service role full access to uploaded_files" ON uploaded_files;

-- Payments
DROP POLICY IF EXISTS "Developers can view own payments" ON payments;
DROP POLICY IF EXISTS "Developers can insert own payments" ON payments;
DROP POLICY IF EXISTS "Service role full access to payments" ON payments;

-- ==============================================
-- CREATE POLICIES
-- ==============================================

-- ============ DEVELOPERS TABLE ============
-- Uses user_id (NOT developer_id)

CREATE POLICY "Developers can view own profile"
ON developers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Developers can update own profile"
ON developers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to developers"
ON developers FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============ PROJECTS TABLE ============
-- Has developer_id directly

CREATE POLICY "Developers can view own projects"
ON projects FOR SELECT
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Developers can insert own projects"
ON projects FOR INSERT
WITH CHECK (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Developers can update own projects"
ON projects FOR UPDATE
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Developers can delete own projects"
ON projects FOR DELETE
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access to projects"
ON projects FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============ PROPERTIES TABLE ============
-- Has project_id → need to join through projects

CREATE POLICY "Developers can view own properties"
ON properties FOR SELECT
USING (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN developers d ON p.developer_id = d.id
    WHERE d.user_id = auth.uid()
  )
);

CREATE POLICY "Developers can insert own properties"
ON properties FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN developers d ON p.developer_id = d.id
    WHERE d.user_id = auth.uid()
  )
);

CREATE POLICY "Developers can update own properties"
ON properties FOR UPDATE
USING (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN developers d ON p.developer_id = d.id
    WHERE d.user_id = auth.uid()
  )
);

CREATE POLICY "Developers can delete own properties"
ON properties FOR DELETE
USING (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN developers d ON p.developer_id = d.id
    WHERE d.user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access to properties"
ON properties FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============ UPLOADED_FILES TABLE ============
-- Has developer_id directly

CREATE POLICY "Developers can view own files"
ON uploaded_files FOR SELECT
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Developers can insert own files"
ON uploaded_files FOR INSERT
WITH CHECK (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Developers can update own files"
ON uploaded_files FOR UPDATE
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Developers can delete own files"
ON uploaded_files FOR DELETE
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access to uploaded_files"
ON uploaded_files FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============ PAYMENTS TABLE ============
-- Has developer_id directly

CREATE POLICY "Developers can view own payments"
ON payments FOR SELECT
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Developers can insert own payments"
ON payments FOR INSERT
WITH CHECK (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access to payments"
ON payments FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ==============================================
-- VERIFICATION
-- ==============================================

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('developers', 'projects', 'properties', 'uploaded_files', 'payments')
ORDER BY tablename;

-- Show all policies
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('developers', 'projects', 'properties', 'uploaded_files', 'payments')
ORDER BY tablename, policyname;