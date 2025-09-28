-- SUPABASE DATABASE FIX FOR PGRST002 ERROR
-- Run this SQL in Supabase Dashboard > SQL Editor

-- Step 1: Drop all existing tables to start fresh
DROP TABLE IF EXISTS public.webhook_deliveries CASCADE;
DROP TABLE IF EXISTS public.webhook_endpoints CASCADE;
DROP TABLE IF EXISTS public.api_requests CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.webhooks CASCADE;
DROP TABLE IF EXISTS public.integrations CASCADE;
DROP TABLE IF EXISTS public.subscription_billing CASCADE;
DROP TABLE IF EXISTS public.custom_domains CASCADE;
DROP TABLE IF EXISTS public.system_logs CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.generated_files CASCADE;
DROP TABLE IF EXISTS public.uploaded_files CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.developers CASCADE;

-- Step 2: Drop and recreate any existing functions
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Step 3: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 4: Create developers table (main table)
CREATE TABLE public.developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NULL, -- For Supabase Auth integration
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    company_name TEXT NULL,
    nip TEXT NULL,
    regon TEXT NULL,
    krs TEXT NULL,
    ceidg TEXT NULL,
    legal_form TEXT NULL,
    headquarters_address TEXT NULL,
    phone TEXT NULL,
    client_id TEXT UNIQUE NOT NULL,
    xml_url TEXT NULL,
    md5_url TEXT NULL,
    status TEXT DEFAULT 'active',
    subscription_status TEXT DEFAULT 'trial',
    subscription_plan TEXT NULL,
    subscription_ends_at TIMESTAMPTZ NULL,
    registration_completed BOOLEAN DEFAULT false,
    properties_limit INTEGER NULL,
    projects_limit INTEGER NULL,
    additional_projects_count INTEGER DEFAULT 0,
    stripe_customer_id TEXT NULL,
    stripe_subscription_id TEXT NULL,
    custom_domain TEXT NULL,
    presentation_url TEXT NULL,
    presentation_generated_at TIMESTAMPTZ NULL,
    ministry_approved BOOLEAN DEFAULT false,
    ministry_email_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NULL,
    address TEXT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Create properties table (with all Ministry compliance fields)
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    apartment_number TEXT NOT NULL,
    property_type TEXT NOT NULL,
    price_per_m2 DECIMAL(10,2) NULL,
    base_price DECIMAL(12,2) NULL,
    final_price DECIMAL(12,2) NULL,
    surface_area DECIMAL(8,2) NULL,
    parking_space TEXT NULL,
    parking_price DECIMAL(10,2) NULL,
    status TEXT DEFAULT 'available',
    raw_data JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Location details (Ministry required)
    wojewodztwo TEXT NULL,
    powiat TEXT NULL,
    gmina TEXT NULL,
    miejscowosc TEXT NULL,
    ulica TEXT NULL,
    numer_nieruchomosci TEXT NULL,
    kod_pocztowy TEXT NULL,

    -- Building and apartment details
    budynek TEXT NULL,
    klatka TEXT NULL,
    kondygnacja INTEGER NULL,
    liczba_kondygnacji INTEGER NULL,
    liczba_pokoi DECIMAL(3,1) NULL,
    uklad_mieszkania TEXT NULL,
    stan_wykonczenia TEXT NULL,
    rok_budowy INTEGER NULL,
    technologia_budowy TEXT NULL,

    -- Surface areas (detailed breakdown)
    powierzchnia_uzytkowa DECIMAL(8,2) NULL,
    powierzchnia_calkowita DECIMAL(8,2) NULL,
    powierzchnia_balkon DECIMAL(8,2) NULL,
    powierzchnia_taras DECIMAL(8,2) NULL,
    powierzchnia_loggia DECIMAL(8,2) NULL,
    powierzchnia_ogrod DECIMAL(8,2) NULL,
    powierzchnia_piwnicy DECIMAL(8,2) NULL,
    powierzchnia_strychu DECIMAL(8,2) NULL,

    -- Price details (historical and current)
    cena_za_m2_poczatkowa DECIMAL(10,2) NULL,
    cena_bazowa_poczatkowa DECIMAL(12,2) NULL,
    cena_finalna_poczatkowa DECIMAL(12,2) NULL,
    data_pierwszej_oferty DATE NULL,
    cena_za_m2_aktualna DECIMAL(10,2) NULL,
    cena_bazowa_aktualna DECIMAL(12,2) NULL,
    cena_finalna_aktualna DECIMAL(12,2) NULL,
    data_obowiazywania_ceny_od DATE NULL,
    data_obowiazywania_ceny_do DATE NULL,
    waluta TEXT DEFAULT 'PLN',

    -- Additional elements (parking, storage)
    miejsca_postojowe_liczba INTEGER NULL,
    miejsca_postojowe_nr TEXT[] NULL,
    miejsca_postojowe_ceny DECIMAL(10,2)[] NULL,
    miejsca_postojowe_rodzaj TEXT NULL,
    komorki_lokatorskie_liczba INTEGER NULL,
    komorki_lokatorskie_nr TEXT[] NULL,
    komorki_lokatorskie_ceny DECIMAL(10,2)[] NULL,
    komorki_lokatorskie_powierzchnie DECIMAL(8,2)[] NULL,

    -- Amenities and features
    pomieszczenia_przynalezne JSONB NULL,
    winda BOOLEAN NULL,
    klimatyzacja BOOLEAN NULL,
    ogrzewanie TEXT NULL,
    dostep_dla_niepelnosprawnych BOOLEAN NULL,
    ekspozycja TEXT NULL,
    widok_z_okien TEXT NULL,

    -- Legal and status information
    status_sprzedazy TEXT NULL,
    data_rezerwacji DATE NULL,
    data_sprzedazy DATE NULL,
    data_przekazania DATE NULL,
    forma_wlasnosci TEXT NULL,
    ksiega_wieczysta TEXT NULL,
    udzial_w_gruncie DECIMAL(5,4) NULL,

    -- Ministry reporting metadata
    data_pierwszego_raportu DATE NULL,
    data_ostatniej_aktualizacji DATE NULL,
    liczba_zmian_ceny INTEGER NULL,
    uwagi_ministerstwo TEXT NULL,
    uuid_ministerstwo TEXT NULL
);

-- Step 7: Create supporting tables
CREATE TABLE public.uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.generated_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    last_generated TIMESTAMPTZ DEFAULT NOW(),
    properties_count INTEGER NULL
);

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'PLN',
    status TEXT NOT NULL,
    przelewy24_session_id TEXT NULL,
    plan_type TEXT NULL,
    billing_period TEXT NULL,
    przelewy24_token TEXT NULL,
    przelewy24_order_id TEXT NULL,
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error')),
    message TEXT NOT NULL,
    details JSONB NULL,
    user_id UUID NULL,
    ip_address TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 8: Create indexes for performance
CREATE INDEX idx_developers_email ON public.developers(email);
CREATE INDEX idx_developers_user_id ON public.developers(user_id);
CREATE INDEX idx_developers_client_id ON public.developers(client_id);
CREATE INDEX idx_projects_developer_id ON public.projects(developer_id);
CREATE INDEX idx_properties_project_id ON public.properties(project_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_uploaded_files_developer_id ON public.uploaded_files(developer_id);
CREATE INDEX idx_payments_developer_id ON public.payments(developer_id);
CREATE INDEX idx_activity_logs_developer_id ON public.activity_logs(developer_id);

-- Step 9: Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create triggers
CREATE TRIGGER handle_developers_updated_at
    BEFORE UPDATE ON public.developers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Step 11: Enable Row Level Security
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Step 12: Create service role policies (BYPASSES RLS)
CREATE POLICY "service_role_all_developers" ON public.developers
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_projects" ON public.projects
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_properties" ON public.properties
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_uploaded_files" ON public.uploaded_files
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_generated_files" ON public.generated_files
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_payments" ON public.payments
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_activity_logs" ON public.activity_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_system_logs" ON public.system_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 13: Create authenticated user policies
CREATE POLICY "authenticated_developers_by_user_id" ON public.developers
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_projects" ON public.projects
    FOR ALL TO authenticated
    USING (
        developer_id IN (
            SELECT id FROM public.developers WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        developer_id IN (
            SELECT id FROM public.developers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "authenticated_properties" ON public.properties
    FOR ALL TO authenticated
    USING (
        project_id IN (
            SELECT p.id FROM public.projects p
            JOIN public.developers d ON d.id = p.developer_id
            WHERE d.user_id = auth.uid()
        )
    )
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM public.projects p
            JOIN public.developers d ON d.id = p.developer_id
            WHERE d.user_id = auth.uid()
        )
    );

-- Step 14: Create public access policy for ministry endpoints
CREATE POLICY "public_generated_files" ON public.generated_files
    FOR SELECT USING (true);

-- Step 15: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

-- Step 16: Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- Step 17: Insert demo data for testing
INSERT INTO public.developers (
    email, name, company_name, nip, phone, client_id, xml_url, md5_url,
    subscription_status, subscription_plan
) VALUES (
    'demo@cenysync.pl',
    'Jan Kowalski',
    'Kowalski Development',
    '1234567890',
    '+48123456789',
    'demo-client-123',
    'https://maichqozswcomegcsaqg.supabase.co/rest/v1/rpc/get_xml?client_id=demo-client-123',
    'https://maichqozswcomegcsaqg.supabase.co/rest/v1/rpc/get_md5?client_id=demo-client-123',
    'active',
    'pro'
) ON CONFLICT (email) DO UPDATE SET
    updated_at = NOW();

-- Success message
SELECT 'SUPABASE SCHEMA FIX COMPLETED SUCCESSFULLY!' as message;
SELECT 'Tables created and configured with proper RLS policies' as status;
SELECT 'Demo data inserted for testing' as test_data;