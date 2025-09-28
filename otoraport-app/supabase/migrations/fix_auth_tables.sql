-- Fix 1: Ensure NextAuth tables exist for Supabase Adapter
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- NextAuth required tables (if not exists)
CREATE TABLE IF NOT EXISTS accounts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  id_token text,
  scope text,
  session_state text,
  token_type text,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,
  expires timestamp with time zone NOT NULL,
  session_token text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text,
  email text UNIQUE,
  email_verified timestamp with time zone,
  image text,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamp with time zone NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Fix 2: Create bridge table linking NextAuth users to developer profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  developer_id uuid REFERENCES developers(id) ON DELETE CASCADE,
  profile_completed boolean DEFAULT false,
  oauth_provider text, -- 'google', 'credentials', etc.
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Fix 3: Add missing columns to developers table
ALTER TABLE developers 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS oauth_provider text,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Fix 4: Create function to handle Google OAuth user creation
CREATE OR REPLACE FUNCTION handle_new_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile for Google OAuth users
  IF EXISTS (
    SELECT 1 FROM accounts 
    WHERE user_id = NEW.id 
    AND provider = 'google'
  ) THEN
    -- Create user profile entry
    INSERT INTO user_profiles (user_id, oauth_provider, profile_completed)
    VALUES (NEW.id, 'google', false);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new OAuth users
DROP TRIGGER IF EXISTS on_auth_user_created ON users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_oauth_user();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_developers_user_id ON developers(user_id);