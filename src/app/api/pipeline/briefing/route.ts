import { NextResponse } from "next/server";
import {
  composeBriefing,
  storeBriefing,
  getLatestBriefing,
  getRecentArticles,
  getRecentMarketData,
} from "@/lib/pipeline";
import { summarizeArticles } from "@/lib/pipeline/summarizer";

export async function POST(request: Request) {
  // Simple API key auth for cron/external triggers
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get recent collected data
    const articles = await getRecentArticles(12);
    const marketData = await getRecentMarketData();

    if (articles.length === 0) {
      return NextResponse.json(
        { error: "No recent articles found. Run /api/pipeline/collect first." },
        { status: 400 }
      );
    }

    // Summarize articles
    const summarization = await summarizeArticles(articles, marketData);

    // Compose the morning briefing
    const briefing = await composeBriefing(
      summarization.summaries,
      marketData
    );

    // Store briefing
    const briefingId = await storeBriefing(briefing);

    return NextResponse.json({
      success: true,
      briefingId,
      briefing,
      stats: {
        articlesProcessed: articles.length,
        summariesGenerated: summarization.summaries.length,
        marketIndices: marketData.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Briefing compose error:", error);
    return NextResponse.json(
      {
        error: "Briefing composition failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

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
