-- Raw articles collected from RSS feeds and news sources
CREATE TABLE IF NOT EXISTS raw_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id TEXT UNIQUE NOT NULL,
  source_name TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  content TEXT,
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_raw_articles_collected_at ON raw_articles (collected_at DESC);
CREATE INDEX idx_raw_articles_source_name ON raw_articles (source_name);

-- Market data snapshots (prices, changes)
CREATE TABLE IF NOT EXISTS market_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change NUMERIC NOT NULL DEFAULT 0,
  change_percent NUMERIC NOT NULL DEFAULT 0,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_market_snapshots_collected_at ON market_snapshots (collected_at DESC);
CREATE INDEX idx_market_snapshots_symbol ON market_snapshots (symbol);

-- AI-generated article summaries
CREATE TABLE IF NOT EXISTS article_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_source_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary_ko TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('semiconductor', 'geopolitics', 'market', 'general')),
  severity TEXT NOT NULL CHECK (severity IN ('긴급', '주의', '참고')),
  sentiment TEXT NOT NULL CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
  sector_impact TEXT[] DEFAULT '{}',
  key_takeaway TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_article_summaries_category ON article_summaries (category);
CREATE INDEX idx_article_summaries_severity ON article_summaries (severity);

-- Morning briefings (composed from summaries + market data)
CREATE TABLE IF NOT EXISTS morning_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  market_overview JSONB NOT NULL,
  top_stories JSONB NOT NULL,
  sector_analysis JSONB NOT NULL,
  action_items JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_morning_briefings_date ON morning_briefings (date DESC);

-- Enable RLS
ALTER TABLE raw_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_briefings ENABLE ROW LEVEL SECURITY;

-- Public read access for briefings (authenticated users)
CREATE POLICY "Authenticated users can read briefings"
  ON morning_briefings FOR SELECT
  TO authenticated
  USING (true);

-- Service role has full access (pipeline writes via service key)
