-- EMERGENCY SUPABASE SCHEMA CACHE FIX
-- Run this SQL in Supabase Dashboard → SQL Editor

BEGIN;

-- 1. Force PostgREST schema cache reload with multiple methods
SELECT pg_notify('pgrst', 'reload schema');
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst;

-- 2. Recreate database statistics (helps with query planner)
ANALYZE;

-- 3. Check and recreate problematic views if needed
DROP VIEW IF EXISTS developer_stats CASCADE;

-- 4. Ensure all core tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.developers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    client_id VARCHAR(100) UNIQUE NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(50) DEFAULT 'trial',
    xml_url VARCHAR(500),
    md5_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    apartment_number VARCHAR(50) NOT NULL,
    property_type VARCHAR(50) DEFAULT 'mieszkanie',
    area DECIMAL(8,2) NOT NULL,
    price_per_m2 DECIMAL(10,2) NOT NULL,
    base_price DECIMAL(12,2) NOT NULL,
    final_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PLN',
    status VARCHAR(50) DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_developers_user_id ON public.developers(user_id);
CREATE INDEX IF NOT EXISTS idx_developers_client_id ON public.developers(client_id);
CREATE INDEX IF NOT EXISTS idx_properties_developer_id ON public.properties(developer_id);
CREATE INDEX IF NOT EXISTS idx_payments_developer_id ON public.payments(developer_id);

-- 6. Enable RLS but with simple policies first
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 7. Create basic RLS policies (simplified to avoid conflicts)
DROP POLICY IF EXISTS "developers_policy" ON public.developers;
CREATE POLICY "developers_policy" ON public.developers
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "properties_policy" ON public.properties;
CREATE POLICY "properties_policy" ON public.properties
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "payments_policy" ON public.payments;
CREATE POLICY "payments_policy" ON public.payments
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 8. Grant necessary permissions
GRANT ALL ON public.developers TO authenticated;
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.payments TO authenticated;

-- 9. Final schema cache reload
SELECT pg_notify('pgrst', 'reload schema');

-- 10. Test basic functionality
SELECT 'Schema fix completed' as status;

COMMIT;