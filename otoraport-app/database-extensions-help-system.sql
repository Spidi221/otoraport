-- Database extensions for In-app Help & Proactive Support System
-- Run this in Supabase SQL Editor

-- Table for storing support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id text PRIMARY KEY,
  user_id uuid REFERENCES public.developers(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category text NOT NULL DEFAULT 'general_inquiry',
  context_data jsonb,
  assigned_to text,
  resolved_at timestamptz,
  satisfaction_rating integer CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table for tracking guided tour progress
CREATE TABLE IF NOT EXISTS public.tour_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.developers(id) ON DELETE CASCADE,
  tour_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('tour_started', 'step_started', 'step_completed', 'tour_completed', 'tour_skipped')),
  step_index integer,
  completion_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table for tracking help resource usage
CREATE TABLE IF NOT EXISTS public.help_resource_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.developers(id) ON DELETE CASCADE,
  resource_id text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('view', 'helpful', 'not_helpful')),
  context_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table for chatbot interactions
CREATE TABLE IF NOT EXISTS public.chatbot_interactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.developers(id) ON DELETE CASCADE,
  query text NOT NULL,
  response text NOT NULL,
  confidence_score decimal(3,2),
  context_data jsonb,
  escalated_to_human boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add help-related columns to developers table
ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS help_tours_completed text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_help_interaction timestamptz;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_tour_progress_user_id ON public.tour_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_progress_tour_id ON public.tour_progress(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_progress_event_type ON public.tour_progress(event_type);

CREATE INDEX IF NOT EXISTS idx_help_resource_usage_user_id ON public.help_resource_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_help_resource_usage_resource_id ON public.help_resource_usage(resource_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_user_id ON public.chatbot_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_created_at ON public.chatbot_interactions(created_at);

-- RLS Policies
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_resource_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_interactions ENABLE ROW LEVEL SECURITY;

-- Support tickets policies
CREATE POLICY "Users can view their own support tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Tour progress policies
CREATE POLICY "Users can view their own tour progress" ON public.tour_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tour progress" ON public.tour_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Help resource usage policies
CREATE POLICY "Users can view their own resource usage" ON public.help_resource_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own resource usage" ON public.help_resource_usage
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Chatbot interactions policies
CREATE POLICY "Users can view their own chatbot interactions" ON public.chatbot_interactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chatbot interactions" ON public.chatbot_interactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Function to update support ticket timestamps
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for support tickets
DROP TRIGGER IF EXISTS trigger_update_support_ticket_timestamp ON public.support_tickets;
CREATE TRIGGER trigger_update_support_ticket_timestamp
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_timestamp();

-- Function to get help system analytics
CREATE OR REPLACE FUNCTION get_help_system_analytics(
  start_date timestamptz DEFAULT now() - interval '30 days',
  end_date timestamptz DEFAULT now()
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'support_tickets', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'open', COUNT(*) FILTER (WHERE status = 'open'),
        'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
        'avg_resolution_time_hours',
          EXTRACT(EPOCH FROM AVG(resolved_at - created_at))/3600
          FILTER (WHERE resolved_at IS NOT NULL)
      )
      FROM public.support_tickets
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'tour_completion', (
      SELECT jsonb_object_agg(
        tour_id,
        jsonb_build_object(
          'started', started_count,
          'completed', completed_count,
          'completion_rate',
            CASE WHEN started_count > 0
              THEN completed_count::float / started_count::float
              ELSE 0
            END
        )
      )
      FROM (
        SELECT
          tour_id,
          COUNT(*) FILTER (WHERE event_type = 'tour_started') as started_count,
          COUNT(*) FILTER (WHERE event_type = 'tour_completed') as completed_count
        FROM public.tour_progress
        WHERE created_at BETWEEN start_date AND end_date
        GROUP BY tour_id
      ) tour_stats
    ),
    'chatbot_interactions', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'avg_confidence', AVG(confidence_score),
        'escalations', COUNT(*) FILTER (WHERE escalated_to_human = true),
        'escalation_rate',
          (COUNT(*) FILTER (WHERE escalated_to_human = true))::float / COUNT(*)::float
      )
      FROM public.chatbot_interactions
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'help_resources', (
      SELECT jsonb_build_object(
        'total_views', COUNT(*) FILTER (WHERE action_type = 'view'),
        'helpful_votes', COUNT(*) FILTER (WHERE action_type = 'helpful'),
        'not_helpful_votes', COUNT(*) FILTER (WHERE action_type = 'not_helpful'),
        'helpfulness_ratio',
          CASE WHEN COUNT(*) FILTER (WHERE action_type IN ('helpful', 'not_helpful')) > 0
            THEN (COUNT(*) FILTER (WHERE action_type = 'helpful'))::float /
                 (COUNT(*) FILTER (WHERE action_type IN ('helpful', 'not_helpful')))::float
            ELSE 0
          END
      )
      FROM public.help_resource_usage
      WHERE created_at BETWEEN start_date AND end_date
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user help engagement score
CREATE OR REPLACE FUNCTION get_user_help_engagement_score(user_uuid uuid)
RETURNS decimal AS $$
DECLARE
  engagement_score decimal := 0;
  recent_interactions integer;
  tours_completed integer;
  helpful_votes integer;
BEGIN
  -- Recent help interactions (last 30 days)
  SELECT COUNT(*) INTO recent_interactions
  FROM (
    SELECT created_at FROM public.help_resource_usage WHERE user_id = user_uuid AND created_at > now() - interval '30 days'
    UNION ALL
    SELECT created_at FROM public.chatbot_interactions WHERE user_id = user_uuid AND created_at > now() - interval '30 days'
    UNION ALL
    SELECT created_at FROM public.tour_progress WHERE user_id = user_uuid AND created_at > now() - interval '30 days'
  ) all_interactions;

  -- Tours completed
  SELECT COUNT(DISTINCT tour_id) INTO tours_completed
  FROM public.tour_progress
  WHERE user_id = user_uuid AND event_type = 'tour_completed';

  -- Helpful votes given
  SELECT COUNT(*) INTO helpful_votes
  FROM public.help_resource_usage
  WHERE user_id = user_uuid AND action_type = 'helpful';

  -- Calculate engagement score (0-100)
  engagement_score := LEAST(100, (
    (recent_interactions * 5) +  -- 5 points per recent interaction
    (tours_completed * 20) +     -- 20 points per tour completed
    (helpful_votes * 3)          -- 3 points per helpful vote
  ));

  RETURN engagement_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for support ticket analytics
CREATE OR REPLACE VIEW support_ticket_analytics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  priority,
  status,
  category,
  COUNT(*) as ticket_count,
  AVG(EXTRACT(EPOCH FROM resolved_at - created_at))/3600 as avg_resolution_hours
FROM public.support_tickets
WHERE created_at > now() - interval '90 days'
GROUP BY DATE_TRUNC('day', created_at), priority, status, category
ORDER BY date DESC;

-- Grants for service role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;