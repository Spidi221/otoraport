-- ============================================================================
-- FORCE FIX: Properties RLS Policies - Nuclear option
-- Date: 2025-10-13 13:00
-- Issue: Old migration created wrong RLS policy, new one didn't fully override
-- Solution: Drop ALL policies and recreate from scratch
-- ============================================================================

-- STEP 1: Nuclear option - drop ALL policies on properties table
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'properties'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON properties', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- STEP 2: Verify RLS is enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create correct policies from scratch

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
-- VERIFICATION
-- ============================================================================
-- Check that policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'properties';

  RAISE NOTICE 'Properties table now has % RLS policies', policy_count;

  IF policy_count != 4 THEN
    RAISE WARNING 'Expected 4 policies but found %!', policy_count;
  END IF;
END $$;

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
-- DONE
-- ============================================================================
