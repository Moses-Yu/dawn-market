import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/subscription";
import { getLatestReportSet } from "@/lib/pipeline/reports";
import type { ReportType, Report, DataPoint } from "@/lib/pipeline/reports/types";
import { REPORT_TITLES } from "@/lib/pipeline/reports/types";
import type { WatchlistEntry } from "@/lib/types/preferences";

// Map sector types to report types
const SECTOR_TO_REPORT: Record<string, ReportType> = {
  semiconductor: "semiconductor",
  "shipbuilding-defense": "shipbuilding-defense",
  "ai-infra": "ai-infra",
  "secondary-battery": "secondary-battery",
  "bio-healthcare": "bio-healthcare",
  finance: "finance",
};

interface StockBriefing {
  symbol: string;
  name: string;
  sector: string;
  sectorTitle: string;
  dataPoints: DataPoint[];
  prediction: {
    direction: string;
    confidence: string;
    summary: string;
  };
}

function extractStockDataPoints(report: Report, stockName: string): DataPoint[] {
  const points: DataPoint[] = [];
  for (const section of report.content.sections) {
    if (!section.dataPoints) continue;
    for (const dp of section.dataPoints) {
      if (dp.label.includes(stockName) || stockName.includes(dp.label)) {
        points.push(dp);
      }
    }
  }
  return points;
}

export async function GET() {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. Subscription check
    const subscription = await getUserSubscription();
    if (!subscription.isPro) {
      return NextResponse.json(
        { error: "pro_required" },
        { status: 403 }
      );
    }

    // 3. Fetch user's watchlist
    const { data: prefs, error: prefsError } = await supabase
      .from("user_preferences")
      .select("watchlist")
      .eq("user_id", user.id)
      .single();

    if (prefsError && prefsError.code !== "PGRST116") {
      console.error("Failed to fetch watchlist:", prefsError);
      return NextResponse.json(
        { error: "관심종목을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    const watchlist: WatchlistEntry[] = (prefs?.watchlist as WatchlistEntry[]) ?? [];

    if (watchlist.length === 0) {
      return NextResponse.json({
        date: new Date().toISOString().split("T")[0],
        stocks: [],
      });
    }

    // 4. Fetch today's reports
    const reportSet = await getLatestReportSet();
    if (!reportSet) {
      return NextResponse.json(
        { error: "리포트가 아직 준비되지 않았습니다." },
        { status: 404 }
      );
    }

    // Index reports by type for fast lookup
    const reportByType = new Map<ReportType, Report>();
    for (const report of reportSet.reports) {
      reportByType.set(report.reportType, report);
    }

    // 5. Build per-stock briefing
    const stocks: StockBriefing[] = [];

    for (const entry of watchlist) {
      const reportType = SECTOR_TO_REPORT[entry.sector];
      if (!reportType) continue;

      const report = reportByType.get(reportType);
      if (!report) continue;

      const dataPoints = extractStockDataPoints(report, entry.name);
      const { prediction } = report.content;

      stocks.push({
        symbol: entry.symbol,
        name: entry.name,
        sector: entry.sector,
        sectorTitle: REPORT_TITLES[reportType] ?? report.content.headline,
        dataPoints,
        prediction: {
          direction: prediction.direction,
          confidence: prediction.confidence,
          summary: prediction.summary,
        },
      });
    }

    // 6. Return structured response
    return NextResponse.json({
      date: reportSet.date,
      stocks,
    });
  } catch (error) {
    console.error("Personalized briefing error:", error);
    return NextResponse.json(
      {
        error: "맞춤 브리핑을 불러오는데 실패했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
