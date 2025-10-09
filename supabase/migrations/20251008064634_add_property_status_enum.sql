-- Migration: Add property_status enum and update properties table
-- Task: 39.1 - Database Schema Update for Property Status

-- Create property_status enum type (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
    CREATE TYPE property_status AS ENUM ('available', 'sold', 'reserved');
  END IF;
END $$;

-- Alter properties table to use the enum type
-- First, update any NULL values to 'available'
UPDATE properties
SET status = 'available'
WHERE status IS NULL;

-- Drop existing default if any
ALTER TABLE properties
ALTER COLUMN status DROP DEFAULT;

-- Now alter the column type to use the enum
ALTER TABLE properties
ALTER COLUMN status TYPE property_status
USING status::property_status;

-- Set default value for new properties
ALTER TABLE properties
ALTER COLUMN status SET DEFAULT 'available'::property_status;

-- Set NOT NULL constraint
ALTER TABLE properties
ALTER COLUMN status SET NOT NULL;

-- Add index for filtering by status (improves query performance)
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);

-- Add index for filtering sold properties (used in Ministry exports)
CREATE INDEX IF NOT EXISTS idx_properties_not_sold ON properties(status)
WHERE status != 'sold';

-- Update RLS policies to allow property status updates
-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;

-- Recreate update policy with status column allowed
CREATE POLICY "Users can update their own properties"
ON properties
FOR UPDATE
TO authenticated
USING (developer_id = auth.uid())
WITH CHECK (developer_id = auth.uid());

-- Add comment for documentation
COMMENT ON TYPE property_status IS 'Property availability status: available (on market), sold (transaction completed), reserved (hold for buyer)';
COMMENT ON COLUMN properties.status IS 'Current availability status of the property';
