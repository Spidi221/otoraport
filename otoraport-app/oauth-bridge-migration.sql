-- OAuth Bridge Migration for Google Authentication Fix
-- This migration creates the bridge between NextAuth tables and our developer profiles

-- First, ensure NextAuth tables exist with proper structure
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  email_verified TIMESTAMPTZ,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Bridge table to connect NextAuth users with developer profiles
CREATE TABLE IF NOT EXISTS user_developer_bridge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nextauth_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  developer_id UUID REFERENCES developers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nextauth_user_id),
  UNIQUE(developer_id)
);

-- Add oauth fields to developers table if they don't exist
ALTER TABLE developers 
ADD COLUMN IF NOT EXISTS oauth_provider TEXT,
ADD COLUMN IF NOT EXISTS oauth_provider_id TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_session_token_idx ON sessions(session_token);
CREATE INDEX IF NOT EXISTS user_developer_bridge_nextauth_user_id_idx ON user_developer_bridge(nextauth_user_id);
CREATE INDEX IF NOT EXISTS user_developer_bridge_developer_id_idx ON user_developer_bridge(developer_id);
CREATE INDEX IF NOT EXISTS developers_email_idx ON developers(email);
CREATE INDEX IF NOT EXISTS developers_oauth_provider_id_idx ON developers(oauth_provider_id);

-- Function to automatically create developer profile after OAuth registration
CREATE OR REPLACE FUNCTION create_developer_profile_for_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process Google OAuth registrations
  IF NEW.provider = 'google' THEN
    -- Check if user already has a developer profile
    IF NOT EXISTS (
      SELECT 1 FROM user_developer_bridge 
      WHERE nextauth_user_id = NEW.user_id
    ) THEN
      -- Get user details
      DECLARE
        user_email TEXT;
        user_name TEXT;
        user_image TEXT;
        new_developer_id UUID;
      BEGIN
        SELECT email, name, image INTO user_email, user_name, user_image
        FROM users WHERE id = NEW.user_id;
        
        -- Create developer profile
        INSERT INTO developers (
          email,
          name,
          company_name,
          oauth_provider,
          oauth_provider_id,
          profile_image_url,
          email_verified,
          registration_completed,
          subscription_status,
          subscription_plan
        ) VALUES (
          user_email,
          user_name,
          '', -- Will be filled during profile completion
          'google',
          NEW.provider_account_id,
          user_image,
          TRUE,
          FALSE, -- Needs to complete profile
          'trial',
          'basic'
        ) RETURNING id INTO new_developer_id;
        
        -- Create bridge record
        INSERT INTO user_developer_bridge (nextauth_user_id, developer_id)
        VALUES (NEW.user_id, new_developer_id);
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create developer profiles
DROP TRIGGER IF EXISTS create_developer_profile_trigger ON accounts;
CREATE TRIGGER create_developer_profile_trigger
  AFTER INSERT ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION create_developer_profile_for_oauth_user();

-- Function to get developer profile by NextAuth user ID
CREATE OR REPLACE FUNCTION get_developer_by_nextauth_user(user_id TEXT)
RETURNS TABLE (
  developer_id UUID,
  email TEXT,
  name TEXT,
  company_name TEXT,
  nip TEXT,
  subscription_plan TEXT,
  subscription_status TEXT,
  registration_completed BOOLEAN,
  profile_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.email,
    d.name,
    d.company_name,
    d.nip,
    d.subscription_plan,
    d.subscription_status,
    d.registration_completed,
    d.profile_image_url
  FROM developers d
  INNER JOIN user_developer_bridge ub ON d.id = ub.developer_id
  WHERE ub.nextauth_user_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing developers who might have OAuth data but no bridge
INSERT INTO user_developer_bridge (nextauth_user_id, developer_id)
SELECT u.id, d.id
FROM users u
INNER JOIN developers d ON u.email = d.email
WHERE d.oauth_provider = 'google'
  AND NOT EXISTS (
    SELECT 1 FROM user_developer_bridge ub 
    WHERE ub.nextauth_user_id = u.id OR ub.developer_id = d.id
  );

-- Add RLS policies for security
ALTER TABLE user_developer_bridge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own bridge records" ON user_developer_bridge
  FOR ALL USING (nextauth_user_id = auth.jwt() ->> 'sub');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_developer_bridge TO authenticated;
GRANT SELECT ON developers TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT EXECUTE ON FUNCTION get_developer_by_nextauth_user(TEXT) TO authenticated;

COMMENT ON TABLE user_developer_bridge IS 'Bridge table connecting NextAuth users with developer profiles for OAuth registration';
COMMENT ON FUNCTION create_developer_profile_for_oauth_user() IS 'Automatically creates developer profile when user registers via OAuth';
COMMENT ON FUNCTION get_developer_by_nextauth_user(TEXT) IS 'Helper function to get developer profile by NextAuth user ID';