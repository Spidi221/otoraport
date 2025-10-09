-- Create onboarding_progress table to track user onboarding flow
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1,
  completed_steps INTEGER[] NOT NULL DEFAULT '{}',
  skipped_steps INTEGER[] NOT NULL DEFAULT '{}',
  has_logo BOOLEAN NOT NULL DEFAULT false,
  has_csv BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add onboarding_completed column to developers table
ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Add company info columns to developers table (if not exist)
-- Note: company_name already exists, so we skip it
ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;
-- logo_url not needed as we have branding_logo_url

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON public.onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_developers_onboarding_completed ON public.developers(onboarding_completed);

-- Enable RLS on onboarding_progress table
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_progress
CREATE POLICY "Users can view their own onboarding progress"
  ON public.onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
  ON public.onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
  ON public.onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding progress"
  ON public.onboarding_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_onboarding_progress
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.onboarding_progress IS 'Tracks user progress through the onboarding wizard';
COMMENT ON COLUMN public.onboarding_progress.current_step IS 'Current step in onboarding wizard (1-6)';
COMMENT ON COLUMN public.onboarding_progress.completed_steps IS 'Array of completed step numbers';
COMMENT ON COLUMN public.onboarding_progress.skipped_steps IS 'Array of skipped step numbers';
COMMENT ON COLUMN public.onboarding_progress.has_logo IS 'Whether user uploaded a logo';
COMMENT ON COLUMN public.onboarding_progress.has_csv IS 'Whether user uploaded CSV data';
