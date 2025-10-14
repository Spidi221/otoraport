-- Migration: Create raw_csv_data table for CSV-first data strategy
-- Task #81.1: Store raw CSV data separately from processed/user-edited data
-- Purpose: Make uploaded CSV the single source of truth for ministerial compliance

-- Create raw_csv_data table
CREATE TABLE IF NOT EXISTS raw_csv_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,

  -- Raw CSV data (all 58+ ministerial columns)
  -- Stored as JSONB for flexibility (ministry schema may change)
  raw_data JSONB NOT NULL,

  -- Metadata
  file_name TEXT NOT NULL,
  row_number INTEGER, -- Original row number in CSV (for debugging)
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_raw_csv_data_property_id ON raw_csv_data(property_id);
CREATE INDEX idx_raw_csv_data_project_id ON raw_csv_data(project_id);
CREATE INDEX idx_raw_csv_data_developer_id ON raw_csv_data(developer_id);
CREATE INDEX idx_raw_csv_data_uploaded_at ON raw_csv_data(uploaded_at DESC);

-- GIN index for JSONB queries (allows fast searches in raw_data)
CREATE INDEX idx_raw_csv_data_raw_data ON raw_csv_data USING GIN (raw_data);

-- Enable Row Level Security
ALTER TABLE raw_csv_data ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Developers can only see their own raw CSV data
CREATE POLICY "Developers can view their own raw CSV data"
  ON raw_csv_data
  FOR SELECT
  USING (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Developers can insert their own raw CSV data
CREATE POLICY "Developers can insert their own raw CSV data"
  ON raw_csv_data
  FOR INSERT
  WITH CHECK (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Developers can update their own raw CSV data (for version control)
CREATE POLICY "Developers can update their own raw CSV data"
  ON raw_csv_data
  FOR UPDATE
  USING (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Developers can delete their own raw CSV data
CREATE POLICY "Developers can delete their own raw CSV data"
  ON raw_csv_data
  FOR DELETE
  USING (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_raw_csv_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_raw_csv_data_timestamp
  BEFORE UPDATE ON raw_csv_data
  FOR EACH ROW
  EXECUTE FUNCTION update_raw_csv_data_updated_at();

-- Add comment for documentation
COMMENT ON TABLE raw_csv_data IS 'Stores raw CSV data as uploaded by client - single source of truth for ministerial compliance (58 columns). Never overwritten by user edits or placeholders.';
COMMENT ON COLUMN raw_csv_data.raw_data IS 'JSONB containing all 58+ ministerial CSV columns exactly as uploaded - including Polish characters, dates, prices, developer info, etc.';
COMMENT ON COLUMN raw_csv_data.property_id IS 'Links to properties table for joining with processed data';
COMMENT ON COLUMN raw_csv_data.file_name IS 'Original CSV file name for audit trail';
COMMENT ON COLUMN raw_csv_data.row_number IS 'Original row number in CSV file (for debugging and validation reports)';
