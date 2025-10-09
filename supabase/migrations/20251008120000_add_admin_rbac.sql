-- Migration: Add RBAC System for Admin Panel
-- Date: 2025-10-08
-- Task: #57.1 - Design and Implement RBAC System
-- Description: Creates admin_roles table, adds is_admin to developers, and sets up RLS

-- ============================================================================
-- PART 1: Create admin_roles table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id
  ON public.admin_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_roles_role
  ON public.admin_roles(role);

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only super_admins can view admin_roles
DROP POLICY IF EXISTS "Super admins can view all admin roles" ON public.admin_roles;
CREATE POLICY "Super admins can view all admin roles"
  ON public.admin_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policy: Only super_admins can insert admin_roles
DROP POLICY IF EXISTS "Super admins can insert admin roles" ON public.admin_roles;
CREATE POLICY "Super admins can insert admin roles"
  ON public.admin_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policy: Only super_admins can update admin_roles
DROP POLICY IF EXISTS "Super admins can update admin roles" ON public.admin_roles;
CREATE POLICY "Super admins can update admin roles"
  ON public.admin_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policy: Only super_admins can delete admin_roles
DROP POLICY IF EXISTS "Super admins can delete admin roles" ON public.admin_roles;
CREATE POLICY "Super admins can delete admin roles"
  ON public.admin_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================================================
-- PART 2: Add is_admin column to developers table
-- ============================================================================

-- Add is_admin column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.developers
    ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create index for efficient admin checks
CREATE INDEX IF NOT EXISTS idx_developers_is_admin
  ON public.developers(is_admin) WHERE is_admin = true;

-- Create compound index for admin user lookups
CREATE INDEX IF NOT EXISTS idx_developers_user_id_is_admin
  ON public.developers(user_id, is_admin);

-- ============================================================================
-- PART 3: Insert super_admin role for primary admin
-- ============================================================================

-- Insert super_admin role for chudziszewski221@gmail.com
-- Note: This uses a subquery to find the user_id from auth.users
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find user_id for the admin email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'chudziszewski221@gmail.com'
  LIMIT 1;

  -- Only insert if user exists and role doesn't already exist
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.admin_roles (user_id, role, created_by)
    VALUES (admin_user_id, 'super_admin', admin_user_id)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Also set is_admin flag in developers table if developer profile exists
    UPDATE public.developers
    SET is_admin = true
    WHERE user_id = admin_user_id;

    RAISE NOTICE 'Super admin role granted to chudziszewski221@gmail.com';
  ELSE
    RAISE NOTICE 'User chudziszewski221@gmail.com not found in auth.users';
  END IF;
END $$;

-- ============================================================================
-- PART 4: Create helper function to check admin access
-- ============================================================================

-- Function to check if user has admin access (either through is_admin flag OR admin_roles)
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has is_admin=true in developers table
  IF EXISTS (
    SELECT 1 FROM public.developers
    WHERE user_id = check_user_id AND is_admin = true
  ) THEN
    RETURN true;
  END IF;

  -- Check if user has any admin role in admin_roles table
  IF EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = check_user_id
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's admin roles
CREATE OR REPLACE FUNCTION public.get_user_admin_roles(check_user_id UUID)
RETURNS TABLE(role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ar.role
  FROM public.admin_roles ar
  WHERE ar.user_id = check_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: Create audit log table for admin actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id
  ON public.admin_audit_logs(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id
  ON public.admin_audit_logs(target_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON public.admin_audit_logs(created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (
    public.is_user_admin(auth.uid())
  );

-- RLS Policy: System can insert audit logs (service role)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PART 6: Comments for documentation
-- ============================================================================

COMMENT ON TABLE public.admin_roles IS 'Stores admin role assignments (super_admin, admin, support)';
COMMENT ON TABLE public.admin_audit_logs IS 'Audit trail for all admin actions';
COMMENT ON COLUMN public.developers.is_admin IS 'Quick flag to mark user as admin (checked in middleware)';
COMMENT ON FUNCTION public.is_user_admin IS 'Check if user has admin access via is_admin flag or admin_roles table';
COMMENT ON FUNCTION public.get_user_admin_roles IS 'Get all admin roles assigned to a user';
