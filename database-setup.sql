-- CenySync Database Schema
-- Run this SQL in Supabase Dashboard > SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Developers table (główna tabela użytkowników)
CREATE TABLE IF NOT EXISTS public.developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    company_name TEXT,
    nip TEXT,
    phone TEXT,
    
    -- Subscription info
    subscription_plan TEXT DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'basic', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
    subscription_end_date TIMESTAMPTZ,
    trial_started_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ministry compliance
    client_id TEXT UNIQUE NOT NULL,
    xml_url TEXT,
    md_url TEXT,
    presentation_url TEXT,
    presentation_generated_at TIMESTAMPTZ,
    
    -- Custom domain for Enterprise
    custom_domain TEXT,
    
    -- Email tracking
    email_notifications_sent TEXT[] DEFAULT '{}',
    
    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table (inwestycje deweloperskie)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table (mieszkania/lokale)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Basic property info
    property_number TEXT NOT NULL,
    building_number TEXT,
    floor INTEGER,
    
    -- Property details
    area DECIMAL(8,2) NOT NULL,
    rooms INTEGER,
    property_type TEXT DEFAULT 'mieszkanie',
    
    -- Pricing (wszystkie ceny w PLN)
    price_per_m2 DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    
    -- Additional features
    parking_space TEXT,
    balcony_area DECIMAL(6,2),
    garden_area DECIMAL(6,2),
    storage_room BOOLEAN DEFAULT FALSE,
    
    -- Ministry compliance fields
    ministry_report_date TIMESTAMPTZ,
    ministry_confirmed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint per project
    UNIQUE(project_id, property_number)
);

-- Notification logs (tracking email sends)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    email TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File uploads tracking
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    properties_count INTEGER DEFAULT 0,
    processing_status TEXT DEFAULT 'processing' CHECK (processing_status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_developers_email ON public.developers(email);
CREATE INDEX IF NOT EXISTS idx_developers_client_id ON public.developers(client_id);
CREATE INDEX IF NOT EXISTS idx_developers_subscription ON public.developers(subscription_status, subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON public.projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_properties_project ON public.properties(project_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_developer ON public.notification_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_developer ON public.file_uploads(developer_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Developers can only access their own data
CREATE POLICY "developers_own_data" ON public.developers
    FOR ALL USING (auth.email() = email);

-- Projects policy
CREATE POLICY "developers_own_projects" ON public.projects
    FOR ALL USING (
        developer_id IN (
            SELECT id FROM public.developers WHERE email = auth.email()
        )
    );

-- Properties policy  
CREATE POLICY "developers_own_properties" ON public.properties
    FOR ALL USING (
        project_id IN (
            SELECT p.id FROM public.projects p
            JOIN public.developers d ON d.id = p.developer_id
            WHERE d.email = auth.email()
        )
    );

-- Notification logs policy
CREATE POLICY "developers_own_notifications" ON public.notification_logs
    FOR SELECT USING (
        developer_id IN (
            SELECT id FROM public.developers WHERE email = auth.email()
        )
    );

-- File uploads policy
CREATE POLICY "developers_own_files" ON public.file_uploads
    FOR ALL USING (
        developer_id IN (
            SELECT id FROM public.developers WHERE email = auth.email()
        )
    );

-- Service role can access all data (for admin operations)
CREATE POLICY "service_role_all_access_developers" ON public.developers
    FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_all_access_projects" ON public.projects
    FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_all_access_properties" ON public.properties
    FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_all_access_notifications" ON public.notification_logs
    FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_all_access_files" ON public.file_uploads
    FOR ALL TO service_role USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_developers_updated_at
    BEFORE UPDATE ON public.developers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Sample data for testing (optional)
-- Demo user: email = demo@cenysync.pl, password = Demo123!
INSERT INTO public.developers (
    email, password_hash, name, company_name, nip, phone,
    subscription_plan, subscription_status, client_id, xml_url, md_url
) VALUES (
    'demo@cenysync.pl', 
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Jan Kowalski',
    'Kowalski Development Sp. z o.o.',
    '1234567890',
    '+48 123 456 789',
    'pro',
    'active',
    'demo_client_123',
    'https://cenysync.pl/api/public/demo_client_123/data.xml',
    'https://cenysync.pl/api/public/demo_client_123/data.md'
) ON CONFLICT (email) DO NOTHING;

-- Insert demo project
INSERT INTO public.projects (
    developer_id, name, description, location
) 
SELECT 
    d.id,
    'Osiedle Słoneczne',
    'Nowoczesne mieszkania w centrum miasta',
    'Warszawa, ul. Słoneczna 123'
FROM public.developers d 
WHERE d.email = 'demo@cenysync.pl'
ON CONFLICT DO NOTHING;

-- Insert demo properties
INSERT INTO public.properties (
    project_id, property_number, area, rooms, price_per_m2, total_price, status
)
SELECT 
    p.id,
    unnest(ARRAY['1', '2', '3', '4', '5']),
    unnest(ARRAY[45.5, 65.2, 78.0, 52.3, 89.1]),
    unnest(ARRAY[2, 3, 4, 2, 4]),
    unnest(ARRAY[9890, 9500, 10200, 9750, 9300]),
    unnest(ARRAY[450000, 620000, 795600, 510000, 828630]),
    unnest(ARRAY['available', 'available', 'reserved', 'available', 'sold'])
FROM public.projects p
JOIN public.developers d ON d.id = p.developer_id
WHERE d.email = 'demo@cenysync.pl'
ON CONFLICT (project_id, property_number) DO NOTHING;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'CenySync database setup completed successfully!';
    RAISE NOTICE 'Demo user created: demo@cenysync.pl';
    RAISE NOTICE 'Tables created: %, %, %, %, %', 'developers', 'projects', 'properties', 'notification_logs', 'file_uploads';
END $$;