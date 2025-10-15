-- Migration: Add manual_overrides JSONB column to properties table
-- Task #87.1: Enable 3-tier data priority system (raw_csv_data > manual_overrides > defaults)
-- Purpose: Store user-edited ministerial fields that persist across CSV re-uploads

-- Add manual_overrides column to properties table
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS manual_overrides JSONB DEFAULT '{}';

-- GIN index for fast JSONB queries
-- Allows efficient lookups like: WHERE manual_overrides ? 'wojewodztwo_siedziby'
CREATE INDEX IF NOT EXISTS idx_properties_manual_overrides
  ON properties USING GIN (manual_overrides);

-- Add column comment for documentation
COMMENT ON COLUMN properties.manual_overrides IS 'User-edited ministerial field overrides that persist across CSV re-uploads. Format: {"wojewodztwo_siedziby": "mazowieckie", "email": "contact@developer.com", "parking_price": "50000"}. Priority: manual_overrides > raw_csv_data > properties columns > defaults.';
