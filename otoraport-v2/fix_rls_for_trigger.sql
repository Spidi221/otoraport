-- ============================================
-- FIX: Allow trigger to insert developer profile
-- ============================================
-- Run this in Supabase SQL Editor AFTER the trigger SQL

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own developer profile" ON developers;

-- Create new INSERT policy that allows service_role (used by trigger)
CREATE POLICY "Service role can insert developer profiles"
  ON developers FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Keep the authenticated user INSERT policy but less restrictive
CREATE POLICY "Authenticated users can insert own developer profile"
  ON developers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Verify policies
SELECT schemaname, tablename, policyname, roles
FROM pg_policies
WHERE tablename = 'developers' AND cmd = 'INSERT';
