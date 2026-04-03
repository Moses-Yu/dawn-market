-- 용어 사전 (Glossary) for beginner Korean investors
CREATE TABLE glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_ko TEXT NOT NULL,
  term_en TEXT,
  definition_ko TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'semiconductor', 'shipbuilding-defense', 'ai-infra', 'secondary-battery',
    'geopolitics', 'market', 'general'
  )),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  related_terms TEXT[] DEFAULT '{}',
  example_ko TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_glossary_terms_term_ko ON glossary_terms (term_ko);
CREATE INDEX idx_glossary_terms_category ON glossary_terms (category);
CREATE INDEX idx_glossary_terms_difficulty ON glossary_terms (difficulty);

-- RLS
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read glossary terms"
  ON glossary_terms FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role has full access to glossary terms"
  ON glossary_terms FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
