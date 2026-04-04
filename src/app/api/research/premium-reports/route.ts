import { NextResponse } from "next/server";
import { storePremiumReport } from "@/lib/pipeline/premium-reports/storage";
import { SECTOR_PRICES } from "@/lib/pipeline/premium-reports/types";
import type { PremiumReportContent, PremiumReportPeriod, PremiumSector } from "@/lib/pipeline/premium-reports/types";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  return !expectedKey || authHeader === `Bearer ${expectedKey}`;
}

interface PremiumReportRequest {
  period: PremiumReportPeriod;
  periodStart: string;
  periodEnd: string;
  sector: PremiumSector;
  title: string;
  content: PremiumReportContent;
}

/**
 * POST /api/research/premium-reports
 * Accepts a premium report from the Research Analyst agent.
 *
 * Body: PremiumReportRequest
 */
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: PremiumReportRequest = await request.json();

    if (!body.period || !body.periodStart || !body.periodEnd || !body.sector || !body.content) {
      return NextResponse.json(
        { error: "period, periodStart, periodEnd, sector, and content are required" },
        { status: 400 }
      );
    }

    const id = await storePremiumReport({
      reportPeriod: body.period,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      sector: body.sector,
      title: body.title,
      summary: body.content.executiveSummary,
      content: body.content,
      priceKrw: SECTOR_PRICES[body.sector],
      modelUsed: "research-analyst-agent",
      tokensUsed: 0,
    });

    return NextResponse.json({
      success: true,
      reportId: id,
      sector: body.sector,
      period: body.period,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Research premium report error:", error);
    return NextResponse.json(
      {
        error: "Failed to store premium report",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
