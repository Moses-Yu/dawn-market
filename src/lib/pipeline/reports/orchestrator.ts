import type { Report, ReportInput, ReportSet } from "./types";
import { collectAllData } from "./data-collector";
import { summarizeArticles } from "../summarizer";
import {
  storeArticles,
  storeMarketSnapshots,
  storeSummaries,
} from "../storage";
import { storeReport } from "./storage";
import { generateUsMarketReport } from "./report-1-us-market";
import { generateSemiconductorReport } from "./report-2-semiconductor";
import { generateShipbuildingDefenseReport } from "./report-2b-shipbuilding-defense";
import { generateAiInfraReport } from "./report-2c-ai-infra";
import { generateSecondaryBatteryReport } from "./report-2d-secondary-battery";
import { generateGeopoliticalReport } from "./report-3-geopolitical";
import { generateCurrencyReport } from "./report-4-currency";
import { generateAsianPremarketReport } from "./report-5-asian-premarket";
import { generateTechnicalReport } from "./report-6-technical";
import { generateDawnBriefingReport } from "./report-7-dawn-briefing";

export interface PipelineResult {
  success: boolean;
  reportSet: ReportSet;
  stats: {
    articlesCollected: number;
    marketSymbolsFetched: number;
    summariesGenerated: number;
    reportsGenerated: number;
    totalTokensUsed: number;
    durationMs: number;
  };
  errors: string[];
}

type ReportGenerator = (input: ReportInput) => Promise<Report>;

const REPORT_GENERATORS: ReportGenerator[] = [
  generateUsMarketReport,
  generateSemiconductorReport,
  generateShipbuildingDefenseReport,
  generateAiInfraReport,
  generateSecondaryBatteryReport,
  generateGeopoliticalReport,
  generateCurrencyReport,
  generateAsianPremarketReport,
  generateTechnicalReport,
  generateDawnBriefingReport,
];

/**
 * Run the full 7-report pipeline.
 *
 * 1. Collect all data (news + market)
 * 2. Summarize articles
 * 3. Generate reports 1-7 sequentially (each builds on previous)
 * 4. Store everything
 */
export async function runReportPipeline(): Promise<PipelineResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  // Use Korean time (KST = UTC+9) for the report date
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  ).toISOString().split("T")[0];

  console.log(`[Pipeline] Starting 10-report pipeline for ${today}`);

  // Step 1: Collect all data
  console.log("[Pipeline] Step 1: Collecting data...");
  const collected = await collectAllData();
  errors.push(...collected.errors);

  console.log(
    `[Pipeline] Collected ${collected.articles.length} articles, ${collected.marketData.length} market symbols`
  );

  // Step 2: Store raw data
  console.log("[Pipeline] Step 2: Storing raw data...");
  try {
    await storeArticles(collected.articles);
    await storeMarketSnapshots(collected.marketData);
  } catch (err) {
    errors.push(`Storage: ${err}`);
  }

  // Step 3: Summarize articles
  console.log("[Pipeline] Step 3: Summarizing articles...");
  const summarization = await summarizeArticles(
    collected.articles,
    collected.marketData
  );
  errors.push(...summarization.errors);

  try {
    await storeSummaries(summarization.summaries);
  } catch (err) {
    errors.push(`Summary storage: ${err}`);
  }

  // Step 4: Generate reports sequentially
  console.log("[Pipeline] Step 4: Generating reports...");
  const reports: Report[] = [];

  for (let i = 0; i < REPORT_GENERATORS.length; i++) {
    const generator = REPORT_GENERATORS[i];
    const reportNum = i + 1;

    console.log(`[Pipeline] Generating report ${reportNum}/10...`);

    const input: ReportInput = {
      date: today,
      dataWindowStart: collected.dataWindowStart,
      dataWindowEnd: collected.dataWindowEnd,
      marketData: collected.marketData,
      articles: collected.articles,
      summaries: summarization.summaries,
      previousReports: reports, // All reports generated so far
    };

    try {
      const report = await generator(input);
      reports.push(report);

      // Store each report as it's generated
      await storeReport(report);
      console.log(
        `[Pipeline] Report ${reportNum} complete: "${report.content.headline}"`
      );
    } catch (err) {
      const errorMsg = `Report ${reportNum}: ${err instanceof Error ? err.message : err}`;
      console.error(`[Pipeline] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  const totalTokens = reports.reduce((sum, r) => sum + r.tokensUsed, 0);
  const durationMs = Date.now() - startTime;

  console.log(
    `[Pipeline] Complete: ${reports.length}/10 reports, ${totalTokens} tokens, ${Math.round(durationMs / 1000)}s`
  );

  const reportSet: ReportSet = {
    date: today,
    dataWindowStart: collected.dataWindowStart,
    dataWindowEnd: collected.dataWindowEnd,
    reports,
    generatedAt: new Date().toISOString(),
  };

  return {
    success: reports.length === 10,
    reportSet,
    stats: {
      articlesCollected: collected.articles.length,
      marketSymbolsFetched: collected.marketData.length,
      summariesGenerated: summarization.summaries.length,
      reportsGenerated: reports.length,
      totalTokensUsed: totalTokens,
      durationMs,
    },
    errors,
  };
}
