-- Migration: Add custom domain support for Enterprise plan
-- Date: 2025-10-09
-- Description: Adds custom domain registration, DNS verification, and Vercel integration for Enterprise users

-- ============================================================================
-- PART 1: Add columns to developers table
-- ============================================================================

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS custom_domain_verification_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS custom_domain_added_to_vercel BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS custom_domain_dns_configured BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS custom_domain_registered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS custom_domain_verified_at TIMESTAMPTZ;

-- ============================================================================
-- PART 2: Add constraints
-- ============================================================================

-- Basic domain format validation (RFC 1035 compatible)
-- Allows: example.com, subdomain.example.com, my-domain.com
-- Must be 3-255 characters, contain dots, and use valid DNS characters
ALTER TABLE public.developers
  ADD CONSTRAINT custom_domain_format_check
  CHECK (
    custom_domain IS NULL OR
    (
      LENGTH(custom_domain) >= 3 AND
      LENGTH(custom_domain) <= 255 AND
      custom_domain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    )
  );

-- Verification token format (64 character hex string)
ALTER TABLE public.developers
  ADD CONSTRAINT custom_domain_verification_token_format_check
  CHECK (
    custom_domain_verification_token IS NULL OR
    custom_domain_verification_token ~ '^[a-f0-9]{64}$'
  );

-- Verification logic constraints
ALTER TABLE public.developers
  ADD CONSTRAINT custom_domain_verification_logic_check
  CHECK (
    -- If domain is verified, it must have a verification token and registration date
    (custom_domain_verified = false) OR
    (custom_domain_verified = true AND custom_domain_verification_token IS NOT NULL AND custom_domain_registered_at IS NOT NULL)
  );

-- Vercel logic constraints
ALTER TABLE public.developers
  ADD CONSTRAINT custom_domain_vercel_logic_check
  CHECK (
    -- Can only add to Vercel if domain is verified
    (custom_domain_added_to_vercel = false) OR
    (custom_domain_added_to_vercel = true AND custom_domain_verified = true)
  );

-- ============================================================================
-- PART 3: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_developers_custom_domain
  ON public.developers(custom_domain)
  WHERE custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_developers_custom_domain_verified
  ON public.developers(custom_domain, custom_domain_verified)
  WHERE custom_domain_verified = true;

-- ============================================================================
-- PART 4: Create reserved domains table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reserved_custom_domains (
  domain VARCHAR(255) PRIMARY KEY,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert reserved domains (common service domains that should not be used)
INSERT INTO public.reserved_custom_domains (domain, reason) VALUES
  ('localhost', 'Local development'),
  ('example.com', 'Example domain'),
  ('example.org', 'Example domain'),
  ('example.net', 'Example domain'),
  ('test.com', 'Testing domain'),
  ('vercel.app', 'Vercel platform'),
  ('vercel.com', 'Vercel platform'),
  ('otoraport.pl', 'Main platform domain'),
  ('dane.gov.pl', 'Ministry platform')
ON CONFLICT (domain) DO NOTHING;

-- Enable RLS
ALTER TABLE public.reserved_custom_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reserved custom domains" ON public.reserved_custom_domains;
CREATE POLICY "Anyone can read reserved custom domains"
  ON public.reserved_custom_domains
  FOR SELECT
  USING (true);

-- ============================================================================
-- PART 5: Update RLS policies for developers table
-- ============================================================================

-- Enterprise users can manage their own custom domain
DROP POLICY IF EXISTS "Enterprise users can update custom domain" ON public.developers;
CREATE POLICY "Enterprise users can update custom domain"
  ON public.developers
  FOR UPDATE
  USING (
    user_id = auth.uid() AND
    subscription_plan = 'enterprise'
  )
  WITH CHECK (
    user_id = auth.uid() AND
    subscription_plan = 'enterprise'
  );

-- Public can read verified custom domains for routing
DROP POLICY IF EXISTS "Public can read verified custom domains" ON public.developers;
CREATE POLICY "Public can read verified custom domains"
  ON public.developers
  FOR SELECT
  USING (custom_domain IS NOT NULL AND custom_domain_verified = true);

-- ============================================================================
-- PART 6: Create helper functions
-- ============================================================================

-- Function to check if domain is available
CREATE OR REPLACE FUNCTION public.is_custom_domain_available(check_domain VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  is_reserved BOOLEAN;
  is_taken BOOLEAN;
  domain_lower VARCHAR;
BEGIN
  -- Normalize to lowercase
  domain_lower := LOWER(check_domain);

  -- Check if domain is reserved
  SELECT EXISTS(
    SELECT 1 FROM public.reserved_custom_domains WHERE domain = domain_lower
  ) INTO is_reserved;

  IF is_reserved THEN
    RETURN FALSE;
  END IF;

  -- Check if domain is already taken by another developer
  SELECT EXISTS(
    SELECT 1 FROM public.developers WHERE LOWER(custom_domain) = domain_lower
  ) INTO is_taken;

  RETURN NOT is_taken;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate verification token
CREATE OR REPLACE FUNCTION public.generate_domain_verification_token()
RETURNS VARCHAR AS $$
BEGIN
  -- Generate a secure random 64-character hex string
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register custom domain (atomic operation)
CREATE OR REPLACE FUNCTION public.register_custom_domain(
  developer_id_param UUID,
  domain_param VARCHAR
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  is_available BOOLEAN;
  current_plan VARCHAR;
  verification_token VARCHAR;
  domain_lower VARCHAR;
BEGIN
  -- Normalize domain to lowercase
  domain_lower := LOWER(domain_param);

  -- Check if developer exists and has Enterprise plan
  SELECT subscription_plan INTO current_plan
  FROM public.developers
  WHERE id = developer_id_param;

  IF current_plan IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'developer_not_found',
      'message', 'Nie znaleziono dewelopera'
    );
  END IF;

  IF current_plan != 'enterprise' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'plan_required',
      'message', 'Plan Enterprise wymagany dla custom domain'
    );
  END IF;

  -- Check domain availability
  SELECT public.is_custom_domain_available(domain_lower) INTO is_available;

  IF NOT is_available THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'not_available',
      'message', 'Domena jest niedostępna lub zarezerwowana'
    );
  END IF;

  -- Generate verification token
  verification_token := public.generate_domain_verification_token();

  -- Register the domain (atomic)
  UPDATE public.developers
  SET
    custom_domain = domain_lower,
    custom_domain_verified = FALSE,
    custom_domain_verification_token = verification_token,
    custom_domain_added_to_vercel = FALSE,
    custom_domain_dns_configured = FALSE,
    custom_domain_registered_at = NOW(),
    custom_domain_verified_at = NULL,
    updated_at = NOW()
  WHERE id = developer_id_param;

  RETURN json_build_object(
    'success', TRUE,
    'domain', domain_lower,
    'verification_token', verification_token,
    'message', 'Domena została zarejestrowana. Dodaj rekord TXT do DNS.'
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'not_available',
      'message', 'Domena została właśnie zajęta przez innego użytkownika'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'unknown',
      'message', 'Wystąpił błąd podczas rejestracji domeny: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark domain as verified
CREATE OR REPLACE FUNCTION public.verify_custom_domain(
  developer_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  domain_value VARCHAR;
BEGIN
  -- Get current domain
  SELECT custom_domain INTO domain_value
  FROM public.developers
  WHERE id = developer_id_param;

  IF domain_value IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'no_domain',
      'message', 'Brak zarejestrowanej domeny'
    );
  END IF;

  -- Mark as verified
  UPDATE public.developers
  SET
    custom_domain_verified = TRUE,
    custom_domain_verified_at = NOW(),
    updated_at = NOW()
  WHERE id = developer_id_param;

  RETURN json_build_object(
    'success', TRUE,
    'domain', domain_value,
    'message', 'Domena została zweryfikowana'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'unknown',
      'message', 'Wystąpił błąd podczas weryfikacji domeny: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.developers.custom_domain IS 'Custom domain for Enterprise plan (e.g., ceny.firma.pl)';
COMMENT ON COLUMN public.developers.custom_domain_verified IS 'Whether the domain ownership has been verified via DNS TXT record';
COMMENT ON COLUMN public.developers.custom_domain_verification_token IS 'Token that must be added as TXT record: _otoraport-verification.{domain}';
COMMENT ON COLUMN public.developers.custom_domain_added_to_vercel IS 'Whether the domain has been added to Vercel project';
COMMENT ON COLUMN public.developers.custom_domain_dns_configured IS 'Whether DNS A/CNAME records point to Vercel';
COMMENT ON COLUMN public.developers.custom_domain_registered_at IS 'When the domain was first registered';
COMMENT ON COLUMN public.developers.custom_domain_verified_at IS 'When the domain was verified';

COMMENT ON TABLE public.reserved_custom_domains IS 'Domains that cannot be used as custom domains';
COMMENT ON FUNCTION public.is_custom_domain_available IS 'Checks if a custom domain is available';
COMMENT ON FUNCTION public.generate_domain_verification_token IS 'Generates a secure verification token for DNS TXT record';
COMMENT ON FUNCTION public.register_custom_domain IS 'Registers a custom domain for a developer (Enterprise only)';
COMMENT ON FUNCTION public.verify_custom_domain IS 'Marks a custom domain as verified after DNS TXT check';

-- ============================================================================
-- MANUAL CONFIGURATION REQUIRED
-- ============================================================================
--
-- VERCEL API SETUP:
-- 1. Go to Vercel Dashboard -> Settings -> Tokens
-- 2. Create new token with scope: "Add & manage domains"
-- 3. Add to environment variables:
--    - VERCEL_API_TOKEN=your_token_here
--    - VERCEL_PROJECT_ID=your_project_id (from Project Settings)
--    - VERCEL_TEAM_ID=your_team_id (optional, if using team)
--
-- DNS INSTRUCTIONS FOR USERS:
-- 1. Add TXT record:
--    Host: _otoraport-verification.yourdomain.com
--    Value: {verification_token}
--    TTL: 3600
--
-- 2. After verification, add A or CNAME record:
--    For root domain (example.com):
--      Type: A
--      Host: @
--      Value: 76.76.21.21 (Vercel IP)
--
--    For subdomain (ceny.example.com):
--      Type: CNAME
--      Host: ceny
--      Value: cname.vercel-dns.com
--
-- ============================================================================
