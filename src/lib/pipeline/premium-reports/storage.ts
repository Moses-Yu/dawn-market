import { createClient } from "@supabase/supabase-js";
import type {
  PremiumReport,
  PremiumReportPeriod,
  PremiumSector,
  ReportPurchase,
} from "./types";

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

export async function storePremiumReport(
  report: Omit<PremiumReport, "id" | "createdAt">
): Promise<string> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("premium_reports")
    .upsert(
      {
        report_period: report.reportPeriod,
        period_start: report.periodStart,
        period_end: report.periodEnd,
        sector: report.sector,
        title: report.title,
        summary: report.summary,
        content: report.content,
        price_krw: report.priceKrw,
        model_used: report.modelUsed,
        tokens_used: report.tokensUsed,
      },
      { onConflict: "report_period,period_start,sector" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`storePremiumReport: ${error.message}`);
  return data.id;
}

export async function getPremiumReports(opts: {
  period?: PremiumReportPeriod;
  sector?: PremiumSector;
  limit?: number;
}): Promise<PremiumReport[]> {
  const supabase = getServiceClient();
  const { period, sector, limit = 20 } = opts;

  let query = supabase
    .from("premium_reports")
    .select("*")
    .order("period_start", { ascending: false })
    .limit(limit);

  if (period) query = query.eq("report_period", period);
  if (sector) query = query.eq("sector", sector);

  const { data, error } = await query;
  if (error) throw new Error(`getPremiumReports: ${error.message}`);

  return (data || []).map(mapRowToReport);
}

export async function getPremiumReportById(
  id: string
): Promise<PremiumReport | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("premium_reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapRowToReport(data);
}

export async function getUserPurchases(
  userId: string
): Promise<ReportPurchase[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("report_purchases")
    .select("*")
    .eq("user_id", userId)
    .order("purchased_at", { ascending: false });

  if (error) throw new Error(`getUserPurchases: ${error.message}`);

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    premiumReportId: row.premium_report_id,
    amountKrw: row.amount_krw,
    tossPaymentKey: row.toss_payment_key,
    purchasedAt: row.purchased_at,
  }));
}

export async function hasUserPurchased(
  userId: string,
  reportId: string
): Promise<boolean> {
  const supabase = getServiceClient();

  const { count, error } = await supabase
    .from("report_purchases")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("premium_report_id", reportId);

  if (error) return false;
  return (count ?? 0) > 0;
}

export async function createPurchase(purchase: {
  userId: string;
  premiumReportId: string;
  amountKrw: number;
  tossPaymentKey?: string;
}): Promise<string> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("report_purchases")
    .insert({
      user_id: purchase.userId,
      premium_report_id: purchase.premiumReportId,
      amount_krw: purchase.amountKrw,
      toss_payment_key: purchase.tossPaymentKey || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`createPurchase: ${error.message}`);
  return data.id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToReport(row: any): PremiumReport {
  return {
    id: row.id,
    reportPeriod: row.report_period,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    sector: row.sector,
    title: row.title,
    summary: row.summary,
    content: row.content,
    priceKrw: row.price_krw,
    modelUsed: row.model_used,
    tokensUsed: row.tokens_used,
    createdAt: row.created_at,
  };
}
