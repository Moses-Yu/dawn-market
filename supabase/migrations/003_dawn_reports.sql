-- Dawn Reports: stores individual reports from the 7-report pipeline
CREATE TABLE dawn_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number INTEGER NOT NULL CHECK (report_number BETWEEN 1 AND 7),
  report_type TEXT NOT NULL CHECK (report_type IN (
    'us-market', 'semiconductor', 'geopolitical', 'currency',
    'asian-premarket', 'technical', 'dawn-briefing'
  )),
  date DATE NOT NULL,
  data_window_start TIMESTAMPTZ NOT NULL,
  data_window_end TIMESTAMPTZ NOT NULL,
  content JSONB NOT NULL,
  input_data JSONB DEFAULT '{}',
  model_used TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dawn_reports_date ON dawn_reports (date DESC);
CREATE INDEX idx_dawn_reports_type ON dawn_reports (report_type);
CREATE UNIQUE INDEX idx_dawn_reports_date_type ON dawn_reports (date, report_type);

-- RLS
ALTER TABLE dawn_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read dawn reports"
  ON dawn_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role has full access to dawn reports"
  ON dawn_reports FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
