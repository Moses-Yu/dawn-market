import { NextResponse } from "next/server";
import { collectAllData } from "@/lib/pipeline/reports/data-collector";
import {
  storeArticles,
  storeMarketSnapshots,
} from "@/lib/pipeline/storage";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  return !expectedKey || authHeader === `Bearer ${expectedKey}`;
}

/**
 * POST /api/research/collect
 * Triggers RSS + market data collection, stores raw data, returns everything
 * to the Research Analyst for analysis.
 */
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collected = await collectAllData();

    // Store raw data
    const storedArticles = await storeArticles(collected.articles);
    const storedSnapshots = await storeMarketSnapshots(collected.marketData);

    return NextResponse.json({
      success: true,
      dataWindow: {
        start: collected.dataWindowStart,
        end: collected.dataWindowEnd,
      },
      articles: collected.articles,
      marketData: collected.marketData,
      stats: {
        articlesCollected: collected.articles.length,
        articlesStored: storedArticles,
        marketSymbols: collected.marketData.length,
        snapshotsStored: storedSnapshots,
      },
      errors: collected.errors,
      collectedAt: collected.collectedAt,
    });
  } catch (error) {
    console.error("Research collect error:", error);
    return NextResponse.json(
      {
        error: "Data collection failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
