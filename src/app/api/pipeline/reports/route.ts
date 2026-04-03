import { NextResponse } from "next/server";
import { runReportPipeline, getLatestReportSet } from "@/lib/pipeline/reports";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runReportPipeline();

    return NextResponse.json({
      success: result.success,
      date: result.reportSet.date,
      dataWindow: {
        start: result.reportSet.dataWindowStart,
        end: result.reportSet.dataWindowEnd,
      },
      reports: result.reportSet.reports.map((r) => ({
        reportNumber: r.reportNumber,
        reportType: r.reportType,
        title: r.title,
        headline: r.content.headline,
        prediction: r.content.prediction,
        tokensUsed: r.tokensUsed,
      })),
      stats: result.stats,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Report pipeline error:", error);
    return NextResponse.json(
      {
        error: "Report pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const reportSet = await getLatestReportSet();

    if (!reportSet) {
      return NextResponse.json(
        { error: "No reports available yet." },
        { status: 404 }
      );
    }

    return NextResponse.json({ reportSet });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch reports",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
