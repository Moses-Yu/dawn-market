-- Subscriptions and payment history for Toss Payments integration

-- 1. Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
  toss_customer_key TEXT,
  toss_billing_key TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_user ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions (current_period_end)
  WHERE status = 'active';

-- RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Payment history table
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  toss_payment_key TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KRW',
  status TEXT NOT NULL CHECK (status IN ('paid', 'failed', 'refunded', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payment_history_user ON payment_history (user_id);
CREATE INDEX idx_payment_history_subscription ON payment_history (subscription_id);

-- RLS for payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment history"
  ON payment_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to payment history"
  ON payment_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Update dawn_reports RLS: Pro gating for non-briefing reports
-- Drop the existing permissive read policy
DROP POLICY IF EXISTS "Authenticated users can read dawn reports" ON dawn_reports;

-- New policy: dawn-briefing is free for all authenticated, other reports require active Pro/Premium
CREATE POLICY "Gated report access by subscription tier"
  ON dawn_reports FOR SELECT
  TO authenticated
  USING (
    report_type = 'dawn-briefing'
    OR EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = auth.uid()
      AND subscriptions.tier IN ('pro', 'premium')
      AND subscriptions.status = 'active'
      AND subscriptions.current_period_end > now()
    )
  );
