import { NextResponse } from "next/server";
import { getRecentAlerts } from "@/lib/pipeline/alert-engine";

export async function GET() {
  try {
    const alerts = await getRecentAlerts(20);
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Alert fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts", details: String(error) },
      { status: 500 }
    );
  }
}
