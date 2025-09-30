-- ==============================================
-- MINIMAL RLS SETUP - Only for tables that exist
-- ==============================================
--
-- This script enables RLS ONLY on tables that actually exist
-- Run check_table_structure.sql first to see what you have
--

-- 1. Enable RLS on core tables (these should exist)
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- DROP EXISTING POLICIES
-- ==============================================

-- Developers policies
DROP POLICY IF EXISTS "Developers can view own profile" ON developers;
DROP POLICY IF EXISTS "Developers can update own profile" ON developers;
DROP POLICY IF EXISTS "Service role full access to developers" ON developers;

-- Properties policies
DROP POLICY IF EXISTS "Developers can view own properties" ON properties;
DROP POLICY IF EXISTS "Developers can insert own properties" ON properties;
DROP POLICY IF EXISTS "Developers can update own properties" ON properties;
DROP POLICY IF EXISTS "Developers can delete own properties" ON properties;
DROP POLICY IF EXISTS "Service role full access to properties" ON properties;

-- Payments policies
DROP POLICY IF EXISTS "Developers can view own payments" ON payments;
DROP POLICY IF EXISTS "Developers can insert own payments" ON payments;
DROP POLICY IF EXISTS "Service role full access to payments" ON payments;

-- ==============================================
-- CREATE RLS POLICIES FOR CORE TABLES
-- ==============================================

-- ============ DEVELOPERS TABLE ============

CREATE POLICY "Developers can view own profile"
ON developers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Developers can update own profile"
ON developers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to developers"
ON developers
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============ PROPERTIES TABLE ============

CREATE POLICY "Developers can view own properties"
ON properties
FOR SELECT
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Developers can insert own properties"
ON properties
FOR INSERT
WITH CHECK (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Developers can update own properties"
ON properties
FOR UPDATE
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Developers can delete own properties"
ON properties
FOR DELETE
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access to properties"
ON properties
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============ PAYMENTS TABLE ============

CREATE POLICY "Developers can view own payments"
ON payments
FOR SELECT
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Developers can insert own payments"
ON payments
FOR INSERT
WITH CHECK (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access to payments"
ON payments
FOR ALL
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
  AND tablename IN ('developers', 'properties', 'payments')
ORDER BY tablename;