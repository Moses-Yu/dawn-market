-- Expand dawn_reports to support 10 report types (was 7)
-- New sector reports: shipbuilding-defense, ai-infra, secondary-battery

-- Drop and recreate report_number constraint
ALTER TABLE dawn_reports DROP CONSTRAINT IF EXISTS dawn_reports_report_number_check;
ALTER TABLE dawn_reports ADD CONSTRAINT dawn_reports_report_number_check
  CHECK (report_number BETWEEN 1 AND 10);

-- Drop and recreate report_type constraint
ALTER TABLE dawn_reports DROP CONSTRAINT IF EXISTS dawn_reports_report_type_check;
ALTER TABLE dawn_reports ADD CONSTRAINT dawn_reports_report_type_check
  CHECK (report_type IN (
    'us-market', 'semiconductor', 'shipbuilding-defense', 'ai-infra',
    'secondary-battery', 'geopolitical', 'currency',
    'asian-premarket', 'technical', 'dawn-briefing'
  ));
