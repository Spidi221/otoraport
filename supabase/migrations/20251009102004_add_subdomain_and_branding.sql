-- Migration: Add subdomain and branding features for Pro plan
-- Date: 2025-10-09
-- Description: Adds subdomain, branding colors, and logo URL to developers table with proper constraints and RLS

-- ============================================================================
-- PART 1: Add columns to developers table
-- ============================================================================

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS subdomain VARCHAR(63) UNIQUE,
  ADD COLUMN IF NOT EXISTS branding_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS branding_primary_color VARCHAR(7),
  ADD COLUMN IF NOT EXISTS branding_secondary_color VARCHAR(7);

-- ============================================================================
-- PART 2: Add constraints
-- ============================================================================

-- DNS-compatible subdomain validation
-- Must be 3-63 characters, start and end with alphanumeric, can contain hyphens
ALTER TABLE public.developers
  ADD CONSTRAINT subdomain_format_check
  CHECK (subdomain IS NULL OR subdomain ~* '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$');

-- Hex color validation for primary color
ALTER TABLE public.developers
  ADD CONSTRAINT branding_primary_color_check
  CHECK (branding_primary_color IS NULL OR branding_primary_color ~* '^#[0-9A-Fa-f]{6}$');

-- Hex color validation for secondary color
ALTER TABLE public.developers
  ADD CONSTRAINT branding_secondary_color_check
  CHECK (branding_secondary_color IS NULL OR branding_secondary_color ~* '^#[0-9A-Fa-f]{6}$');

-- ============================================================================
-- PART 3: Create index for fast subdomain lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_developers_subdomain
  ON public.developers(subdomain)
  WHERE subdomain IS NOT NULL;

-- ============================================================================
-- PART 4: Create reserved subdomains table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reserved_subdomains (
  subdomain VARCHAR(63) PRIMARY KEY,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert reserved subdomains
INSERT INTO public.reserved_subdomains (subdomain, reason) VALUES
  ('www', 'Standard web prefix'),
  ('api', 'API endpoints'),
  ('admin', 'Administration'),
  ('app', 'Main application'),
  ('mail', 'Email service'),
  ('ftp', 'File transfer'),
  ('localhost', 'Local development'),
  ('test', 'Testing environment'),
  ('staging', 'Staging environment'),
  ('dev', 'Development environment'),
  ('dashboard', 'Dashboard application'),
  ('beta', 'Beta testing'),
  ('demo', 'Demo environment'),
  ('docs', 'Documentation'),
  ('blog', 'Blog'),
  ('shop', 'E-commerce'),
  ('store', 'Store'),
  ('cdn', 'Content delivery'),
  ('assets', 'Static assets'),
  ('static', 'Static files'),
  ('media', 'Media files'),
  ('images', 'Image hosting'),
  ('files', 'File storage'),
  ('download', 'Downloads'),
  ('upload', 'Uploads'),
  ('support', 'Customer support'),
  ('help', 'Help center'),
  ('status', 'Status page'),
  ('monitoring', 'Monitoring'),
  ('analytics', 'Analytics')
ON CONFLICT (subdomain) DO NOTHING;

-- ============================================================================
-- PART 5: Update RLS policies
-- ============================================================================

-- RLS Policy: Developers can update their own subdomain and branding (Pro plan only)
DROP POLICY IF EXISTS "Developers can update own subdomain and branding" ON public.developers;
CREATE POLICY "Developers can update own subdomain and branding"
  ON public.developers
  FOR UPDATE
  USING (
    user_id = auth.uid() AND
    subscription_plan IN ('pro', 'enterprise')
  )
  WITH CHECK (
    user_id = auth.uid() AND
    subscription_plan IN ('pro', 'enterprise')
  );

-- RLS Policy: Public can read subdomain for public pages
DROP POLICY IF EXISTS "Public can read subdomain" ON public.developers;
CREATE POLICY "Public can read subdomain"
  ON public.developers
  FOR SELECT
  USING (subdomain IS NOT NULL);

-- Enable RLS on reserved_subdomains (read-only for everyone)
ALTER TABLE public.reserved_subdomains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reserved subdomains" ON public.reserved_subdomains;
CREATE POLICY "Anyone can read reserved subdomains"
  ON public.reserved_subdomains
  FOR SELECT
  USING (true);

-- ============================================================================
-- PART 6: Create function to check subdomain availability
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_subdomain_available(check_subdomain VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  is_reserved BOOLEAN;
  is_taken BOOLEAN;
BEGIN
  -- Check if subdomain is reserved
  SELECT EXISTS(
    SELECT 1 FROM public.reserved_subdomains WHERE subdomain = LOWER(check_subdomain)
  ) INTO is_reserved;

  IF is_reserved THEN
    RETURN FALSE;
  END IF;

  -- Check if subdomain is already taken
  SELECT EXISTS(
    SELECT 1 FROM public.developers WHERE subdomain = LOWER(check_subdomain)
  ) INTO is_taken;

  RETURN NOT is_taken;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: Create function to claim subdomain (atomic)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.claim_subdomain(
  developer_id_param UUID,
  subdomain_param VARCHAR
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  is_available BOOLEAN;
  current_plan VARCHAR;
BEGIN
  -- Normalize subdomain to lowercase
  subdomain_param := LOWER(subdomain_param);

  -- Check if developer exists and has Pro/Enterprise plan
  SELECT subscription_plan INTO current_plan
  FROM public.developers
  WHERE id = developer_id_param;

  IF current_plan NOT IN ('pro', 'enterprise') THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'plan_required',
      'message', 'Plan Pro lub Enterprise wymagany dla subdomeny'
    );
  END IF;

  -- Check availability
  SELECT public.is_subdomain_available(subdomain_param) INTO is_available;

  IF NOT is_available THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'not_available',
      'message', 'Subdomena jest niedostępna'
    );
  END IF;

  -- Claim the subdomain (atomic)
  UPDATE public.developers
  SET subdomain = subdomain_param,
      updated_at = NOW()
  WHERE id = developer_id_param;

  RETURN json_build_object(
    'success', TRUE,
    'subdomain', subdomain_param,
    'message', 'Subdomena została przypisana'
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'not_available',
      'message', 'Subdomena została właśnie zajęta przez innego użytkownika'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'unknown',
      'message', 'Wystąpił błąd podczas przypisywania subdomeny'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 8: Comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.developers.subdomain IS 'Unique subdomain for Pro/Enterprise plans (e.g., "firma" -> firma.otoraport.pl)';
COMMENT ON COLUMN public.developers.branding_logo_url IS 'URL to uploaded logo for branded public pages';
COMMENT ON COLUMN public.developers.branding_primary_color IS 'Primary brand color in hex format (e.g., #FF5733)';
COMMENT ON COLUMN public.developers.branding_secondary_color IS 'Secondary brand color in hex format (e.g., #33C3FF)';

COMMENT ON TABLE public.reserved_subdomains IS 'List of subdomains that cannot be claimed by users';
COMMENT ON FUNCTION public.is_subdomain_available IS 'Checks if a subdomain is available for claiming';
COMMENT ON FUNCTION public.claim_subdomain IS 'Atomically claims a subdomain for a developer (Pro/Enterprise only)';

-- ============================================================================
-- MANUAL CONFIGURATION REQUIRED
-- ============================================================================
--
-- VERCEL WILDCARD DOMAIN SETUP:
-- 1. Go to Vercel dashboard -> Your Project -> Settings -> Domains
-- 2. Add domain: *.otoraport.pl
-- 3. Configure DNS (at your domain registrar):
--    - Add CNAME record: *.otoraport.pl -> cname.vercel-dns.com
-- 4. Wait for DNS propagation (up to 48 hours)
-- 5. Verify wildcard SSL certificate is issued
--
-- DNS CONFIGURATION (Example for Cloudflare/other providers):
-- Type:   CNAME
-- Name:   *
-- Target: cname.vercel-dns.com
-- TTL:    Auto
-- Proxy:  DNS only (gray cloud)
--
-- ============================================================================
