import { NextResponse } from "next/server";
import { storeBriefing } from "@/lib/pipeline/storage";
import type { MorningBriefing } from "@/lib/pipeline/types";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  return !!expectedKey && authHeader === `Bearer ${expectedKey}`;
}

/**
 * POST /api/research/briefing
 * Accepts a morning briefing produced by the Research Analyst agent.
 *
 * Body: MorningBriefing
 */
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const briefing: MorningBriefing = await request.json();

    if (!briefing.date || !briefing.topStories) {
      return NextResponse.json(
        { error: "date and topStories are required" },
        { status: 400 }
      );
    }

    // Ensure generatedAt is set
    if (!briefing.generatedAt) {
      briefing.generatedAt = new Date().toISOString();
    }

    const briefingId = await storeBriefing(briefing);

    return NextResponse.json({
      success: true,
      briefingId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Research briefing error:", error);
    return NextResponse.json(
      {
        error: "Failed to store briefing",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
