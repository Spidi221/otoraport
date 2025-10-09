-- Migration: Add price history tracking
-- Date: 2025-10-09
-- Description: Creates price_history table with RLS and triggers to automatically track property price changes

-- ============================================================================
-- PART 1: Create price_history table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  old_base_price NUMERIC,
  new_base_price NUMERIC,
  old_final_price NUMERIC,
  new_final_price NUMERIC,
  old_price_per_m2 NUMERIC,
  new_price_per_m2 NUMERIC,
  change_reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_history_property_changed
  ON public.price_history(property_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_developer_changed
  ON public.price_history(developer_id, changed_at DESC);

-- ============================================================================
-- PART 2: Enable RLS and create policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Developers can view their own price history
DROP POLICY IF EXISTS "Developers can view own price history" ON public.price_history;
CREATE POLICY "Developers can view own price history"
  ON public.price_history
  FOR SELECT
  USING (
    developer_id IN (
      SELECT id FROM public.developers WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: System can insert price history (for trigger)
DROP POLICY IF EXISTS "System can insert price history" ON public.price_history;
CREATE POLICY "System can insert price history"
  ON public.price_history
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PART 3: Create trigger function to track price changes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.track_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if at least one price field changed
  IF (
    OLD.base_price IS DISTINCT FROM NEW.base_price OR
    OLD.final_price IS DISTINCT FROM NEW.final_price OR
    OLD.price_per_m2 IS DISTINCT FROM NEW.price_per_m2
  ) THEN
    INSERT INTO public.price_history (
      property_id,
      developer_id,
      old_base_price,
      new_base_price,
      old_final_price,
      new_final_price,
      old_price_per_m2,
      new_price_per_m2,
      changed_at
    ) VALUES (
      NEW.id,
      NEW.developer_id,
      OLD.base_price,
      NEW.base_price,
      OLD.final_price,
      NEW.final_price,
      OLD.price_per_m2,
      NEW.price_per_m2,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on properties table
DROP TRIGGER IF EXISTS track_property_price_changes ON public.properties;
CREATE TRIGGER track_property_price_changes
  AFTER UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.track_price_change();

-- ============================================================================
-- PART 4: Comments for documentation
-- ============================================================================

COMMENT ON TABLE public.price_history IS 'Tracks historical price changes for properties';
COMMENT ON COLUMN public.price_history.property_id IS 'Reference to the property';
COMMENT ON COLUMN public.price_history.developer_id IS 'Reference to the developer who owns the property';
COMMENT ON COLUMN public.price_history.old_base_price IS 'Previous base price value';
COMMENT ON COLUMN public.price_history.new_base_price IS 'New base price value';
COMMENT ON COLUMN public.price_history.old_final_price IS 'Previous final price value';
COMMENT ON COLUMN public.price_history.new_final_price IS 'New final price value';
COMMENT ON COLUMN public.price_history.old_price_per_m2 IS 'Previous price per m2 value';
COMMENT ON COLUMN public.price_history.new_price_per_m2 IS 'New price per m2 value';
COMMENT ON COLUMN public.price_history.change_reason IS 'Optional reason for the price change';
COMMENT ON COLUMN public.price_history.changed_at IS 'Timestamp when the price changed';
COMMENT ON COLUMN public.price_history.created_by IS 'User who made the change (if available)';
