-- Sector expansion: add new categories and report types
-- Supports: 조선/방산, AI 인프라, 2차전지

-- Update article_summaries category CHECK to include new sectors
ALTER TABLE article_summaries DROP CONSTRAINT IF EXISTS article_summaries_category_check;
ALTER TABLE article_summaries ADD CONSTRAINT article_summaries_category_check
  CHECK (category IN ('semiconductor', 'shipbuilding-defense', 'ai-infra', 'secondary-battery', 'geopolitics', 'market', 'general'));

-- Update dawn_reports report_type CHECK to include new sector reports
ALTER TABLE dawn_reports DROP CONSTRAINT IF EXISTS dawn_reports_report_type_check;
ALTER TABLE dawn_reports ADD CONSTRAINT dawn_reports_report_type_check
  CHECK (report_type IN (
    'us-market', 'semiconductor', 'shipbuilding-defense', 'ai-infra', 'secondary-battery',
    'geopolitical', 'currency', 'asian-premarket', 'technical', 'dawn-briefing'
  ));

-- Update report_number CHECK to allow 1-10 (was 1-7)
ALTER TABLE dawn_reports DROP CONSTRAINT IF EXISTS dawn_reports_report_number_check;
ALTER TABLE dawn_reports ADD CONSTRAINT dawn_reports_report_number_check
  CHECK (report_number BETWEEN 1 AND 10);
