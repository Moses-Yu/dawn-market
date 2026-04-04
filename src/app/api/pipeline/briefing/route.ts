import { NextResponse } from "next/server";
import { getLatestBriefing } from "@/lib/pipeline";

export async function GET() {
  try {
    const briefing = await getLatestBriefing();

    if (!briefing) {
      return NextResponse.json(
        { error: "No briefing available yet." },
        { status: 404 }
      );
    }

    return NextResponse.json({ briefing });
  } catch (error) {
    console.error("Briefing fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch briefing",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
