import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const REPORT_TYPES = [
  "us-market",
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
  "bio-healthcare",
  "finance",
  "geopolitical",
  "dawn-briefing",
];

/**
 * GET /api/health/pipeline
 *
 * Content pipeline status monitoring endpoint.
 * Checks whether today's reports were generated and stored.
 * Links to MO-69 daily content pipeline automation.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get KST date
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const today = kst.toISOString().slice(0, 10);
    const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    // Check today's reports
    const { data: todayReports, error: todayErr } = await supabase
      .from("reports")
      .select("report_type, created_at")
      .eq("date", today);

    if (todayErr) throw todayErr;

    // Check yesterday's reports for comparison
    const { data: yesterdayReports, error: yesterdayErr } = await supabase
      .from("reports")
      .select("report_type, created_at")
      .eq("date", yesterday);

    if (yesterdayErr) throw yesterdayErr;

    // Check latest data collection
    const { data: latestArticles, error: articleErr } = await supabase
      .from("raw_articles")
      .select("collected_at")
      .order("collected_at", { ascending: false })
      .limit(1);

    if (articleErr) throw articleErr;

    const { data: latestSnapshots, error: snapErr } = await supabase
      .from("market_snapshots")
      .select("collected_at")
      .order("collected_at", { ascending: false })
      .limit(1);

    if (snapErr) throw snapErr;

    const todayTypes = new Set((todayReports ?? []).map((r) => r.report_type));
    const missingToday = REPORT_TYPES.filter((t) => !todayTypes.has(t));

    const yesterdayTypes = new Set(
      (yesterdayReports ?? []).map((r) => r.report_type)
    );

    // Determine pipeline health
    const isAfterExpectedRun = kst.getHours() >= 6; // Pipeline runs at 06:00 KST
    const pipelineHealthy =
      !isAfterExpectedRun || missingToday.length === 0;

    return NextResponse.json({
      status: pipelineHealthy ? "healthy" : "degraded",
      date: today,
      kstHour: kst.getHours(),
      today: {
        reportsGenerated: todayReports?.length ?? 0,
        expectedReports: REPORT_TYPES.length,
        missingTypes: missingToday,
        reportTypes: Array.from(todayTypes),
      },
      yesterday: {
        reportsGenerated: yesterdayReports?.length ?? 0,
        reportTypes: Array.from(yesterdayTypes),
      },
      dataCollection: {
        lastArticleAt: latestArticles?.[0]?.collected_at ?? null,
        lastSnapshotAt: latestSnapshots?.[0]?.collected_at ?? null,
      },
      isAfterExpectedRun,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
