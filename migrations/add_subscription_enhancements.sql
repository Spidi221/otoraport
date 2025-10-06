-- =================================================================
-- Migration: Add Subscription Enhancements for Task 10.1
-- =================================================================
-- This migration:
-- 1. Expands subscription_status enum to include 'trialing' and 'past_due'
-- 2. Adds current_period_end field for billing cycle tracking
-- 3. Updates defaults to properly set new users as 'trialing'
-- =================================================================

BEGIN;

-- Step 1: Add current_period_end field (tracks end of current billing cycle)
ALTER TABLE developers
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Step 2: Update subscription_status constraint to include new statuses
-- First, drop the existing check constraint
ALTER TABLE developers
DROP CONSTRAINT IF EXISTS developers_subscription_status_check;

-- Add the new check constraint with expanded enum values
ALTER TABLE developers
ADD CONSTRAINT developers_subscription_status_check
CHECK (subscription_status IN ('trialing', 'active', 'inactive', 'cancelled', 'expired', 'past_due'));

-- Step 3: Update default value for subscription_status
ALTER TABLE developers
ALTER COLUMN subscription_status SET DEFAULT 'trialing';

-- Step 4: Update existing users who have 'active' status but are still in trial period
-- This ensures consistency for users created before this migration
UPDATE developers
SET subscription_status = 'trialing'
WHERE subscription_status = 'active'
  AND subscription_plan = 'trial'
  AND trial_ends_at > NOW();

-- Step 5: Add comment documentation for the new field
COMMENT ON COLUMN developers.current_period_end IS 'Timestamp indicating when the current billing period ends (for active subscriptions). Used for prorating and billing cycle tracking.';

COMMENT ON COLUMN developers.subscription_status IS 'Current subscription status: trialing (14-day trial), active (paid and current), inactive (trial/subscription ended), cancelled (user cancelled), expired (payment failed or term ended), past_due (payment failed but still in grace period)';

COMMIT;

-- =================================================================
-- Rollback instructions (if needed):
-- =================================================================
-- To rollback this migration, run:
--
-- BEGIN;
-- ALTER TABLE developers DROP COLUMN IF EXISTS current_period_end;
-- ALTER TABLE developers DROP CONSTRAINT IF EXISTS developers_subscription_status_check;
-- ALTER TABLE developers ADD CONSTRAINT developers_subscription_status_check CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired'));
-- ALTER TABLE developers ALTER COLUMN subscription_status SET DEFAULT 'active';
-- COMMIT;
