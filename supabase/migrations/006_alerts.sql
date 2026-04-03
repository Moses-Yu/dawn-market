-- Real-time alert system: severity-classified overnight alerts

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('긴급', '주의', '참고')),
  category TEXT NOT NULL CHECK (category IN (
    'semiconductor', 'shipbuilding-defense', 'ai-infra', 'secondary-battery',
    'geopolitics', 'market', 'general'
  )),
  sentiment TEXT NOT NULL CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
  source_article_ids TEXT[] DEFAULT '{}',
  pushed BOOLEAN DEFAULT false,
  pushed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_created_at ON alerts (created_at DESC);
CREATE INDEX idx_alerts_severity ON alerts (severity);
CREATE INDEX idx_alerts_category ON alerts (category);

-- Track nightly alert counts for rate limiting
CREATE TABLE alert_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  night_date DATE NOT NULL,
  alert_count INTEGER NOT NULL DEFAULT 0,
  last_alert_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_alert_rate_limits_night ON alert_rate_limits (night_date);

-- RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rate_limits ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read alerts
CREATE POLICY "Authenticated users can read alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (true);

-- Anonymous can also read alerts (public access)
CREATE POLICY "Anonymous can read alerts"
  ON alerts FOR SELECT
  TO anon
  USING (true);

-- Service role has full access
CREATE POLICY "Service role full access to alerts"
  ON alerts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to alert rate limits"
  ON alert_rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
