import { NextResponse } from "next/server";
import {
  collectNews,
  summarizeArticles,
  storeArticles,
  storeMarketSnapshots,
  storeSummaries,
} from "@/lib/pipeline";

export async function POST(request: Request) {
  // Simple API key auth for cron/external triggers
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Step 1: Collect news and market data
    const collection = await collectNews();

    // Step 2: Store raw data
    const storedArticles = await storeArticles(collection.articles);
    const storedSnapshots = await storeMarketSnapshots(collection.marketData);

    // Step 3: Summarize with Claude
    const summarization = await summarizeArticles(
      collection.articles,
      collection.marketData
    );

    // Step 4: Store summaries
    const storedSummaries = await storeSummaries(summarization.summaries);

    return NextResponse.json({
      success: true,
      collected: {
        articles: collection.articles.length,
        marketSnapshots: collection.marketData.length,
        stored: { articles: storedArticles, snapshots: storedSnapshots },
      },
      summarized: {
        total: summarization.summaries.length,
        stored: storedSummaries,
      },
      errors: [
        ...collection.errors,
        ...summarization.errors,
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Pipeline collect error:", error);
    return NextResponse.json(
      {
        error: "Pipeline collection failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
