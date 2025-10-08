-- Migration: Add 14-Day Trial System
-- Task #49, Subtask 49.1
-- Date: 2025-10-08
-- Description: Adds trial_status enum and trigger to manage 14-day free trials

-- ============================================================================
-- PART 1: Create trial_status enum type
-- ============================================================================

-- Create enum type for trial status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trial_status_enum') THEN
    CREATE TYPE trial_status_enum AS ENUM ('active', 'expired', 'converted', 'cancelled');
    COMMENT ON TYPE trial_status_enum IS 'Trial status: active (in trial), expired (trial ended), converted (upgraded to paid), cancelled (user cancelled)';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Add trial_status column to developers table
-- ============================================================================

-- Add trial_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name = 'trial_status'
  ) THEN
    ALTER TABLE public.developers
    ADD COLUMN trial_status trial_status_enum NOT NULL DEFAULT 'active';

    COMMENT ON COLUMN public.developers.trial_status IS 'Current status of the 14-day trial period';
  END IF;
END $$;

-- ============================================================================
-- PART 3: Verify trial_ends_at column exists (should already be there)
-- ============================================================================

-- Add trial_ends_at column if it doesn't exist (likely already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE public.developers
    ADD COLUMN trial_ends_at TIMESTAMPTZ;

    COMMENT ON COLUMN public.developers.trial_ends_at IS 'Timestamp when the 14-day trial period ends';
  END IF;
END $$;

-- ============================================================================
-- PART 4: Create database function to set trial on signup
-- ============================================================================

-- Function to set trial period on new developer signup
CREATE OR REPLACE FUNCTION public.set_trial_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set trial if trial_ends_at is NULL (new signup)
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := NOW() + INTERVAL '14 days';
    NEW.trial_status := 'active';
    NEW.subscription_status := 'trialing';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_trial_on_signup() IS 'Automatically sets trial_ends_at to NOW() + 14 days on new developer signup';

-- ============================================================================
-- PART 5: Create trigger to call the function on INSERT
-- ============================================================================

-- Drop trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS trigger_set_trial_on_signup ON public.developers;

-- Create trigger on developers table INSERT
CREATE TRIGGER trigger_set_trial_on_signup
  BEFORE INSERT ON public.developers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trial_on_signup();

COMMENT ON TRIGGER trigger_set_trial_on_signup ON public.developers IS 'Sets 14-day trial period automatically on new developer signup';

-- ============================================================================
-- PART 6: Create function to check and update expired trials
-- ============================================================================

-- Function to check if trial is expired and update status
CREATE OR REPLACE FUNCTION public.check_trial_expiration(developer_id_param UUID)
RETURNS TABLE (
  is_active BOOLEAN,
  days_remaining INTEGER,
  trial_ends_at TIMESTAMPTZ,
  trial_status trial_status_enum
) AS $$
DECLARE
  v_trial_ends_at TIMESTAMPTZ;
  v_trial_status trial_status_enum;
  v_subscription_status TEXT;
BEGIN
  -- Get developer's trial info
  SELECT d.trial_ends_at, d.trial_status, d.subscription_status
  INTO v_trial_ends_at, v_trial_status, v_subscription_status
  FROM public.developers d
  WHERE d.id = developer_id_param;

  -- If no data found, return inactive
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, NULL::TIMESTAMPTZ, 'expired'::trial_status_enum;
    RETURN;
  END IF;

  -- Check if trial has expired and status is still 'active'
  IF v_trial_ends_at < NOW() AND v_trial_status = 'active' THEN
    -- Update trial status to 'expired'
    UPDATE public.developers
    SET trial_status = 'expired',
        subscription_status = CASE
          WHEN subscription_status = 'trialing' THEN 'expired'
          ELSE subscription_status
        END
    WHERE id = developer_id_param;

    v_trial_status := 'expired';
  END IF;

  -- Calculate days remaining (can be negative if expired)
  DECLARE
    v_days_remaining INTEGER;
    v_is_active BOOLEAN;
  BEGIN
    v_days_remaining := GREATEST(0, EXTRACT(DAY FROM (v_trial_ends_at - NOW()))::INTEGER);
    v_is_active := (v_trial_status = 'active' AND v_trial_ends_at > NOW());

    RETURN QUERY SELECT v_is_active, v_days_remaining, v_trial_ends_at, v_trial_status;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_trial_expiration(UUID) IS 'Checks if trial has expired and updates status accordingly. Returns trial status info.';

-- ============================================================================
-- PART 7: Create index for performance
-- ============================================================================

-- Create composite index on (trial_status, trial_ends_at) for efficient queries
CREATE INDEX IF NOT EXISTS idx_developers_trial_status_ends_at
  ON public.developers(trial_status, trial_ends_at);

COMMENT ON INDEX idx_developers_trial_status_ends_at IS 'Performance index for trial status queries and expiration checks';

-- Create index on subscription_status for middleware queries
CREATE INDEX IF NOT EXISTS idx_developers_subscription_status
  ON public.developers(subscription_status);

-- ============================================================================
-- PART 8: Update existing developers (backfill for current users)
-- ============================================================================

-- Set trial_status for existing developers who don't have it
UPDATE public.developers
SET trial_status = CASE
  WHEN subscription_status = 'trialing' AND trial_ends_at > NOW() THEN 'active'::trial_status_enum
  WHEN subscription_status = 'trialing' AND trial_ends_at <= NOW() THEN 'expired'::trial_status_enum
  WHEN subscription_status IN ('active') THEN 'converted'::trial_status_enum
  WHEN subscription_status IN ('cancelled', 'inactive', 'expired') THEN 'cancelled'::trial_status_enum
  ELSE 'active'::trial_status_enum
END
WHERE trial_status IS NULL OR trial_status = 'active';

-- Set trial_ends_at for developers who don't have it (legacy data)
UPDATE public.developers
SET trial_ends_at = created_at + INTERVAL '14 days'
WHERE trial_ends_at IS NULL;

-- ============================================================================
-- PART 9: Grant necessary permissions
-- ============================================================================

-- Grant execute permission on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.set_trial_on_signup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_trial_expiration(UUID) TO authenticated;

-- ============================================================================
-- PART 10: Verify RLS policies still work
-- ============================================================================

-- RLS is already enabled on developers table from previous migrations
-- Verify it's still enabled (idempotent)
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- Existing RLS policies will continue to work as expected
-- No changes needed to RLS policies for trial system

-- ============================================================================
-- PART 11: Final verification query (commented out, for manual testing)
-- ============================================================================

-- SELECT
--   id,
--   email,
--   trial_status,
--   trial_ends_at,
--   subscription_status,
--   created_at
-- FROM public.developers
-- ORDER BY created_at DESC
-- LIMIT 10;

-- ============================================================================
-- Migration complete
-- ============================================================================
