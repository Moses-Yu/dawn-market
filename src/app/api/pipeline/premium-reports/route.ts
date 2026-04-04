import { NextResponse } from "next/server";
import {
  getPremiumReports,
} from "@/lib/pipeline/premium-reports";
import type { PremiumReportPeriod, PremiumSector } from "@/lib/pipeline/premium-reports";

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
