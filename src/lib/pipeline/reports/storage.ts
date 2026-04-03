import { createClient } from "@supabase/supabase-js";
import type { Report, ReportSet, ReportType } from "./types";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key);
}

export async function storeReport(report: Report): Promise<string> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("dawn_reports")
    .upsert(
      {
        report_number: report.reportNumber,
        report_type: report.reportType,
        date: report.date,
        data_window_start: report.dataWindowStart,
        data_window_end: report.dataWindowEnd,
        content: report.content,
        model_used: report.modelUsed,
        tokens_used: report.tokensUsed,
      },
      { onConflict: "date,report_type" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`storeReport: ${error.message}`);
  return data.id;
}

export async function getReportsByDate(date: string): Promise<Report[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("dawn_reports")
    .select("*")
    .eq("date", date)
    .order("report_number", { ascending: true });

  if (error) throw new Error(`getReportsByDate: ${error.message}`);

  return (data || []).map((row) => ({
    reportNumber: row.report_number,
    reportType: row.report_type as ReportType,
    title: row.content?.headline || "",
    date: row.date,
    dataWindowStart: row.data_window_start,
    dataWindowEnd: row.data_window_end,
    content: row.content,
    generatedAt: row.created_at,
    modelUsed: row.model_used,
    tokensUsed: row.tokens_used,
  }));
}

export async function getLatestReportSet(): Promise<ReportSet | null> {
  const supabase = getServiceClient();

  // Get the most recent date that has reports
  const { data: latest, error: latestError } = await supabase
    .from("dawn_reports")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (latestError || !latest) return null;

  const reports = await getReportsByDate(latest.date);
  if (reports.length === 0) return null;

  return {
    date: latest.date,
    dataWindowStart: reports[0].dataWindowStart,
    dataWindowEnd: reports[0].dataWindowEnd,
    reports,
    generatedAt: reports[reports.length - 1].generatedAt,
  };
}

export async function getReportSetDates(
  limit: number = 30
): Promise<{ date: string; reportCount: number }[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("dawn_reports")
    .select("date, report_number")
    .order("date", { ascending: false })
    .limit(limit * 7); // max 7 reports per date

  if (error) throw new Error(`getReportSetDates: ${error.message}`);

  const dateMap = new Map<string, number>();
  for (const row of data || []) {
    dateMap.set(row.date, (dateMap.get(row.date) || 0) + 1);
  }

  return Array.from(dateMap.entries())
    .map(([date, reportCount]) => ({ date, reportCount }))
    .slice(0, limit);
}
