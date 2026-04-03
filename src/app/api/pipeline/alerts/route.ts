import { NextResponse } from "next/server";
import { runAlertScan } from "@/lib/pipeline/alert-engine";
import { summarizeArticles } from "@/lib/pipeline/summarizer";
import { collectNews } from "@/lib/pipeline/news-collector";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Collect and summarize fresh news
    const collection = await collectNews();
    const summarization = await summarizeArticles(
      collection.articles,
      collection.marketData
    );

    // Run alert scan
    const result = await runAlertScan(summarization.summaries);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Alert scan failed:", error);
    return NextResponse.json(
      { error: "Alert scan failed", details: String(error) },
      { status: 500 }
    );
  }
}
