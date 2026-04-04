import { NextResponse } from "next/server";
import {
  collectNews,
  storeArticles,
  storeMarketSnapshots,
} from "@/lib/pipeline";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collection = await collectNews();
    const storedArticles = await storeArticles(collection.articles);
    const storedSnapshots = await storeMarketSnapshots(collection.marketData);

    return NextResponse.json({
      success: true,
      collected: {
        articles: collection.articles.length,
        marketSnapshots: collection.marketData.length,
        stored: { articles: storedArticles, snapshots: storedSnapshots },
      },
      errors: collection.errors,
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
