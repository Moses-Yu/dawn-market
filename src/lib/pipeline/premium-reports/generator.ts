import type { ReportContent } from "../reports/types";
import type { PremiumSector } from "./types";

/** Fetch daily reports for a date range and specific report types from Supabase */
export async function fetchDailyReportsForPeriod(
  periodStart: string,
  periodEnd: string,
  sector: PremiumSector
): Promise<{ reports: ReportContent[]; dates: string[] }> {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");

  const supabase = createClient(url, key);
  const { SECTOR_TO_REPORT_TYPES } = await import("./types");
  const reportTypes = SECTOR_TO_REPORT_TYPES[sector];

  const { data, error } = await supabase
    .from("dawn_reports")
    .select("date, content, report_type")
    .gte("date", periodStart)
    .lte("date", periodEnd)
    .in("report_type", reportTypes)
    .order("date", { ascending: true });

  if (error) throw new Error(`fetchDailyReports: ${error.message}`);

  const reports: ReportContent[] = [];
  const dates: string[] = [];

  const byDate = new Map<string, ReportContent[]>();
  for (const row of data || []) {
    const existing = byDate.get(row.date) || [];
    existing.push(row.content as ReportContent);
    byDate.set(row.date, existing);
  }

  for (const [date, contents] of byDate) {
    const merged: ReportContent = {
      headline: contents.map((c) => c.headline).join(" | "),
      sections: contents.flatMap((c) => c.sections),
      prediction: contents[0].prediction,
      keyTakeaways: contents.flatMap((c) => c.keyTakeaways),
    };
    dates.push(date);
    reports.push(merged);
  }

  return { reports, dates };
}
