/**
 * FIX: Add unique constraint on (developer_id, slug) to prevent duplicate projects
 * This prevents race condition where two uploads create duplicate projects
 */

-- Drop old unique index on slug only (if exists)
DROP INDEX IF EXISTS public.projects_slug_key;
DROP INDEX IF EXISTS public.unique_project_slug;

-- Create new unique constraint on (developer_id, slug) combination
-- This allows same slug for different developers but prevents duplicates per developer
CREATE UNIQUE INDEX IF NOT EXISTS unique_developer_project_slug 
ON public.projects(developer_id, slug);

-- Add comment explaining the constraint
COMMENT ON INDEX public.unique_developer_project_slug IS 
'Prevents duplicate projects per developer. Allows upsert to work correctly and prevents race conditions.';
