import { NextResponse } from "next/server";
import { getRecentAlerts } from "@/lib/pipeline/alert-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "20", 10),
      50
    );

    const alerts = await getRecentAlerts(limit);
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
