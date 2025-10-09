-- Performance Optimization Indexes
-- Task #70 - Performance Optimization and Caching Implementation
-- Add indexes for frequently queried columns to improve performance

-- Properties table indexes
CREATE INDEX IF NOT EXISTS idx_properties_developer_id_status
  ON public.properties(developer_id, status);

CREATE INDEX IF NOT EXISTS idx_properties_miejscowosc
  ON public.properties(miejscowosc) WHERE miejscowosc IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_price_range
  ON public.properties(final_price);

CREATE INDEX IF NOT EXISTS idx_properties_price_per_m2
  ON public.properties(price_per_m2);

CREATE INDEX IF NOT EXISTS idx_properties_created_at_desc
  ON public.properties(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_updated_at_desc
  ON public.properties(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_status_developer
  ON public.properties(status, developer_id, created_at DESC);

-- Developers table indexes
CREATE INDEX IF NOT EXISTS idx_developers_subscription_plan
  ON public.developers(subscription_plan) WHERE subscription_plan IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_developers_subscription_status
  ON public.developers(subscription_status) WHERE subscription_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_developers_trial_ends_at
  ON public.developers(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_developers_subdomain
  ON public.developers(subdomain) WHERE subdomain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_developers_custom_domain
  ON public.developers(custom_domain) WHERE custom_domain IS NOT NULL;

-- Projects table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_projects_developer_id
  ON public.projects(developer_id);

CREATE INDEX IF NOT EXISTS idx_projects_created_at_desc
  ON public.projects(created_at DESC);

-- Audit logs indexes (already created but ensure they exist)
-- These are critical for admin panel performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_developer
  ON public.audit_logs(developer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at
  ON public.audit_logs(action, created_at DESC);

-- Health checks indexes for status page
CREATE INDEX IF NOT EXISTS idx_health_checks_component_checked_at
  ON public.health_checks(component, checked_at DESC);

-- Incidents indexes for status page
CREATE INDEX IF NOT EXISTS idx_incidents_status_started_at
  ON public.incidents(status, started_at DESC);

-- Composite indexes for common admin queries
CREATE INDEX IF NOT EXISTS idx_properties_admin_list
  ON public.properties(developer_id, status, created_at DESC)
  WHERE status IS NOT NULL;

-- Full-text search index for properties (optional, for future use)
-- CREATE INDEX IF NOT EXISTS idx_properties_address_search
--   ON public.properties USING gin(to_tsvector('english', address));

-- Analyze tables after creating indexes
ANALYZE public.properties;
ANALYZE public.developers;
ANALYZE public.projects;
ANALYZE public.audit_logs;
ANALYZE public.health_checks;
ANALYZE public.incidents;

-- Comments for documentation
COMMENT ON INDEX idx_properties_developer_id_status IS 'Optimizes queries filtering by developer and status';
COMMENT ON INDEX idx_properties_miejscowosc IS 'Speeds up city-based filtering (miejscowosc column)';
COMMENT ON INDEX idx_properties_price_range IS 'Improves price range queries on final_price';
COMMENT ON INDEX idx_properties_price_per_m2 IS 'Optimizes price per m2 range queries';
COMMENT ON INDEX idx_properties_admin_list IS 'Composite index for admin property list queries';
COMMENT ON INDEX idx_developers_subdomain IS 'Fast subdomain lookups for public pages';
COMMENT ON INDEX idx_developers_custom_domain IS 'Fast custom domain resolution';
