-- ==============================================
-- ENABLE ROW LEVEL SECURITY (RLS) FOR ALL TABLES
-- Priority: P0 SECURITY CRITICAL
-- ==============================================
--
-- This script enables RLS on all core tables and creates policies
-- to ensure developers can only access their own data.
--
-- Run this in Supabase SQL Editor
--

-- 1. Enable RLS on developers table (1.1)
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on uploaded_files table (1.2)
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- CREATE RLS POLICIES
-- ==============================================

-- ============ DEVELOPERS TABLE POLICIES ============

-- Policy: Developers can view their own profile
CREATE POLICY "Developers can view own profile"
ON developers
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Developers can update their own profile
CREATE POLICY "Developers can update own profile"
ON developers
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for admin operations)
CREATE POLICY "Service role full access to developers"
ON developers
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============ UPLOADED_FILES TABLE POLICIES ============

-- Policy: Developers can view their own files
CREATE POLICY "Developers can view own files"
ON uploaded_files
FOR SELECT
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- Policy: Developers can insert their own files
CREATE POLICY "Developers can insert own files"
ON uploaded_files
FOR INSERT
WITH CHECK (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- Policy: Developers can update their own files
CREATE POLICY "Developers can update own files"
ON uploaded_files
FOR UPDATE
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- Policy: Developers can delete their own files
CREATE POLICY "Developers can delete own files"
ON uploaded_files
FOR DELETE
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- Policy: Service role full access to uploaded_files
CREATE POLICY "Service role full access to uploaded_files"
ON uploaded_files
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============ PROPERTIES TABLE POLICIES ============

-- Policy: Developers can view their own properties
CREATE POLICY "Developers can view own properties"
ON properties
FOR SELECT
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- Policy: Developers can insert their own properties
CREATE POLICY "Developers can insert own properties"
ON properties
FOR INSERT
WITH CHECK (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- Policy: Developers can update their own properties
CREATE POLICY "Developers can update own properties"
ON properties
FOR UPDATE
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- Policy: Developers can delete their own properties
CREATE POLICY "Developers can delete own properties"
ON properties
FOR DELETE
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- Policy: Service role full access to properties
CREATE POLICY "Service role full access to properties"
ON properties
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============ PAYMENTS TABLE POLICIES ============

-- Policy: Developers can view their own payments
CREATE POLICY "Developers can view own payments"
ON payments
FOR SELECT
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- Policy: Developers can insert their own payments (for Stripe webhooks)
CREATE POLICY "Developers can insert own payments"
ON payments
FOR INSERT
WITH CHECK (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- Policy: Service role full access to payments
CREATE POLICY "Service role full access to payments"
ON payments
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ==============================================
-- VERIFICATION QUERY
-- ==============================================
-- Run this after enabling RLS to verify everything is set up correctly:

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('developers', 'properties', 'uploaded_files', 'payments')
ORDER BY tablename;

-- Expected output: all tables should show rls_enabled = true

-- ==============================================
-- NOTES
-- ==============================================
--
-- 1. Service Role Key:
--    API endpoints using SUPABASE_SERVICE_ROLE_KEY will bypass RLS
--    This is needed for admin operations and public endpoints
--
-- 2. Testing:
--    After running this script, test that:
--    - Dashboard loads correctly
--    - File uploads work
--    - Properties table displays data
--    - Users cannot see other developers' data
--
-- 3. Rollback (if needed):
--    ALTER TABLE developers DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE uploaded_files DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
--