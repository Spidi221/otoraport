-- NextAuth.js tables for Supabase - CORRECT SCHEMA
-- Run this in your Supabase SQL Editor

-- Create the next_auth schema
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- NextAuth Users table in next_auth schema
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text,
  email text UNIQUE,
  email_verified timestamptz,
  image text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- NextAuth Accounts table in next_auth schema  
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- NextAuth Sessions table in next_auth schema
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_token text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  expires timestamptz NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- NextAuth Verification tokens table in next_auth schema
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text,
  token text UNIQUE NOT NULL,
  expires timestamptz NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  PRIMARY KEY (identifier, token)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON next_auth.accounts(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON next_auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_session_token_idx ON next_auth.sessions(session_token);

-- Row Level Security (RLS) policies
ALTER TABLE next_auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_auth.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_auth.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all records
CREATE POLICY "Service role can access users" ON next_auth.users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access accounts" ON next_auth.accounts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access sessions" ON next_auth.sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access verification_tokens" ON next_auth.verification_tokens FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own data
CREATE POLICY "Users can read own user data" ON next_auth.users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can read own accounts" ON next_auth.accounts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read own sessions" ON next_auth.sessions FOR SELECT USING (auth.uid()::text = user_id::text);