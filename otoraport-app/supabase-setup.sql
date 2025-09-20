-- OTORAPORT SUPABASE SETUP SCRIPT
-- Wykonaj ten SQL w Supabase SQL Editor

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET row_security = on;

-- Developers table (główna tabela użytkowników)
CREATE TABLE IF NOT EXISTS public.developers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(20),
    nip VARCHAR(15),
    regon VARCHAR(20),
    krs VARCHAR(20),
    ceidg VARCHAR(20),
    legal_form VARCHAR(100),
    headquarters_address TEXT,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(50) DEFAULT 'active',
    trial_ends_at TIMESTAMPTZ,
    subscription_starts_at TIMESTAMPTZ,
    custom_domain VARCHAR(255),
    presentation_url VARCHAR(255),
    presentation_generated_at TIMESTAMPTZ,
    is_partner BOOLEAN DEFAULT FALSE,
    partner_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table (nieruchomości)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    apartment_number VARCHAR(50) NOT NULL,
    property_type VARCHAR(50) DEFAULT 'mieszkanie',
    surface_area DECIMAL(8,2),
    price_per_m2 DECIMAL(10,2),
    base_price DECIMAL(12,2),
    final_price DECIMAL(12,2),

    -- Lokalizacja
    wojewodztwo VARCHAR(50),
    powiat VARCHAR(50),
    gmina VARCHAR(100),
    miejscowosc VARCHAR(100),
    ulica VARCHAR(200),
    numer_nieruchomosci VARCHAR(50),
    kod_pocztowy VARCHAR(10),

    -- Daty
    price_valid_from DATE,
    price_valid_to DATE,
    data_pierwszej_oferty DATE,
    data_pierwszej_sprzedazy DATE,

    -- Dodatkowe dane
    kondygnacja INTEGER,
    liczba_pokoi DECIMAL(3,1),
    powierzchnia_balkon DECIMAL(8,2),
    powierzchnia_taras DECIMAL(8,2),
    powierzchnia_loggia DECIMAL(8,2),
    powierzchnia_ogrod DECIMAL(8,2),

    -- Status
    status_dostepnosci VARCHAR(50) DEFAULT 'dostepne',
    data_rezerwacji DATE,
    data_sprzedazy DATE,
    uwagi TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    permissions TEXT[] DEFAULT ARRAY['read'],
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Requests log
CREATE TABLE IF NOT EXISTS public.api_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
    developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    method VARCHAR(10) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    user_agent TEXT,
    ip_address INET,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks table
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_successful_delivery TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook deliveries log
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_endpoint_id UUID REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    response_status_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_attempt_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'processing',
    parameters JSONB,
    result_data JSONB,
    file_url VARCHAR(500),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- w groszach
    currency VARCHAR(3) DEFAULT 'PLN',
    plan_type VARCHAR(50) NOT NULL,
    billing_period VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    external_payment_id VARCHAR(255),
    przelewy24_token VARCHAR(255),
    przelewy24_order_id VARCHAR(100),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing Contacts (Pro/Enterprise)
CREATE TABLE IF NOT EXISTS public.marketing_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    phone VARCHAR(20),
    lead_source VARCHAR(100),
    lead_status VARCHAR(50) DEFAULT 'new',
    subscription_interest VARCHAR(50),
    properties_count INTEGER DEFAULT 0,
    estimated_revenue DECIMAL(12,2) DEFAULT 0,
    lifecycle_stage VARCHAR(50) DEFAULT 'visitor',
    tags TEXT[],
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaigns (Pro/Enterprise)
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    target_audience JSONB,
    email_sequence JSONB,
    trigger_conditions JSONB,
    performance_metrics JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ
);

-- Email Templates (Pro/Enterprise)
CREATE TABLE IF NOT EXISTS public.email_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    variables TEXT[],
    category VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Workflows (Pro/Enterprise)
CREATE TABLE IF NOT EXISTS public.automation_workflows (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(100) NOT NULL,
    trigger_conditions JSONB,
    actions JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    performance_metrics JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_executed_at TIMESTAMPTZ
);

-- White-label Partners (Enterprise)
CREATE TABLE IF NOT EXISTS public.whitelabel_partners (
    id VARCHAR(255) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) NOT NULL,
    secondary_color VARCHAR(7),
    brand_name VARCHAR(255) NOT NULL,
    support_email VARCHAR(255) NOT NULL,
    support_phone VARCHAR(20),
    custom_css TEXT,
    features_enabled TEXT[],
    commission_rate DECIMAL(5,2) DEFAULT 15.00,
    status VARCHAR(50) DEFAULT 'pending',
    settings JSONB DEFAULT '{}',
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_commission DECIMAL(15,2) DEFAULT 0,
    client_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ
);

-- White-label Clients
CREATE TABLE IF NOT EXISTS public.whitelabel_clients (
    id VARCHAR(255) PRIMARY KEY,
    partner_id VARCHAR(255) REFERENCES public.whitelabel_partners(id) ON DELETE CASCADE,
    developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    custom_pricing JSONB,
    branded_dashboard_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ,
    subscription_starts_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    lifetime_value DECIMAL(12,2) DEFAULT 0,
    commission_earned DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fcp DECIMAL(10,2), -- First Contentful Paint
    lcp DECIMAL(10,2), -- Largest Contentful Paint
    cls DECIMAL(6,3),  -- Cumulative Layout Shift
    fid DECIMAL(10,2), -- First Input Delay
    ttfb DECIMAL(10,2), -- Time to First Byte
    dom_content_loaded DECIMAL(10,2),
    load_complete DECIMAL(10,2),
    url VARCHAR(500),
    hostname VARCHAR(255),
    referrer VARCHAR(500),
    user_agent TEXT,
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    os VARCHAR(100),
    device_type VARCHAR(50),
    client_ip INET,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enterprise Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    sso_enabled BOOLEAN DEFAULT FALSE,
    sso_provider VARCHAR(100),
    sso_config JSONB,
    subscription_plan VARCHAR(50) NOT NULL,
    max_users INTEGER DEFAULT 10,
    current_users INTEGER DEFAULT 0,
    admin_users TEXT[],
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enterprise Users
CREATE TABLE IF NOT EXISTS public.enterprise_users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    permissions TEXT[],
    department VARCHAR(100),
    organization_id VARCHAR(255) REFERENCES public.organizations(id) ON DELETE CASCADE,
    sso_provider VARCHAR(100),
    sso_id VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, organization_id)
);

-- Roles (RBAC)
CREATE TABLE IF NOT EXISTS public.roles (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    organization_id VARCHAR(255) REFERENCES public.organizations(id) ON DELETE CASCADE,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, organization_id)
);

-- User Roles (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id VARCHAR(255) REFERENCES public.enterprise_users(id) ON DELETE CASCADE,
    role_id VARCHAR(255) REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Email Logs
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    template_id VARCHAR(255),
    campaign_id VARCHAR(255),
    workflow_id VARCHAR(255),
    variant_id VARCHAR(255),
    message_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Events
CREATE TABLE IF NOT EXISTS public.email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    email_id VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    campaign_id VARCHAR(255),
    workflow_id VARCHAR(255),
    template_id VARCHAR(255),
    ab_test_id VARCHAR(255),
    variant_id VARCHAR(255),
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission Payments
CREATE TABLE IF NOT EXISTS public.commission_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id VARCHAR(255) REFERENCES public.whitelabel_partners(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PLN',
    status VARCHAR(50) DEFAULT 'pending',
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    reference VARCHAR(100) UNIQUE NOT NULL
);

-- INDEXES dla wydajności
CREATE INDEX IF NOT EXISTS idx_developers_email ON public.developers(email);
CREATE INDEX IF NOT EXISTS idx_developers_subscription_plan ON public.developers(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_properties_developer_id ON public.properties(developer_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_developer_id ON public.api_keys(developer_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_requests_api_key_id ON public.api_requests(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON public.api_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_developer_id ON public.webhook_endpoints(developer_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_url ON public.performance_metrics(url);

-- RLS (Row Level Security) Policies
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY "Users can access their own data" ON public.developers
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Users can access their own properties" ON public.properties
    FOR ALL USING (developer_id IN (SELECT id FROM public.developers WHERE auth.uid()::text = id::text));

CREATE POLICY "Users can access their own API keys" ON public.api_keys
    FOR ALL USING (developer_id IN (SELECT id FROM public.developers WHERE auth.uid()::text = id::text));

-- Functions dla API analytics
CREATE OR REPLACE FUNCTION get_api_analytics(dev_id UUID, start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days')
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_requests', COUNT(*),
        'success_requests', COUNT(*) FILTER (WHERE status_code < 400),
        'error_requests', COUNT(*) FILTER (WHERE status_code >= 400),
        'avg_response_time', AVG(response_time_ms),
        'top_endpoints', (
            SELECT jsonb_agg(jsonb_build_object('endpoint', endpoint, 'count', count))
            FROM (
                SELECT endpoint, COUNT(*) as count
                FROM public.api_requests
                WHERE developer_id = dev_id AND created_at >= start_date
                GROUP BY endpoint
                ORDER BY count DESC
                LIMIT 10
            ) top_ep
        )
    ) INTO result
    FROM public.api_requests
    WHERE developer_id = dev_id AND created_at >= start_date;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger do automatycznego update'u updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dodaj trigger do wszystkich tabel z updated_at
CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON public.developers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dodaj przykładowego użytkownika (OPCJONALNE - usuń w production)
INSERT INTO public.developers (
    id,
    email,
    company_name,
    subscription_plan,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@example.com',
    'Test Company',
    'pro',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Grant permissions dla service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;