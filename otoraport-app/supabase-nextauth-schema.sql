-- NextAuth.js required tables for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- NextAuth Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text,
  email text UNIQUE,
  email_verified timestamptz,
  image text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- NextAuth Accounts table  
CREATE TABLE IF NOT EXISTS accounts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- NextAuth Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_token text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires timestamptz NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- NextAuth Verification tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier text,
  token text UNIQUE NOT NULL,
  expires timestamptz NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  PRIMARY KEY (identifier, token)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_session_token_idx ON sessions(session_token);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all records
CREATE POLICY "Service role can access users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access accounts" ON accounts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access sessions" ON sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can access verification_tokens" ON verification_tokens FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own data
CREATE POLICY "Users can read own user data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can read own accounts" ON accounts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read own sessions" ON sessions FOR SELECT USING (auth.uid()::text = user_id::text);