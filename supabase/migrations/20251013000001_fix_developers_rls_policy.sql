-- Migration: Fix RLS Policy for developers table
-- Created: 2025-10-13
-- Purpose: Fix developers_select_own policy to use user_id instead of id

-- The previous policy compared auth.uid() with developers.id (the developer record UUID)
-- This caused 400 errors because they never match
-- Should compare auth.uid() with developers.user_id (the foreign key to auth.users)

DROP POLICY IF EXISTS developers_select_own ON public.developers;

CREATE POLICY developers_select_own
  ON public.developers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
  );

COMMENT ON POLICY developers_select_own ON public.developers IS 'Developers can view their own profile by matching auth.uid() with user_id foreign key';
