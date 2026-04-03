import { NextResponse } from "next/server";
import { getLatestReportSet } from "@/lib/pipeline/reports";
import type { ReportType } from "@/lib/pipeline/reports";

const SECTOR_REPORT_TYPES: ReportType[] = [
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
];

export async function GET() {
  try {
    const reportSet = await getLatestReportSet();
    if (!reportSet) {
      return NextResponse.json({ sectors: [], date: null });
    }

    const sectors = SECTOR_REPORT_TYPES.map((type) => {
      const report = reportSet.reports.find((r) => r.reportType === type);
      if (!report) {
        return {
          type,
          available: false,
        };
      }

      return {
        type,
        available: true,
        headline: report.content.headline,
        prediction: report.content.prediction,
        keyTakeaways: report.content.keyTakeaways,
        sections: report.content.sections.map((s) => ({
          title: s.title,
          dataPoints: s.dataPoints ?? [],
        })),
      };
    });

    return NextResponse.json({
      sectors,
      date: reportSet.date,
      generatedAt: reportSet.generatedAt,
    });
  } catch (error) {
    console.error("Failed to fetch sector data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sector data" },
      { status: 500 }
    );
  }
}
