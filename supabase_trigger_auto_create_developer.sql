-- ============================================
-- AUTO-CREATE DEVELOPER PROFILE ON SIGNUP
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- This creates a developer profile automatically when user signs up

-- Drop existing function/trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_client_id TEXT;
BEGIN
  -- Generate client_id (dev_ + first 12 chars of user id)
  new_client_id := 'dev_' || substring(NEW.id::text, 1, 12);

  -- Insert developer profile
  INSERT INTO public.developers (
    user_id,
    email,
    name,
    company_name,
    client_id,
    subscription_plan,
    subscription_status,
    trial_ends_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Moja Firma'),
    new_client_id,
    'trial',
    'trialing',  -- Updated to 'trialing' instead of 'active' for trial period users
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
