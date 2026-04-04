import { NextResponse } from "next/server";
import { storeSummaries } from "@/lib/pipeline/storage";
import type { ArticleSummary } from "@/lib/pipeline/types";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  return !expectedKey || authHeader === `Bearer ${expectedKey}`;
}

/**
 * POST /api/research/summaries
 * Accepts article summaries produced by the Research Analyst agent.
 *
 * Body: { summaries: ArticleSummary[] }
 */
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const summaries: ArticleSummary[] = body.summaries;

    if (!Array.isArray(summaries) || summaries.length === 0) {
      return NextResponse.json(
        { error: "summaries array is required and must not be empty" },
        { status: 400 }
      );
    }

    const stored = await storeSummaries(summaries);

    return NextResponse.json({
      success: true,
      stored,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Research summaries error:", error);
    return NextResponse.json(
      {
        error: "Failed to store summaries",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
