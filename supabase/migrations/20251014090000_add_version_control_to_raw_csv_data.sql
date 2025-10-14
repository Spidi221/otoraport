-- Migration: Add version control to raw_csv_data table
-- Task #81.6: Implement version tracking for CSV upload history
-- Purpose: Keep historical versions of CSV uploads for traceability and audit

-- Add version column (defaults to 1 for existing records)
ALTER TABLE raw_csv_data
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Add is_latest flag to quickly query most recent version
ALTER TABLE raw_csv_data
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN NOT NULL DEFAULT true;

-- Create composite index for version queries
CREATE INDEX IF NOT EXISTS idx_raw_csv_data_project_version
  ON raw_csv_data(project_id, property_id, version DESC);

-- Create index for latest version queries
CREATE INDEX IF NOT EXISTS idx_raw_csv_data_latest
  ON raw_csv_data(project_id, property_id)
  WHERE is_latest = true;

-- Add comment for documentation
COMMENT ON COLUMN raw_csv_data.version IS 'Version number for this CSV upload. Increments on re-upload of same project. Allows historical tracking of all CSV changes.';
COMMENT ON COLUMN raw_csv_data.is_latest IS 'Flag indicating this is the most recent version. Only one record per property should have is_latest=true.';
