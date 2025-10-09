-- Migration: Add additional projects billing support for Pro plan
-- Date: 2025-10-08
-- Description: Adds additional_projects_count column to developers table
-- for tracking paid additional projects (+50zł/month each)

-- Add additional_projects_count to developers table
ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS additional_projects_count INTEGER DEFAULT 0 NOT NULL;

-- Add constraint to ensure non-negative count
ALTER TABLE public.developers
ADD CONSTRAINT developers_additional_projects_count_non_negative
CHECK (additional_projects_count >= 0);

-- Create index for performance (partial index only for users with additional projects)
CREATE INDEX IF NOT EXISTS idx_developers_additional_projects
ON public.developers(additional_projects_count)
WHERE additional_projects_count > 0;

-- Comment for documentation
COMMENT ON COLUMN public.developers.additional_projects_count IS
'Number of additional projects purchased beyond base plan limit (Pro plan: +50zł each)';

-- Note: TypeScript types will be automatically updated when running:
-- npx supabase gen types typescript --local > src/types/supabase-generated.ts
