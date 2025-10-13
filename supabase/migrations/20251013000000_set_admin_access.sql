-- Migration: Set Admin Access for chudziszewski221@gmail.com
-- Created: 2025-10-13
-- Purpose: Grant admin access and bypass subscription checks for testing

-- Step 1: Find user_id from auth.users for the email
DO $$
DECLARE
  target_user_id UUID;
  target_developer_id UUID;
BEGIN
  -- Get user_id from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'chudziszewski221@gmail.com';

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User with email chudziszewski221@gmail.com not found in auth.users';
    RAISE NOTICE 'This migration will only work after the user signs up';
    RETURN;
  END IF;

  RAISE NOTICE 'Found user_id: %', target_user_id;

  -- Step 2: Update or create developer record with admin flag
  INSERT INTO public.developers (
    user_id,
    email,
    company_name,
    nip,
    client_id,
    is_admin,
    subscription_status,
    subscription_plan,
    trial_status,
    created_at,
    updated_at
  )
  VALUES (
    target_user_id,
    'chudziszewski221@gmail.com',
    'LessManual Admin',
    '0000000000',
    'ADMIN-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
    true,
    'active',
    'enterprise',
    'converted',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    is_admin = true,
    subscription_status = 'active',
    subscription_plan = 'enterprise',
    trial_status = 'converted',
    updated_at = NOW();

  RAISE NOTICE 'Admin access granted to chudziszewski221@gmail.com';

  -- Step 3: Add entry to admin_roles table
  SELECT id INTO target_developer_id
  FROM public.developers
  WHERE user_id = target_user_id;

  IF target_developer_id IS NOT NULL THEN
    INSERT INTO public.admin_roles (
      user_id,
      role,
      created_at,
      created_by
    )
    VALUES (
      target_user_id,
      'super_admin',
      NOW(),
      target_user_id
    )
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Super admin role assigned';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Migration will complete when user signs up';
END $$;

-- Step 4: Create function to auto-grant admin on signup (for future)
CREATE OR REPLACE FUNCTION public.grant_admin_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'chudziszewski221@gmail.com' THEN
    -- Update developer record
    UPDATE public.developers
    SET
      is_admin = true,
      subscription_status = 'active',
      subscription_plan = 'enterprise',
      trial_status = 'converted'
    WHERE user_id = NEW.id;

    -- Add admin role
    INSERT INTO public.admin_roles (user_id, role, created_at, created_by)
    VALUES (NEW.id, 'super_admin', NOW(), NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Auto-granted admin access to %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (only if it doesn't exist)
DROP TRIGGER IF EXISTS auto_grant_admin_trigger ON auth.users;
CREATE TRIGGER auto_grant_admin_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_admin_on_signup();

COMMENT ON FUNCTION public.grant_admin_on_signup() IS
  'Automatically grants admin access to specific email addresses on signup';
