-- Premium Reports: weekly/monthly sector reports for Premium subscribers
-- Also supports single-report purchases (3,900~9,900원)

CREATE TABLE premium_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_period TEXT NOT NULL CHECK (report_period IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sector TEXT NOT NULL CHECK (sector IN (
    'semiconductor', 'shipbuilding-defense', 'ai-infra', 'secondary-battery',
    'market-overview', 'geopolitical', 'all-sectors'
  )),
  title TEXT NOT NULL,
  summary TEXT,                    -- short preview visible to all users
  content JSONB NOT NULL,          -- full structured report content
  price_krw INTEGER DEFAULT 0,    -- 0 = included in premium, >0 = single purchase price
  model_used TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_premium_reports_period ON premium_reports (report_period, period_start DESC);
CREATE INDEX idx_premium_reports_sector ON premium_reports (sector);
CREATE UNIQUE INDEX idx_premium_reports_unique ON premium_reports (report_period, period_start, sector);

-- Report purchases: tracks single-report sales
CREATE TABLE report_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  premium_report_id UUID NOT NULL REFERENCES premium_reports(id),
  amount_krw INTEGER NOT NULL,
  toss_payment_key TEXT,           -- Toss Payments reference
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_purchases_user ON report_purchases (user_id);
CREATE INDEX idx_report_purchases_report ON report_purchases (premium_report_id);
CREATE UNIQUE INDEX idx_report_purchases_unique ON report_purchases (user_id, premium_report_id);

-- RLS for premium_reports
ALTER TABLE premium_reports ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see report metadata (title, summary, period info)
-- Full content is gated in the API layer based on subscription/purchase status
CREATE POLICY "Authenticated users can read premium reports"
  ON premium_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role has full access to premium reports"
  ON premium_reports FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS for report_purchases
ALTER TABLE report_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases"
  ON report_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to report purchases"
  ON report_purchases FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
