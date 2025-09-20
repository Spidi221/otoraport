-- =============================================================================
-- FAZA 1: AKTUALIZACJA MODELU SUBSKRYPCJI
-- Rozszerzenie schema dla nowego modelu płatności
-- =============================================================================

-- Backup existing data before making changes
DO $$
BEGIN
    -- Create backup tables if they don't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'developers_backup_faza1') THEN
        CREATE TABLE developers_backup_faza1 AS SELECT * FROM developers;
        RAISE NOTICE '✅ Backup developers table created';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments_backup_faza1') THEN
        CREATE TABLE payments_backup_faza1 AS SELECT * FROM payments;
        RAISE NOTICE '✅ Backup payments table created';
    END IF;
END $$;

-- =============================================================================
-- 1. ROZSZERZENIE TABELI DEVELOPERS
-- =============================================================================

-- Dodaj nowe kolumny dla limitów subskrypcji
ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS properties_limit INTEGER,
ADD COLUMN IF NOT EXISTS projects_limit INTEGER,
ADD COLUMN IF NOT EXISTS additional_projects_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Ustawienie domyślnych limitów dla istniejących planów
UPDATE public.developers SET
    properties_limit = CASE
        WHEN subscription_plan = 'basic' THEN 20
        WHEN subscription_plan = 'pro' THEN NULL  -- unlimited
        WHEN subscription_plan = 'enterprise' THEN NULL  -- unlimited
        ELSE 20
    END,
    projects_limit = CASE
        WHEN subscription_plan = 'basic' THEN 1
        WHEN subscription_plan = 'pro' THEN 2
        WHEN subscription_plan = 'enterprise' THEN NULL  -- unlimited
        ELSE 1
    END
WHERE properties_limit IS NULL;

-- =============================================================================
-- 2. NOWA TABELA SUBSCRIPTION_BILLING
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_billing (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    developer_id uuid NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,

    -- Pricing breakdown
    base_plan_price INTEGER NOT NULL, -- w groszach (np. 14900 = 149zł)
    additional_projects_fee INTEGER DEFAULT 0, -- w groszach
    total_monthly_cost INTEGER NOT NULL, -- w groszach

    -- Billing info
    billing_date DATE NOT NULL,
    billing_period TEXT DEFAULT 'monthly', -- monthly/yearly
    next_billing_date DATE,

    -- Stripe integration
    stripe_subscription_id TEXT,
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,

    -- Status
    status TEXT DEFAULT 'active', -- active/cancelled/past_due

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index dla wydajności
CREATE INDEX IF NOT EXISTS subscription_billing_developer_id_idx ON public.subscription_billing(developer_id);
CREATE INDEX IF NOT EXISTS subscription_billing_billing_date_idx ON public.subscription_billing(billing_date);

-- =============================================================================
-- 3. AKTUALIZACJA TABELI PAYMENTS
-- =============================================================================

-- Dodaj nowe kolumny dla Stripe
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe', -- stripe/przelewy24
ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS subscription_billing_id uuid REFERENCES public.subscription_billing(id);

-- =============================================================================
-- 4. TABELA CUSTOM_DOMAINS (dla Enterprise)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.custom_domains (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    developer_id uuid NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,

    -- Domain info
    subdomain TEXT NOT NULL,
    domain TEXT NOT NULL,
    full_domain TEXT GENERATED ALWAYS AS (subdomain || '.' || domain) STORED,

    -- Content
    html_content TEXT,
    last_generated TIMESTAMPTZ,
    properties_count INTEGER DEFAULT 0,

    -- DNS & Status
    dns_configured BOOLEAN DEFAULT FALSE,
    ssl_configured BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending_dns', -- pending_dns/active/error

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(subdomain, domain)
);

-- Index dla wydajności
CREATE INDEX IF NOT EXISTS custom_domains_developer_id_idx ON public.custom_domains(developer_id);
CREATE INDEX IF NOT EXISTS custom_domains_full_domain_idx ON public.custom_domains(full_domain);

-- =============================================================================
-- 5. ROZSZERZENIE TABELI PROPERTIES - przyготowanie na ministry compliance
-- =============================================================================

-- Dodaj kolumny dla smart field mapping
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS mapped_fields JSONB, -- przechowuje mapowanie pól z CSV/Excel
ADD COLUMN IF NOT EXISTS ministry_compliant BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS validation_errors TEXT[],
ADD COLUMN IF NOT EXISTS last_ministry_sync TIMESTAMPTZ;

-- =============================================================================
-- 6. FUNKCJE POMOCNICZE
-- =============================================================================

-- Funkcja do obliczania miesięcznego kosztu
CREATE OR REPLACE FUNCTION calculate_monthly_cost(
    p_developer_id uuid
) RETURNS INTEGER AS $$
DECLARE
    developer_record RECORD;
    base_cost INTEGER := 0;
    additional_cost INTEGER := 0;
    total_cost INTEGER := 0;
BEGIN
    SELECT subscription_plan, additional_projects_count
    INTO developer_record
    FROM developers
    WHERE id = p_developer_id;

    -- Oblicz koszt bazowy
    base_cost := CASE developer_record.subscription_plan
        WHEN 'basic' THEN 14900      -- 149zł
        WHEN 'pro' THEN 24900        -- 249zł
        WHEN 'enterprise' THEN 39900 -- 399zł
        ELSE 14900
    END;

    -- Oblicz koszty dodatkowe (tylko dla Pro)
    IF developer_record.subscription_plan = 'pro' AND developer_record.additional_projects_count > 0 THEN
        additional_cost := developer_record.additional_projects_count * 5000; -- +50zł za projekt
    END IF;

    total_cost := base_cost + additional_cost;

    RETURN total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkcja do sprawdzania limitów subskrypcji
CREATE OR REPLACE FUNCTION check_subscription_limits(
    p_developer_id uuid,
    p_action TEXT -- 'add_property' lub 'add_project'
) RETURNS JSONB AS $$
DECLARE
    developer_record RECORD;
    current_properties INTEGER := 0;
    current_projects INTEGER := 0;
    result JSONB := '{}';
BEGIN
    -- Pobierz dane dewelopera
    SELECT subscription_plan, properties_limit, projects_limit, additional_projects_count
    INTO developer_record
    FROM developers
    WHERE id = p_developer_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'Developer not found');
    END IF;

    -- Sprawdź limity w zależności od akcji
    IF p_action = 'add_property' THEN
        -- Policz obecne properties
        SELECT COUNT(*) INTO current_properties
        FROM properties p
        JOIN projects pr ON p.project_id = pr.id
        WHERE pr.developer_id = p_developer_id;

        -- Sprawdź limit properties (tylko dla basic)
        IF developer_record.properties_limit IS NOT NULL AND current_properties >= developer_record.properties_limit THEN
            RETURN jsonb_build_object(
                'allowed', false,
                'reason', format('Limit %s mieszkań dla planu %s. Upgrade do Pro/Enterprise.',
                    developer_record.properties_limit, developer_record.subscription_plan),
                'current_count', current_properties,
                'limit', developer_record.properties_limit
            );
        END IF;

    ELSIF p_action = 'add_project' THEN
        -- Policz obecne projects
        SELECT COUNT(*) INTO current_projects
        FROM projects
        WHERE developer_id = p_developer_id AND status = 'active';

        -- Sprawdź limit projects
        IF developer_record.projects_limit IS NOT NULL THEN
            DECLARE
                max_projects INTEGER := developer_record.projects_limit + COALESCE(developer_record.additional_projects_count, 0);
            BEGIN
                IF current_projects >= max_projects THEN
                    RETURN jsonb_build_object(
                        'allowed', false,
                        'reason', CASE
                            WHEN developer_record.subscription_plan = 'pro' THEN
                                'Dodaj kolejny projekt za +50zł/miesiąc lub upgrade do Enterprise'
                            ELSE
                                'Upgrade do Pro/Enterprise dla więcej projektów'
                        END,
                        'current_count', current_projects,
                        'limit', max_projects,
                        'can_add_paid_project', (developer_record.subscription_plan = 'pro')
                    );
                END IF;
            END;
        END IF;
    END IF;

    -- Jeśli dotarliśmy tutaj, akcja jest dozwolona
    RETURN jsonb_build_object(
        'allowed', true,
        'current_properties', current_properties,
        'current_projects', current_projects
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. TRIGGERS
-- =============================================================================

-- Trigger do automatycznego update subscription_billing przy zmianie planów
CREATE OR REPLACE FUNCTION update_subscription_billing()
RETURNS TRIGGER AS $$
BEGIN
    -- Jeśli zmienił się plan lub liczba dodatkowych projektów
    IF OLD.subscription_plan != NEW.subscription_plan OR
       OLD.additional_projects_count != NEW.additional_projects_count THEN

        INSERT INTO subscription_billing (
            developer_id,
            base_plan_price,
            additional_projects_fee,
            total_monthly_cost,
            billing_date,
            next_billing_date
        ) VALUES (
            NEW.id,
            CASE NEW.subscription_plan
                WHEN 'basic' THEN 14900
                WHEN 'pro' THEN 24900
                WHEN 'enterprise' THEN 39900
                ELSE 14900
            END,
            CASE WHEN NEW.subscription_plan = 'pro'
                THEN COALESCE(NEW.additional_projects_count, 0) * 5000
                ELSE 0
            END,
            calculate_monthly_cost(NEW.id),
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '1 month'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Zastosuj trigger
DROP TRIGGER IF EXISTS developers_subscription_update ON public.developers;
CREATE TRIGGER developers_subscription_update
    AFTER UPDATE ON public.developers
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_billing();

-- =============================================================================
-- 8. RLS POLICIES dla nowych tabel
-- =============================================================================

-- Enable RLS
ALTER TABLE public.subscription_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY "Service role can access subscription_billing"
    ON public.subscription_billing FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access custom_domains"
    ON public.custom_domains FOR ALL
    USING (auth.role() = 'service_role');

-- User policies
CREATE POLICY "Developers can access own billing"
    ON public.subscription_billing FOR ALL
    USING (
        developer_id IN (
            SELECT id FROM public.developers WHERE user_id::text = auth.uid()::text
        ) OR auth.role() = 'service_role'
    );

CREATE POLICY "Developers can access own domains"
    ON public.custom_domains FOR ALL
    USING (
        developer_id IN (
            SELECT id FROM public.developers WHERE user_id::text = auth.uid()::text
        ) OR auth.role() = 'service_role'
    );

-- =============================================================================
-- 9. INDEKSY dla wydajności
-- =============================================================================

CREATE INDEX IF NOT EXISTS developers_subscription_plan_idx ON public.developers(subscription_plan);
CREATE INDEX IF NOT EXISTS developers_stripe_customer_idx ON public.developers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS properties_ministry_compliant_idx ON public.properties(ministry_compliant);

-- =============================================================================
-- 10. INICJALIZACJA DANYCH
-- =============================================================================

-- Ustaw domyślne wartości dla istniejących developerów
UPDATE public.developers SET
    properties_limit = CASE
        WHEN subscription_plan = 'basic' THEN 20
        WHEN subscription_plan = 'pro' THEN NULL
        WHEN subscription_plan = 'enterprise' THEN NULL
        ELSE 20
    END,
    projects_limit = CASE
        WHEN subscription_plan = 'basic' THEN 1
        WHEN subscription_plan = 'pro' THEN 2
        WHEN subscription_plan = 'enterprise' THEN NULL
        ELSE 1
    END,
    additional_projects_count = 0
WHERE properties_limit IS NULL;

-- =============================================================================
-- PODSUMOWANIE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ FAZA 1 - Database Schema Updated Successfully!';
    RAISE NOTICE '📊 New subscription model implemented:';
    RAISE NOTICE '   - Basic: 20 mieszkań, 1 projekt';
    RAISE NOTICE '   - Pro: unlimited mieszkania, 2 projekty (+50zł za dodatkowy)';
    RAISE NOTICE '   - Enterprise: unlimited wszystko + custom domains';
    RAISE NOTICE '💳 Stripe integration prepared';
    RAISE NOTICE '🏗️ Custom domains table created';
    RAISE NOTICE '⚡ Performance indexes added';
    RAISE NOTICE '🔐 RLS policies configured';
END $$;