-- Migration: Add notifications table and email preferences
-- Date: 2025-10-07
-- Description: Creates notifications system and adds email preference columns to developers

-- ============================================================================
-- PART 1: Create notifications table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('upload_complete', 'upload_error', 'ministry_sync', 'system_announcement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_developer_id
  ON public.notifications(developer_id);

CREATE INDEX IF NOT EXISTS idx_notifications_developer_read_created
  ON public.notifications(developer_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Developers can only access their own notifications
DROP POLICY IF EXISTS "Developers can view own notifications" ON public.notifications;
CREATE POLICY "Developers can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (
    developer_id IN (
      SELECT id FROM public.developers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Developers can update own notifications" ON public.notifications;
CREATE POLICY "Developers can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    developer_id IN (
      SELECT id FROM public.developers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Developers can delete own notifications" ON public.notifications;
CREATE POLICY "Developers can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (
    developer_id IN (
      SELECT id FROM public.developers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PART 2: Add email preference columns to developers table
-- ============================================================================

-- Add email_notifications_enabled column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE public.developers
    ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Add notification_frequency column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'developers'
    AND column_name = 'notification_frequency'
  ) THEN
    ALTER TABLE public.developers
    ADD COLUMN notification_frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (notification_frequency IN ('daily', 'weekly', 'never'));
  END IF;
END $$;

-- ============================================================================
-- PART 3: Verify property status column (should already exist)
-- ============================================================================

-- Add status column to properties if it doesn't exist (likely already exists from Task #39)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'properties'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.properties
    ADD COLUMN status TEXT DEFAULT 'available'
    CHECK (status IN ('available', 'sold', 'reserved'));
  END IF;
END $$;

-- Create index on property status if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_properties_status
  ON public.properties(status);

-- Create compound index for efficient queries
CREATE INDEX IF NOT EXISTS idx_properties_developer_status
  ON public.properties(developer_id, status);

-- ============================================================================
-- PART 4: Comments for documentation
-- ============================================================================

COMMENT ON TABLE public.notifications IS 'Stores user notifications for uploads, ministry sync, and system announcements';
COMMENT ON COLUMN public.developers.email_notifications_enabled IS 'Whether user wants to receive email notifications';
COMMENT ON COLUMN public.developers.notification_frequency IS 'How often to send email summaries: daily, weekly, or never';
COMMENT ON COLUMN public.properties.status IS 'Property availability status: available, sold, or reserved';
