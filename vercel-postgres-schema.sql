-- VERCEL POSTGRESQL SCHEMA FOR OTORAPORT
-- Migration from Supabase to Vercel Postgres due to PGRST002 errors
-- Date: 2025-09-25

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create users table (replaces auth.users from Supabase)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create accounts table (for NextAuth)
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- Create sessions table (for NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create verification_tokens table (for NextAuth)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create developers table (main business entity)
CREATE TABLE IF NOT EXISTS developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  client_id VARCHAR(100) UNIQUE NOT NULL,

  -- Business details
  nip VARCHAR(20),
  regon VARCHAR(20),
  legal_form VARCHAR(100) DEFAULT 'spółka z o.o.',

  -- Address
  street VARCHAR(200),
  city VARCHAR(100),
  postal_code VARCHAR(10),
  voivodeship VARCHAR(50),

  -- Contact
  phone VARCHAR(20),
  website VARCHAR(255),

  -- Subscription
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_status VARCHAR(50) DEFAULT 'trial',
  subscription_ends_at TIMESTAMPTZ,

  -- Ministry integration
  xml_url VARCHAR(500),
  md5_url VARCHAR(500),
  last_report_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create properties table (ministry 58 fields compliant)
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,

  -- Basic property info
  apartment_number VARCHAR(50) NOT NULL,
  property_type VARCHAR(50) DEFAULT 'mieszkanie',

  -- Measurements
  area DECIMAL(8,2) NOT NULL,
  rooms_count INTEGER,
  floor INTEGER,
  floors_total INTEGER,

  -- Pricing
  price_per_m2 DECIMAL(10,2) NOT NULL,
  base_price DECIMAL(12,2) NOT NULL,
  final_price DECIMAL(12,2) NOT NULL,

  -- Location (required by ministry)
  wojewodztwo VARCHAR(50) NOT NULL,
  powiat VARCHAR(50) NOT NULL,
  gmina VARCHAR(100) NOT NULL,
  miejscowosc VARCHAR(100),
  ulica VARCHAR(200),
  numer_budynku VARCHAR(20),
  numer_mieszkania VARCHAR(20),
  kod_pocztowy VARCHAR(10),

  -- Additional elements
  parking_spots INTEGER DEFAULT 0,
  storage_room BOOLEAN DEFAULT false,
  balcony_area DECIMAL(6,2) DEFAULT 0,
  terrace_area DECIMAL(6,2) DEFAULT 0,
  garden_area DECIMAL(8,2) DEFAULT 0,

  -- Investment details
  investment_name VARCHAR(200),
  building_name VARCHAR(200),
  construction_stage VARCHAR(100),
  expected_completion_date DATE,

  -- Pricing validity (ministry requirement)
  price_valid_from DATE NOT NULL,
  price_valid_to DATE,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'active',
  is_available BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table (Stripe integration)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,

  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PLN',
  status VARCHAR(50) DEFAULT 'pending',

  -- Stripe data
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),

  -- Subscription details
  subscription_plan VARCHAR(50),
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_logs table (for email tracking)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,

  -- Email details
  email_type VARCHAR(100) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),

  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,

  -- External service data
  resend_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_developers_user_id ON developers(user_id);
CREATE INDEX IF NOT EXISTS idx_developers_client_id ON developers(client_id);
CREATE INDEX IF NOT EXISTS idx_developers_email ON developers(email);

CREATE INDEX IF NOT EXISTS idx_properties_developer_id ON properties(developer_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price_valid_from ON properties(price_valid_from);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(wojewodztwo, powiat, gmina);

CREATE INDEX IF NOT EXISTS idx_payments_developer_id ON payments(developer_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON developers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo data for testing
INSERT INTO users (id, email, email_verified) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'demo@otoraport.pl', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO developers (
  id, user_id, email, company_name, client_id,
  nip, legal_form, street, city, postal_code, voivodeship, phone
) VALUES (
  '223e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174000',
  'demo@otoraport.pl',
  'Demo Developer Sp. z o.o.',
  'demo-dev-2025',
  '1234567890',
  'spółka z o.o.',
  'ul. Testowa 1',
  'Warszawa',
  '00-001',
  'mazowieckie',
  '+48 123 456 789'
) ON CONFLICT (client_id) DO NOTHING;

-- Insert sample properties
INSERT INTO properties (
  developer_id, apartment_number, area, price_per_m2, base_price, final_price,
  wojewodztwo, powiat, gmina, miejscowosc, ulica, kod_pocztowy,
  price_valid_from, rooms_count
) VALUES
  (
    '223e4567-e89b-12d3-a456-426614174000',
    '1A', 45.5, 12000.00, 546000.00, 546000.00,
    'mazowieckie', 'Warszawa', 'Warszawa', 'Warszawa', 'ul. Testowa 1', '00-001',
    CURRENT_DATE, 2
  ),
  (
    '223e4567-e89b-12d3-a456-426614174000',
    '2B', 67.8, 11500.00, 779700.00, 779700.00,
    'mazowieckie', 'Warszawa', 'Warszawa', 'Warszawa', 'ul. Testowa 1', '00-001',
    CURRENT_DATE, 3
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- Show created tables
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;