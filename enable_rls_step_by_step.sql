-- ==============================================
-- STEP-BY-STEP RLS ENABLEMENT
-- Run each section separately to find which table causes error
-- ==============================================

-- STEP 1: Enable RLS on developers table only
-- (Run this first, then check if it works)
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developers can view own profile" ON developers;
DROP POLICY IF EXISTS "Developers can update own profile" ON developers;
DROP POLICY IF EXISTS "Service role full access to developers" ON developers;

CREATE POLICY "Developers can view own profile"
ON developers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Developers can update own profile"
ON developers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to developers"
ON developers FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- VERIFY STEP 1
SELECT 'STEP 1 COMPLETE' as status, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'developers';

-- ==============================================
-- STEP 2: Enable RLS on properties table
-- (Uncomment and run after STEP 1 succeeds)
-- ==============================================
/*
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developers can view own properties" ON properties;
DROP POLICY IF EXISTS "Developers can insert own properties" ON properties;
DROP POLICY IF EXISTS "Developers can update own properties" ON properties;
DROP POLICY IF EXISTS "Developers can delete own properties" ON properties;
DROP POLICY IF EXISTS "Service role full access to properties" ON properties;

CREATE POLICY "Developers can view own properties"
ON properties FOR SELECT
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Developers can insert own properties"
ON properties FOR INSERT
WITH CHECK (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Developers can update own properties"
ON properties FOR UPDATE
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Developers can delete own properties"
ON properties FOR DELETE
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access to properties"
ON properties FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

SELECT 'STEP 2 COMPLETE' as status, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'properties';
*/

-- ==============================================
-- STEP 3: Enable RLS on payments table
-- (Uncomment and run after STEP 2 succeeds)
-- ==============================================
/*
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developers can view own payments" ON payments;
DROP POLICY IF EXISTS "Developers can insert own payments" ON payments;
DROP POLICY IF EXISTS "Service role full access to payments" ON payments;

CREATE POLICY "Developers can view own payments"
ON payments FOR SELECT
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Developers can insert own payments"
ON payments FOR INSERT
WITH CHECK (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access to payments"
ON payments FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

SELECT 'STEP 3 COMPLETE' as status, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'payments';
*/

-- ==============================================
-- STEP 4: Enable RLS on uploaded_files table
-- (Uncomment and run after STEP 3 succeeds)
-- ==============================================
/*
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developers can view own files" ON uploaded_files;
DROP POLICY IF EXISTS "Developers can insert own files" ON uploaded_files;
DROP POLICY IF EXISTS "Developers can update own files" ON uploaded_files;
DROP POLICY IF EXISTS "Developers can delete own files" ON uploaded_files;
DROP POLICY IF EXISTS "Service role full access to uploaded_files" ON uploaded_files;

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

SELECT 'STEP 4 COMPLETE' as status, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'uploaded_files';
*/