import { NextResponse } from "next/server";
import {
  runPremiumReportPipeline,
  getPremiumReports,
  getLastWeekRange,
  getLastMonthRange,
} from "@/lib/pipeline/premium-reports";
import type { PremiumReportPeriod, PremiumSector } from "@/lib/pipeline/premium-reports";

/**
 * POST /api/pipeline/premium-reports
 * Trigger premium report generation. Protected by PIPELINE_API_KEY.
 *
 * Body: { period: "weekly"|"monthly", periodStart?, periodEnd?, sectors?: string[] }
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const period: PremiumReportPeriod = body.period || "weekly";

    let periodStart: string;
    let periodEnd: string;

    if (body.periodStart && body.periodEnd) {
      periodStart = body.periodStart;
      periodEnd = body.periodEnd;
    } else if (period === "weekly") {
      const range = getLastWeekRange();
      periodStart = range.start;
      periodEnd = range.end;
    } else {
      const range = getLastMonthRange();
      periodStart = range.start;
      periodEnd = range.end;
    }

    const sectors: PremiumSector[] | undefined = body.sectors;

    const result = await runPremiumReportPipeline({
      period,
      periodStart,
      periodEnd,
      sectors,
    });

    return NextResponse.json({
      success: result.success,
      period,
      periodStart,
      periodEnd,
      reports: result.reports.map((r) => ({
        id: r.id,
        sector: r.sector,
        title: r.title,
        headline: r.content.headline,
        priceKrw: r.priceKrw,
        tokensUsed: r.tokensUsed,
      })),
      stats: result.stats,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Premium report pipeline error:", error);
    return NextResponse.json(
      {
        error: "Premium report pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pipeline/premium-reports
 * List premium reports. Supports ?period=weekly|monthly&sector=...&limit=20
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") as PremiumReportPeriod | null;
    const sector = searchParams.get("sector") as PremiumSector | null;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const reports = await getPremiumReports({
      period: period || undefined,
      sector: sector || undefined,
      limit,
    });

    // Return metadata only — full content requires individual fetch with auth check
    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        reportPeriod: r.reportPeriod,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        sector: r.sector,
        title: r.title,
        summary: r.summary,
        priceKrw: r.priceKrw,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Premium report list error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch premium reports",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
