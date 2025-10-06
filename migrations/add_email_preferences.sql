-- ============================================
-- Add Email Preferences to Developers Table
-- ============================================
-- Adds columns for managing email notification preferences
-- ============================================

BEGIN;

-- Add email preference columns to developers table
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_weekly_digest BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_data_staleness_alerts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_endpoint_health_alerts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_support_updates BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(255) UNIQUE;

-- Create index for unsubscribe tokens (for quick lookups)
CREATE INDEX IF NOT EXISTS idx_developers_unsubscribe_token
  ON developers(unsubscribe_token);

-- Function to generate unsubscribe token
CREATE OR REPLACE FUNCTION generate_unsubscribe_token()
RETURNS VARCHAR AS $$
BEGIN
  RETURN ENCODE(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate unsubscribe token on insert
CREATE OR REPLACE FUNCTION set_unsubscribe_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unsubscribe_token IS NULL THEN
    NEW.unsubscribe_token := generate_unsubscribe_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_developer_unsubscribe_token
  BEFORE INSERT ON developers
  FOR EACH ROW
  EXECUTE FUNCTION set_unsubscribe_token();

-- Update existing developers to have unsubscribe tokens
UPDATE developers
SET unsubscribe_token = generate_unsubscribe_token()
WHERE unsubscribe_token IS NULL;

COMMIT;

-- ============================================
-- Verification
-- ============================================

-- Check if columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'developers'
  AND column_name LIKE 'email_%' OR column_name = 'unsubscribe_token'
ORDER BY column_name;

-- ============================================
-- USAGE NOTES
-- ============================================
--
-- Email Preferences:
-- - email_notifications_enabled: Master toggle (if false, no emails sent)
-- - email_weekly_digest: Weekly compliance summary
-- - email_data_staleness_alerts: Alerts when data hasn't been updated in X days
-- - email_endpoint_health_alerts: Alerts when ministry endpoints fail
-- - email_support_updates: Updates on support tickets
-- - email_marketing: Marketing and product updates (opt-in)
--
-- Unsubscribe:
-- - Each developer gets a unique unsubscribe_token
-- - Used in unsubscribe URLs: /api/unsubscribe?token={unsubscribe_token}
-- ============================================
