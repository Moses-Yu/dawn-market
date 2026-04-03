import { NextResponse } from "next/server";
import { getReportSetDates } from "@/lib/pipeline/reports";

export async function GET() {
  try {
    const dates = await getReportSetDates(30);
    return NextResponse.json({ dates });
  } catch (error) {
    console.error("Report dates fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch report dates",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
