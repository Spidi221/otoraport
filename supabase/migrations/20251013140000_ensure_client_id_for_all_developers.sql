-- ============================================================================
-- MIGRATION: Ensure all developers have client_id
-- Date: 2025-10-13 14:00
-- Issue: Existing developers don't have client_id (created before column was added)
-- Solution: Generate client_id for existing devs + create trigger for new ones
-- ============================================================================

-- STEP 1: Generate client_id for existing developers who don't have one
UPDATE public.developers
SET client_id = 'DEV-' || substr(md5(random()::text || id::text), 1, 8)
WHERE client_id IS NULL OR client_id = '';

-- STEP 2: Ensure client_id column has NOT NULL constraint
ALTER TABLE public.developers
ALTER COLUMN client_id SET NOT NULL;

-- STEP 3: Ensure client_id has unique constraint
DO $$ BEGIN
  ALTER TABLE public.developers
  ADD CONSTRAINT developers_client_id_unique UNIQUE (client_id);
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Constraint already exists, ignore
END $$;

-- STEP 4: Drop existing function if exists (may have wrong return type)
DROP FUNCTION IF EXISTS public.generate_client_id() CASCADE;

-- Create function to auto-generate client_id for new developers
CREATE FUNCTION public.generate_client_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if client_id is NULL or empty
  IF NEW.client_id IS NULL OR NEW.client_id = '' THEN
    NEW.client_id := 'DEV-' || substr(md5(random()::text || NEW.id::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Create trigger to auto-generate client_id on INSERT
DROP TRIGGER IF EXISTS trigger_generate_client_id ON public.developers;

CREATE TRIGGER trigger_generate_client_id
BEFORE INSERT ON public.developers
FOR EACH ROW
EXECUTE FUNCTION public.generate_client_id();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  null_client_ids INTEGER;
  total_devs INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_client_ids
  FROM public.developers
  WHERE client_id IS NULL OR client_id = '';

  SELECT COUNT(*) INTO total_devs
  FROM public.developers;

  RAISE NOTICE 'Total developers: %, Developers without client_id: %', total_devs, null_client_ids;

  IF null_client_ids > 0 THEN
    RAISE WARNING 'Found % developers without client_id after migration!', null_client_ids;
  ELSE
    RAISE NOTICE '✅ All developers now have client_id';
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN public.developers.client_id IS 'Unique client identifier used in public ministry endpoints (auto-generated on insert)';
COMMENT ON FUNCTION public.generate_client_id() IS 'Auto-generates client_id for new developers if not provided';
