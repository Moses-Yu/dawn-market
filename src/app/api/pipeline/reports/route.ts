import { NextResponse } from "next/server";
import { getLatestReportSet } from "@/lib/pipeline/reports";

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
