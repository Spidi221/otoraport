/**
 * FIX: Add unique constraint on (developer_id, slug) to prevent duplicate projects
 * This prevents race condition where two uploads create duplicate projects
 */

-- Drop old unique constraint on slug only (if exists)
-- Note: Must use DROP CONSTRAINT because projects_slug_key is a constraint, not just an index
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_slug_key CASCADE;
DROP INDEX IF EXISTS public.unique_project_slug;

-- Create new unique constraint on (developer_id, slug) combination
-- This allows same slug for different developers but prevents duplicates per developer
CREATE UNIQUE INDEX IF NOT EXISTS unique_developer_project_slug
ON public.projects(developer_id, slug);

-- Add comment explaining the constraint
COMMENT ON INDEX public.unique_developer_project_slug IS
'Prevents duplicate projects per developer. Allows upsert to work correctly and prevents race conditions.';
