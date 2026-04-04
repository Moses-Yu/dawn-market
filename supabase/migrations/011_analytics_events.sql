-- Analytics events table for tracking user behavior
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'general',
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  page_path TEXT,
  referrer TEXT,
  properties JSONB DEFAULT '{}',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_page ON analytics_events(page_path);

-- User feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  feedback_type TEXT NOT NULL DEFAULT 'general',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  page_path TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_feedback_status ON user_feedback(status);
CREATE INDEX idx_user_feedback_created ON user_feedback(created_at);
CREATE INDEX idx_user_feedback_type ON user_feedback(feedback_type);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (anonymous tracking)
CREATE POLICY "Allow anonymous event inserts" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Allow inserts for feedback from anyone
CREATE POLICY "Allow anonymous feedback inserts" ON user_feedback
  FOR INSERT WITH CHECK (true);

-- Only service role can read (admin dashboard)
CREATE POLICY "Service role reads analytics" ON analytics_events
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role reads feedback" ON user_feedback
  FOR SELECT USING (auth.role() = 'service_role');
