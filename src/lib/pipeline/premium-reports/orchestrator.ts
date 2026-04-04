import type { PremiumReport, PremiumReportPeriod, PremiumSector } from "./types";
import { SECTOR_PRICES, SECTOR_TITLES } from "./types";
import { generatePremiumReport, fetchDailyReportsForPeriod } from "./generator";
import { storePremiumReport } from "./storage";

export interface PremiumPipelineResult {
  success: boolean;
  reports: PremiumReport[];
  stats: {
    reportsGenerated: number;
    totalTokensUsed: number;
    durationMs: number;
  };
  errors: string[];
}

/** All sectors that get individual reports */
const INDIVIDUAL_SECTORS: PremiumSector[] = [
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
  "market-overview",
  "geopolitical",
];

/**
 * Run the premium report pipeline for a given period.
 *
 * Generates individual sector reports plus an all-sectors synthesis.
 */
export async function runPremiumReportPipeline(opts: {
  period: PremiumReportPeriod;
  periodStart: string;
  periodEnd: string;
  sectors?: PremiumSector[];
}): Promise<PremiumPipelineResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const generatedReports: PremiumReport[] = [];

  const sectorsToGenerate = opts.sectors || [
    ...INDIVIDUAL_SECTORS,
    "all-sectors" as PremiumSector,
  ];

  const periodLabel = opts.period === "weekly" ? "주간" : "월간";

  console.log(
    `[PremiumPipeline] Starting ${periodLabel} pipeline for ${opts.periodStart} ~ ${opts.periodEnd}`
  );
  console.log(
    `[PremiumPipeline] Sectors: ${sectorsToGenerate.join(", ")}`
  );

  for (const sector of sectorsToGenerate) {
    console.log(`[PremiumPipeline] Generating ${sector} report...`);

    try {
      // Fetch daily reports for this sector and period
      const { reports: dailyReports, dates: dailyDates } =
        await fetchDailyReportsForPeriod(
          opts.periodStart,
          opts.periodEnd,
          sector
        );

      if (dailyReports.length === 0) {
        const msg = `${sector}: No daily reports found for period`;
        console.warn(`[PremiumPipeline] ${msg}`);
        errors.push(msg);
        continue;
      }

      console.log(
        `[PremiumPipeline] ${sector}: Found ${dailyReports.length} days of data`
      );

      // Generate the premium report
      const result = await generatePremiumReport({
        period: opts.period,
        periodStart: opts.periodStart,
        periodEnd: opts.periodEnd,
        sector,
        dailyReports,
        dailyDates,
      });

      const sectorTitle = SECTOR_TITLES[sector];
      const title = `${sectorTitle.replace("주간/월간", periodLabel)}`;

      const report: Omit<PremiumReport, "id" | "createdAt"> = {
        reportPeriod: opts.period,
        periodStart: opts.periodStart,
        periodEnd: opts.periodEnd,
        sector,
        title,
        summary: result.content.executiveSummary,
        content: result.content,
        priceKrw: SECTOR_PRICES[sector],
        modelUsed: "claude-sonnet-4-6",
        tokensUsed: result.tokensUsed,
      };

      // Store to database
      const id = await storePremiumReport(report);

      generatedReports.push({
        ...report,
        id,
        createdAt: new Date().toISOString(),
      });

      console.log(
        `[PremiumPipeline] ${sector} complete: "${result.content.headline}" (${result.tokensUsed} tokens)`
      );
    } catch (err) {
      const errorMsg = `${sector}: ${err instanceof Error ? err.message : err}`;
      console.error(`[PremiumPipeline] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  const totalTokens = generatedReports.reduce(
    (sum, r) => sum + r.tokensUsed,
    0
  );
  const durationMs = Date.now() - startTime;

  console.log(
    `[PremiumPipeline] Complete: ${generatedReports.length}/${sectorsToGenerate.length} reports, ${totalTokens} tokens, ${Math.round(durationMs / 1000)}s`
  );

  return {
    success: generatedReports.length === sectorsToGenerate.length,
    reports: generatedReports,
    stats: {
      reportsGenerated: generatedReports.length,
      totalTokensUsed: totalTokens,
      durationMs,
    },
    errors,
  };
}

/** Calculate the most recent completed week (Mon-Sun) */
export function getLastWeekRange(): { start: string; end: string } {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  // Go back to last Sunday
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - dayOfWeek);
  // Last Monday = lastSunday - 6
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);

  return {
    start: toDateString(lastMonday),
    end: toDateString(lastSunday),
  };
}

/** Calculate the previous complete month */
export function getLastMonthRange(): { start: string; end: string } {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth(); // previous month (1-indexed)
  const lastDay = new Date(year, month, 0).getDate();

  return {
    start: `${year}-${String(month).padStart(2, "0")}-01`,
    end: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}
