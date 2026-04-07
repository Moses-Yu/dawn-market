import { NextResponse } from "next/server";
import { collectAllData } from "@/lib/pipeline/reports/data-collector";
import { storeArticles, storeMarketSnapshots } from "@/lib/pipeline/storage";
import { storeReport } from "@/lib/pipeline/reports/storage";
import { generateAllReports } from "@/lib/pipeline/report-generator";
import { checkBatchQuality } from "@/lib/pipeline/quality-checker";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for full pipeline (12 reports)

/**
 * GET /api/cron/daily-reports
 *
 * Vercel Cron endpoint — runs daily at KST 06:00 (UTC 21:00).
 * Orchestrates the full content pipeline:
 *   1. Collect market data + news
 *   2. Generate 12 reports via Claude API
 *   3. Validate quality
 *   4. Store in Supabase
 *   5. Log failures
 *
 * Protected by CRON_SECRET to prevent unauthorized triggers.
 */
export async function GET(request: Request) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const pipelineLog: string[] = [];

  function log(msg: string) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const entry = `[${elapsed}s] ${msg}`;
    pipelineLog.push(entry);
    console.log(`[daily-reports] ${entry}`);
  }

  try {
    // 1. Collect data
    log("데이터 수집 시작");
    const collected = await collectAllData();
    log(
      `수집 완료: 기사 ${collected.articles.length}건, 시장데이터 ${collected.marketData.length}건`
    );

    if (collected.errors.length > 0) {
      log(`수집 경고: ${collected.errors.length}건 — ${collected.errors.slice(0, 3).join("; ")}`);
    }

    // Store raw data
    const storedArticles = await storeArticles(collected.articles);
    const storedSnapshots = await storeMarketSnapshots(collected.marketData);
    log(`저장: 기사 ${storedArticles}건, 스냅샷 ${storedSnapshots}건`);

    // 2. Generate reports
    const kstDate = getKSTDate();
    log(`리포트 생성 시작 (날짜: ${kstDate})`);
    const result = await generateAllReports(collected, kstDate);
    log(
      `생성 완료: ${result.reports.length}건 성공, ${result.failures.length}건 실패, 토큰 ${result.totalTokens}개`
    );

    // 3. Quality check
    const reports = result.reports.map((r) => r.report);
    const quality = checkBatchQuality(reports);
    log(
      `품질 검사: 점수 ${quality.overallScore}/100, ${quality.passed ? "통과" : "미달"}`
    );

    if (quality.criticalIssues.length > 0) {
      log(
        `품질 경고: ${quality.criticalIssues.map((i) => `${i.reportType}:${i.check}`).join(", ")}`
      );
    }

    // 4. Store reports (even if quality isn't perfect — better than empty)
    let storedCount = 0;
    for (const genResult of result.reports) {
      try {
        await storeReport(genResult.report);
        storedCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`저장 실패 (${genResult.report.reportType}): ${msg}`);
        result.failures.push({
          reportType: genResult.report.reportType,
          error: `Storage: ${msg}`,
        });
      }
    }
    log(`DB 저장: ${storedCount}/${result.reports.length}건`);

    // 5. Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const summary = {
      success: result.failures.length === 0,
      date: kstDate,
      elapsed: `${elapsed}s`,
      reports: {
        generated: result.reports.length,
        stored: storedCount,
        failed: result.failures.length,
        failedTypes: result.failures.map((f) => f.reportType),
      },
      quality: {
        passed: quality.passed,
        score: quality.overallScore,
        criticalIssues: quality.criticalIssues.length,
      },
      data: {
        articles: collected.articles.length,
        marketSymbols: collected.marketData.length,
        collectionErrors: collected.errors.length,
      },
      totalTokens: result.totalTokens,
      log: pipelineLog,
    };

    // Log failures prominently for monitoring
    if (result.failures.length > 0) {
      console.error(
        "[daily-reports] FAILURES:",
        JSON.stringify(result.failures)
      );
    }

    return NextResponse.json(summary, {
      status: result.failures.length > 0 ? 207 : 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log(`파이프라인 치명적 오류: ${msg}`);
    console.error("[daily-reports] FATAL:", error);

    return NextResponse.json(
      {
        success: false,
        error: msg,
        log: pipelineLog,
      },
      { status: 500 }
    );
  }
}

/**
 * Return today's date in KST as YYYY-MM-DD.
 */
function getKSTDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}
