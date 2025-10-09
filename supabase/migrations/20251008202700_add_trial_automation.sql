-- Migration: Add Trial Email Automation Support
-- Task #51, Subtask 51.3
-- Date: 2025-10-08
-- Description: Adds trial_stage enum and columns for automated trial email campaigns

-- ============================================================================
-- PART 1: Create trial_stage enum type
-- ============================================================================

-- Create enum type for trial stage if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trial_stage_enum') THEN
    CREATE TYPE trial_stage_enum AS ENUM (
      'day_0',
      'day_7',
      'day_11',
      'day_14_success',
      'day_14_failed',
      'completed'
    );
    COMMENT ON TYPE trial_stage_enum IS 'Trial email automation stage: day_0 (welcome), day_7 (midway), day_11 (urgency), day_14_success (converted), day_14_failed (expired), completed (automation done)';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Add trial_stage column to developers table
-- ============================================================================

-- Add trial_stage column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name = 'trial_stage'
  ) THEN
    ALTER TABLE public.developers
    ADD COLUMN trial_stage trial_stage_enum DEFAULT 'day_0';

    COMMENT ON COLUMN public.developers.trial_stage IS 'Current stage of trial email automation (day_0, day_7, day_11, day_14_success, day_14_failed, completed)';
  END IF;
END $$;

-- ============================================================================
-- PART 3: Add last_trial_email_sent column to developers table
-- ============================================================================

-- Add last_trial_email_sent column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name = 'last_trial_email_sent'
  ) THEN
    ALTER TABLE public.developers
    ADD COLUMN last_trial_email_sent TIMESTAMPTZ;

    COMMENT ON COLUMN public.developers.last_trial_email_sent IS 'Timestamp of the last automated trial email sent to this developer';
  END IF;
END $$;

-- ============================================================================
-- PART 4: Create index for cron job performance
-- ============================================================================

-- Create composite index on (trial_status, trial_ends_at) for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_developers_trial_active
ON public.developers(trial_status, trial_ends_at)
WHERE trial_status = 'active';

COMMENT ON INDEX idx_developers_trial_active IS 'Performance index for cron job queries - finds active trials efficiently';

-- Create index on trial_stage for analytics
CREATE INDEX IF NOT EXISTS idx_developers_trial_stage
ON public.developers(trial_stage)
WHERE trial_stage IS NOT NULL;

COMMENT ON INDEX idx_developers_trial_stage IS 'Index for trial stage analytics and reporting';

-- ============================================================================
-- PART 5: Create trigger to set trial_stage to day_0 when trial starts
-- ============================================================================

-- Function to set trial_stage to day_0 when trial becomes active
CREATE OR REPLACE FUNCTION public.set_trial_day_0()
RETURNS TRIGGER AS $$
BEGIN
  -- If trial_status is or becomes 'active', set trial_stage to 'day_0'
  IF NEW.trial_status = 'active' AND (TG_OP = 'INSERT' OR OLD.trial_status IS NULL OR OLD.trial_status != 'active') THEN
    NEW.trial_stage := 'day_0';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_trial_day_0() IS 'Automatically sets trial_stage to day_0 when trial_status becomes or is active';

-- Drop triggers if they exist (idempotent)
DROP TRIGGER IF EXISTS trigger_set_trial_day_0 ON public.developers;
DROP TRIGGER IF EXISTS trigger_set_trial_day_0_insert ON public.developers;

-- Create trigger on developers table for INSERT and UPDATE
CREATE TRIGGER trigger_set_trial_day_0
  BEFORE INSERT OR UPDATE ON public.developers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trial_day_0();

COMMENT ON TRIGGER trigger_set_trial_day_0 ON public.developers IS 'Sets trial_stage to day_0 automatically when trial becomes or is active (INSERT or UPDATE)';

-- ============================================================================
-- PART 6: Update existing developers (backfill for current users)
-- ============================================================================

-- Set trial_stage for existing developers based on their current trial_status
UPDATE public.developers
SET trial_stage = CASE
  -- Active trials at day 0 (just started)
  WHEN trial_status = 'active' AND trial_ends_at > NOW() + INTERVAL '13 days' THEN 'day_0'::trial_stage_enum

  -- Active trials between day 7-13 (midway point)
  WHEN trial_status = 'active' AND trial_ends_at > NOW() + INTERVAL '4 days' AND trial_ends_at <= NOW() + INTERVAL '13 days' THEN 'day_7'::trial_stage_enum

  -- Active trials between day 11-13 (urgency period)
  WHEN trial_status = 'active' AND trial_ends_at > NOW() AND trial_ends_at <= NOW() + INTERVAL '4 days' THEN 'day_11'::trial_stage_enum

  -- Converted trials (successfully upgraded to paid)
  WHEN trial_status = 'converted' THEN 'day_14_success'::trial_stage_enum

  -- Expired trials (failed to convert)
  WHEN trial_status = 'expired' THEN 'day_14_failed'::trial_stage_enum

  -- Cancelled trials
  WHEN trial_status = 'cancelled' THEN 'day_14_failed'::trial_stage_enum

  -- Default to day_0 for active trials
  ELSE 'day_0'::trial_stage_enum
END
WHERE trial_stage IS NULL;

-- ============================================================================
-- PART 7: Grant necessary permissions
-- ============================================================================

-- Grant execute permission on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.set_trial_day_0() TO authenticated;

-- ============================================================================
-- PART 8: Verify RLS policies still work
-- ============================================================================

-- RLS is already enabled on developers table from previous migrations
-- Verify it's still enabled (idempotent)
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- Existing RLS policies will continue to work as expected
-- No changes needed to RLS policies for trial automation

-- ============================================================================
-- PART 9: Create helper function for trial stage analytics (optional)
-- ============================================================================

-- Function to get trial stage distribution
CREATE OR REPLACE FUNCTION public.get_trial_stage_stats()
RETURNS TABLE (
  trial_stage trial_stage_enum,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.trial_stage,
    COUNT(*) as count
  FROM public.developers d
  WHERE d.trial_status = 'active' AND d.trial_stage IS NOT NULL
  GROUP BY d.trial_stage
  ORDER BY d.trial_stage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_trial_stage_stats() IS 'Returns distribution of active trials by stage for analytics';

GRANT EXECUTE ON FUNCTION public.get_trial_stage_stats() TO authenticated;

-- ============================================================================
-- PART 10: Final verification query (commented out, for manual testing)
-- ============================================================================

-- Verify migration results
-- SELECT
--   id,
--   email,
--   trial_status,
--   trial_stage,
--   trial_ends_at,
--   last_trial_email_sent,
--   created_at
-- FROM public.developers
-- WHERE trial_status = 'active'
-- ORDER BY trial_ends_at
-- LIMIT 10;

-- Check trial stage distribution
-- SELECT * FROM public.get_trial_stage_stats();

-- ============================================================================
-- Migration complete
-- ============================================================================
