-- Fix: add bio-healthcare and finance to dawn_reports CHECK constraints
-- These report types were added in code (MO-83) but the DB constraint was never updated.
-- Also expand report_number to 1-12 to match the full 12-report pipeline.

-- Update report_type CHECK to include all 12 report types
ALTER TABLE dawn_reports DROP CONSTRAINT IF EXISTS dawn_reports_report_type_check;
ALTER TABLE dawn_reports ADD CONSTRAINT dawn_reports_report_type_check
  CHECK (report_type IN (
    'us-market', 'semiconductor', 'shipbuilding-defense', 'ai-infra',
    'secondary-battery', 'bio-healthcare', 'finance', 'geopolitical',
    'currency', 'asian-premarket', 'technical', 'dawn-briefing'
  ));

-- Update report_number CHECK to allow 1-12
ALTER TABLE dawn_reports DROP CONSTRAINT IF EXISTS dawn_reports_report_number_check;
ALTER TABLE dawn_reports ADD CONSTRAINT dawn_reports_report_number_check
  CHECK (report_number BETWEEN 1 AND 12);
