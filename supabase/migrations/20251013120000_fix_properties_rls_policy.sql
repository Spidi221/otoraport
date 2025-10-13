-- ============================================================================
-- FIX: Properties RLS Policies - developer_id vs auth.uid() mismatch
-- Date: 2025-10-13
-- Issue: RLS policies check developer_id = auth.uid() but developer_id is
--        developers.id (not user_id), causing all queries to return 0 rows
-- ============================================================================

-- Drop existing broken policies
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can create their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;

-- POLICY 1: SELECT - Users can view their own properties
-- Fix: Join through developers table to match user_id with auth.uid()
CREATE POLICY "Users can view their own properties"
ON properties FOR SELECT
TO authenticated
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- POLICY 2: INSERT - Users can create properties
-- Fix: Ensure developer_id belongs to authenticated user
CREATE POLICY "Users can create their own properties"
ON properties FOR INSERT
TO authenticated
WITH CHECK (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- POLICY 3: UPDATE - Users can update their own properties
-- Fix: Verify developer_id ownership through developers table
CREATE POLICY "Users can update their own properties"
ON properties FOR UPDATE
TO authenticated
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- POLICY 4: DELETE - Users can delete their own properties
-- Fix: Verify developer_id ownership through developers table
CREATE POLICY "Users can delete their own properties"
ON properties FOR DELETE
TO authenticated
USING (
  developer_id IN (
    SELECT id FROM developers WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON POLICY "Users can view their own properties" ON properties IS
  'Allows users to view properties where developer_id matches their developer profile ID (via developers.user_id = auth.uid())';

COMMENT ON POLICY "Users can create their own properties" ON properties IS
  'Allows users to create properties with their developer_id';

COMMENT ON POLICY "Users can update their own properties" ON properties IS
  'Allows users to update properties that belong to their developer profile';

COMMENT ON POLICY "Users can delete their own properties" ON properties IS
  'Allows users to delete properties that belong to their developer profile';

-- ============================================================================
-- VERIFICATION QUERIES (for testing after migration)
-- ============================================================================
-- Run these as authenticated user to verify policies work:
--
-- 1. Check if you can see your properties:
--    SELECT COUNT(*) FROM properties;
--
-- 2. Verify developer_id mapping:
--    SELECT auth.uid() as my_user_id,
--           (SELECT id FROM developers WHERE user_id = auth.uid()) as my_developer_id;
--
-- 3. Check properties with correct developer_id:
--    SELECT id, apartment_number, developer_id
--    FROM properties
--    WHERE developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid())
--    LIMIT 5;
-- ============================================================================
