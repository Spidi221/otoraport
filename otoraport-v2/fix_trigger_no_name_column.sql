-- ============================================
-- FIX: Trigger without "name" column
-- ============================================
-- Run this in Supabase SQL Editor

-- Drop existing function/trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create CORRECTED function (without "name" column)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_client_id TEXT;
BEGIN
  -- Generate client_id (dev_ + first 12 chars of user id)
  new_client_id := 'dev_' || substring(NEW.id::text, 1, 12);

  -- Insert developer profile (WITHOUT "name" column!)
  INSERT INTO public.developers (
    user_id,
    email,
    company_name,
    nip,
    client_id,
    subscription_plan,
    subscription_status,
    trial_ends_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Moja Firma'),
    '0000000000',  -- Placeholder NIP (required field)
    new_client_id,
    'trial',
    'active',
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Verify trigger was created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
