import { NextResponse } from "next/server";
import { storeReport } from "@/lib/pipeline/reports/storage";
import type { Report } from "@/lib/pipeline/reports/types";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  return !expectedKey || authHeader === `Bearer ${expectedKey}`;
}

/**
 * POST /api/research/reports
 * Accepts a single report produced by the Research Analyst agent.
 *
 * Body: Report
 */
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report: Report = await request.json();

    if (!report.reportType || !report.date || !report.content) {
      return NextResponse.json(
        { error: "reportType, date, and content are required" },
        { status: 400 }
      );
    }

    // Ensure generatedAt is set
    if (!report.generatedAt) {
      report.generatedAt = new Date().toISOString();
    }

    const reportId = await storeReport(report);

    return NextResponse.json({
      success: true,
      reportId,
      reportType: report.reportType,
      reportNumber: report.reportNumber,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Research report error:", error);
    return NextResponse.json(
      {
        error: "Failed to store report",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
