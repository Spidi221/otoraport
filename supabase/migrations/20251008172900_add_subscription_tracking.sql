-- Migration: Add Subscription Tracking Fields
-- Task #50, Subtask 50.2
-- Date: 2025-10-08
-- Description: Adds Stripe subscription tracking fields to developers table

-- ============================================================================
-- PART 1: Add Stripe Customer ID
-- ============================================================================

-- Add stripe_customer_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.developers
    ADD COLUMN stripe_customer_id TEXT;

    COMMENT ON COLUMN public.developers.stripe_customer_id IS 'Stripe Customer ID for billing and subscription management';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Add Stripe Subscription ID
-- ============================================================================

-- Add stripe_subscription_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.developers
    ADD COLUMN stripe_subscription_id TEXT;

    COMMENT ON COLUMN public.developers.stripe_subscription_id IS 'Stripe Subscription ID for the active subscription';
  END IF;
END $$;

-- ============================================================================
-- PART 3: Add Payment Method Attached Flag
-- ============================================================================

-- Add payment_method_attached if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name = 'payment_method_attached'
  ) THEN
    ALTER TABLE public.developers
    ADD COLUMN payment_method_attached BOOLEAN NOT NULL DEFAULT false;

    COMMENT ON COLUMN public.developers.payment_method_attached IS 'Indicates if user has attached a payment method (card required for trial)';
  END IF;
END $$;

-- ============================================================================
-- PART 4: Add Subscription Current Period End
-- ============================================================================

-- Add subscription_current_period_end if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name = 'subscription_current_period_end'
  ) THEN
    ALTER TABLE public.developers
    ADD COLUMN subscription_current_period_end TIMESTAMPTZ;

    COMMENT ON COLUMN public.developers.subscription_current_period_end IS 'Timestamp when the current subscription period ends (for billing cycle)';
  END IF;
END $$;

-- ============================================================================
-- PART 5: Create indexes for performance
-- ============================================================================

-- Index on stripe_customer_id for fast customer lookups
CREATE INDEX IF NOT EXISTS idx_developers_stripe_customer_id
  ON public.developers(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

COMMENT ON INDEX idx_developers_stripe_customer_id IS 'Performance index for Stripe customer lookups';

-- Index on stripe_subscription_id for webhook processing
CREATE INDEX IF NOT EXISTS idx_developers_stripe_subscription_id
  ON public.developers(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON INDEX idx_developers_stripe_subscription_id IS 'Performance index for Stripe subscription webhook processing';

-- Index on payment_method_attached for onboarding flow queries
CREATE INDEX IF NOT EXISTS idx_developers_payment_method_attached
  ON public.developers(payment_method_attached)
  WHERE payment_method_attached = false;

COMMENT ON INDEX idx_developers_payment_method_attached IS 'Performance index for finding users who need to attach payment method';

-- ============================================================================
-- PART 6: Update RLS policies to allow reading subscription data
-- ============================================================================

-- Developers can read their own subscription data
-- This policy should already exist, but we verify it allows access to new columns

-- Drop and recreate the SELECT policy to ensure it includes new columns
DROP POLICY IF EXISTS developers_select_own ON public.developers;

CREATE POLICY developers_select_own
  ON public.developers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
  );

COMMENT ON POLICY developers_select_own ON public.developers IS 'Developers can view their own profile including subscription tracking fields';

-- ============================================================================
-- PART 7: Create helper function to get subscription status
-- ============================================================================

-- Function to get comprehensive subscription status for a developer
CREATE OR REPLACE FUNCTION public.get_subscription_status(developer_id_param UUID)
RETURNS TABLE (
  has_stripe_customer BOOLEAN,
  has_payment_method BOOLEAN,
  has_active_subscription BOOLEAN,
  subscription_plan TEXT,
  subscription_status TEXT,
  trial_status TEXT,
  trial_days_remaining INTEGER,
  subscription_ends_at TIMESTAMPTZ,
  needs_onboarding BOOLEAN
) AS $$
DECLARE
  v_developer RECORD;
BEGIN
  -- Get developer data
  SELECT
    d.stripe_customer_id,
    d.payment_method_attached,
    d.stripe_subscription_id,
    d.subscription_plan,
    d.subscription_status,
    d.trial_status,
    d.trial_ends_at,
    d.subscription_current_period_end
  INTO v_developer
  FROM public.developers d
  WHERE d.id = developer_id_param;

  -- If developer not found, return defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      false,
      false,
      'trial'::TEXT,
      'inactive'::TEXT,
      'expired'::TEXT,
      0,
      NULL::TIMESTAMPTZ,
      true;
    RETURN;
  END IF;

  -- Calculate trial days remaining
  DECLARE
    v_trial_days INTEGER;
  BEGIN
    IF v_developer.trial_ends_at IS NOT NULL AND v_developer.trial_status = 'active' THEN
      v_trial_days := GREATEST(0, EXTRACT(DAY FROM (v_developer.trial_ends_at - NOW()))::INTEGER);
    ELSE
      v_trial_days := 0;
    END IF;

    -- Determine if needs onboarding (no stripe customer or no payment method)
    DECLARE
      v_needs_onboarding BOOLEAN;
    BEGIN
      v_needs_onboarding := (
        v_developer.stripe_customer_id IS NULL OR
        v_developer.payment_method_attached = false
      );

      RETURN QUERY SELECT
        v_developer.stripe_customer_id IS NOT NULL,
        v_developer.payment_method_attached,
        v_developer.stripe_subscription_id IS NOT NULL,
        v_developer.subscription_plan,
        v_developer.subscription_status,
        v_developer.trial_status::TEXT,
        v_trial_days,
        v_developer.subscription_current_period_end,
        v_needs_onboarding;
    END;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_subscription_status(UUID) IS 'Returns comprehensive subscription status including trial, payment method, and onboarding state';

-- ============================================================================
-- PART 8: Grant necessary permissions
-- ============================================================================

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.get_subscription_status(UUID) TO authenticated;

-- ============================================================================
-- PART 9: Backfill existing data (if any)
-- ============================================================================

-- Set payment_method_attached to true for developers who already have an active subscription
UPDATE public.developers
SET payment_method_attached = true
WHERE
  payment_method_attached = false
  AND subscription_status IN ('active', 'trialing')
  AND stripe_subscription_id IS NOT NULL;

-- ============================================================================
-- PART 10: Create constraints
-- ============================================================================

-- Add constraint: if stripe_subscription_id exists, stripe_customer_id must exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_stripe_subscription_requires_customer'
    AND table_name = 'developers'
  ) THEN
    ALTER TABLE public.developers
    ADD CONSTRAINT chk_stripe_subscription_requires_customer
    CHECK (
      stripe_subscription_id IS NULL OR stripe_customer_id IS NOT NULL
    );

    COMMENT ON CONSTRAINT chk_stripe_subscription_requires_customer ON public.developers IS 'Ensures subscription ID cannot exist without customer ID';
  END IF;
END $$;

-- ============================================================================
-- Migration complete
-- ============================================================================
