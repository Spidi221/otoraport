-- ==============================================
-- ENABLE ROW LEVEL SECURITY (RLS) - SAFE VERSION
-- Priority: P0 SECURITY CRITICAL
-- ==============================================
--
-- This script safely enables RLS and recreates policies
-- Won't fail if policies already exist
--
-- Run this in Supabase SQL Editor
--

-- 1. Enable RLS on all tables
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- DROP EXISTING POLICIES (if they exist)
-- ==============================================

-- Developers policies
DROP POLICY IF EXISTS "Developers can view own profile" ON developers;
DROP POLICY IF EXISTS "Developers can update own profile" ON developers;
DROP POLICY IF EXISTS "Service role full access to developers" ON developers;

-- Uploaded files policies
DROP POLICY IF EXISTS "Developers can view own files" ON uploaded_files;
DROP POLICY IF EXISTS "Developers can insert own files" ON uploaded_files;
DROP POLICY IF EXISTS "Developers can update own files" ON uploaded_files;
DROP POLICY IF EXISTS "Developers can delete own files" ON uploaded_files;
DROP POLICY IF EXISTS "Service role full access to uploaded_files" ON uploaded_files;

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
-- CREATE RLS POLICIES
-- ==============================================

-- ============ DEVELOPERS TABLE POLICIES ============

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

-- ============ UPLOADED_FILES TABLE POLICIES ============

CREATE POLICY "Developers can view own files"
ON uploaded_files
FOR SELECT
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Developers can insert own files"
ON uploaded_files
FOR INSERT
WITH CHECK (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Developers can update own files"
ON uploaded_files
FOR UPDATE
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Developers can delete own files"
ON uploaded_files
FOR DELETE
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access to uploaded_files"
ON uploaded_files
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============ PROPERTIES TABLE POLICIES ============

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

-- ============ PAYMENTS TABLE POLICIES ============

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
-- VERIFICATION QUERY
-- ==============================================

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('developers', 'properties', 'uploaded_files', 'payments')
ORDER BY tablename;

-- Show all policies
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('developers', 'properties', 'uploaded_files', 'payments')
ORDER BY tablename, policyname;