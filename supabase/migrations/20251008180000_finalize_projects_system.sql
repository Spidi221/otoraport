-- ============================================================================
-- MIGRATION: Finalize Projects (Inwestycje) System for OTORAPORT
-- Date: 2025-10-08
-- Task: #52 - Projects System Implementation
-- ============================================================================
-- This migration:
-- 1. Verifies projects table exists (currently used for presentations)
-- 2. Ensures status enum exists for project management
-- 3. Creates comprehensive RLS policies for projects
-- 4. Adds indexes for performance
-- 5. Ensures properties.project_id foreign key exists
-- ============================================================================

-- ====================
-- 1. ENSURE STATUS ENUM EXISTS
-- ====================
DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

COMMENT ON TYPE project_status IS 'Project status: active (currently used), inactive (paused), archived (completed/cancelled)';

-- ====================
-- 2. ADD STATUS COLUMN TO EXISTING PROJECTS TABLE
-- ====================
-- The projects table already exists with presentation-related columns
-- Add status column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'active' NOT NULL;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;
END $$;

-- ====================
-- 3. ADD CONSTRAINTS FOR DATA INTEGRITY
-- ====================
-- Ensure project names are not empty
DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_name_not_empty CHECK (char_length(name) > 0);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_name_max_length CHECK (char_length(name) <= 200);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- ====================
-- 4. CREATE PERFORMANCE INDEXES
-- ====================
-- Index on developer_id for fast lookup of developer's projects
CREATE INDEX IF NOT EXISTS idx_projects_developer_id
ON projects(developer_id);

-- Index on status for filtering active/inactive projects
CREATE INDEX IF NOT EXISTS idx_projects_status
ON projects(status);

-- Composite index for most common query (developer's active projects)
CREATE INDEX IF NOT EXISTS idx_projects_developer_status
ON projects(developer_id, status);

-- Index on slug for fast presentation page lookups
CREATE INDEX IF NOT EXISTS idx_projects_slug
ON projects(slug);

-- ====================
-- 5. ENABLE ROW LEVEL SECURITY
-- ====================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ====================
-- 6. DROP EXISTING POLICIES (IF ANY)
-- ====================
DROP POLICY IF EXISTS "Developers can view their own projects" ON projects;
DROP POLICY IF EXISTS "Developers can create their own projects" ON projects;
DROP POLICY IF EXISTS "Developers can update their own projects" ON projects;
DROP POLICY IF EXISTS "Developers can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Public can view enabled presentation projects" ON projects;

-- ====================
-- 7. CREATE COMPREHENSIVE RLS POLICIES
-- ====================

-- POLICY 1: SELECT - Developers can only see their own projects
CREATE POLICY "Developers can view their own projects"
ON projects FOR SELECT
TO authenticated
USING (developer_id = auth.uid());

-- POLICY 2: INSERT - Developers can create projects (limit checked in API layer)
CREATE POLICY "Developers can create their own projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (developer_id = auth.uid());

-- POLICY 3: UPDATE - Developers can update their own projects
CREATE POLICY "Developers can update their own projects"
ON projects FOR UPDATE
TO authenticated
USING (developer_id = auth.uid())
WITH CHECK (developer_id = auth.uid());

-- POLICY 4: DELETE - Developers can delete their own projects
CREATE POLICY "Developers can delete their own projects"
ON projects FOR DELETE
TO authenticated
USING (developer_id = auth.uid());

-- POLICY 5: Public read access for presentation-enabled projects (for future marketing pages)
CREATE POLICY "Public can view enabled presentation projects"
ON projects FOR SELECT
TO anon
USING (presentation_enabled = true);

-- ====================
-- 8. CREATE/UPDATE TRIGGER FOR updated_at
-- ====================
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_projects_updated_at ON projects;

CREATE TRIGGER trigger_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_projects_updated_at();

-- ====================
-- 9. ENSURE PROPERTIES.PROJECT_ID FOREIGN KEY
-- ====================
-- Verify properties.project_id column exists with proper foreign key
DO $$ BEGIN
  ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;
END $$;

-- Create index for properties.project_id lookups
CREATE INDEX IF NOT EXISTS idx_properties_project_id
ON properties(project_id);

-- ====================
-- 10. ADD TABLE AND COLUMN COMMENTS
-- ====================
COMMENT ON TABLE projects IS 'Investment projects (inwestycje) managed by developers. Used both for property organization and optional public presentation pages.';
COMMENT ON COLUMN projects.status IS 'Project status: active (currently used), inactive (paused), archived (completed/cancelled)';
COMMENT ON COLUMN projects.presentation_enabled IS 'When true, project has a public presentation page accessible via slug or custom_domain';
COMMENT ON COLUMN projects.slug IS 'URL-friendly identifier for presentation pages (e.g., "osiedle-sloneczne-2025")';
COMMENT ON COLUMN projects.custom_domain IS 'Optional custom domain for Enterprise plan (e.g., "ceny.developer.pl")';
COMMENT ON COLUMN properties.project_id IS 'Optional reference to parent project/investment for organizational purposes';

-- ====================
-- 11. GRANT PERMISSIONS
-- ====================
-- Ensure authenticated users can access projects table
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT ON projects TO anon;

-- ====================
-- MIGRATION COMPLETE
-- ====================
-- Projects system is now ready with:
-- ✅ Status column for project lifecycle management
-- ✅ RLS policies ensuring data isolation
-- ✅ Performance indexes
-- ✅ Foreign key relationship with properties
-- ✅ Automatic updated_at trigger
-- ============================================================================
