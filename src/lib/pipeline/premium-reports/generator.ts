import Anthropic from "@anthropic-ai/sdk";
import type { ReportContent } from "../reports/types";
import type {
  PremiumReportContent,
  PremiumReportInput,
  PremiumSector,
} from "./types";
import { SECTOR_TITLES } from "./types";

const anthropic = new Anthropic();

const PREMIUM_REPORT_SCHEMA = {
  type: "object" as const,
  properties: {
    headline: { type: "string" as const },
    executiveSummary: { type: "string" as const },
    sections: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const },
          body: { type: "string" as const },
          dataPoints: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                label: { type: "string" as const },
                value: { type: "string" as const },
                change: { type: "string" as const },
              },
              required: ["label", "value"] as const,
              additionalProperties: false,
            },
          },
        },
        required: ["title", "body"] as const,
        additionalProperties: false,
      },
    },
    weeklyTrends: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          label: { type: "string" as const },
          direction: {
            type: "string" as const,
            enum: ["up", "down", "sideways"],
          },
          detail: { type: "string" as const },
        },
        required: ["label", "direction", "detail"] as const,
        additionalProperties: false,
      },
    },
    outlook: {
      type: "object" as const,
      properties: {
        shortTerm: { type: "string" as const },
        mediumTerm: { type: "string" as const },
        risks: {
          type: "array" as const,
          items: { type: "string" as const },
        },
        opportunities: {
          type: "array" as const,
          items: { type: "string" as const },
        },
      },
      required: [
        "shortTerm",
        "mediumTerm",
        "risks",
        "opportunities",
      ] as const,
      additionalProperties: false,
    },
    keyTakeaways: {
      type: "array" as const,
      items: { type: "string" as const },
    },
  },
  required: [
    "headline",
    "executiveSummary",
    "sections",
    "weeklyTrends",
    "outlook",
    "keyTakeaways",
  ] as const,
  additionalProperties: false,
};

interface GenerateResult {
  content: PremiumReportContent;
  tokensUsed: number;
}

export async function generatePremiumReport(
  input: PremiumReportInput
): Promise<GenerateResult> {
  const periodLabel = input.period === "weekly" ? "주간" : "월간";
  const sectorTitle = SECTOR_TITLES[input.sector];

  const prompt = buildPrompt(input, periodLabel, sectorTitle);

  const MAX_RETRIES = 3;
  let response: Anthropic.Messages.Message | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 12000,
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: 3,
            user_location: {
              type: "approximate",
              country: "KR",
            },
          },
        ],
        output_config: {
          format: {
            type: "json_schema",
            schema: PREMIUM_REPORT_SCHEMA,
          },
        },
        messages: [{ role: "user", content: prompt }],
      });
      break;
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (
        (status === 529 || status === 503 || status === 500) &&
        attempt < MAX_RETRIES
      ) {
        const delay = Math.pow(2, attempt) * 5000 + Math.random() * 2000;
        console.log(
          `[PremiumReport] ${status} error, retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  if (!response) throw new Error("Failed after retries");

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "Response truncated (max_tokens reached) — increase maxTokens"
    );
  }

  const textBlocks = response.content.filter((block) => block.type === "text");
  const textBlock = textBlocks[textBlocks.length - 1];
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block in response");
  }

  const content: PremiumReportContent = JSON.parse(textBlock.text);

  return {
    content,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

function buildPrompt(
  input: PremiumReportInput,
  periodLabel: string,
  sectorTitle: string
): string {
  const dailySummaries = input.dailyReports
    .map((report, i) => {
      const date = input.dailyDates[i];
      return `### ${date}\n헤드라인: ${report.headline}\n${report.sections.map((s) => `- ${s.title}: ${s.body.substring(0, 300)}`).join("\n")}\n예측: ${report.prediction.direction} (${report.prediction.confidence}) — ${report.prediction.summary}\n핵심: ${report.keyTakeaways.join("; ")}`;
    })
    .join("\n\n");

  return `당신은 한국 초보 개인투자자를 위한 ${periodLabel} 증권 리포트를 작성하는 전문 애널리스트입니다.

## 리포트 정보
- 기간: ${input.periodStart} ~ ${input.periodEnd} (${periodLabel})
- 섹터: ${sectorTitle}

## 일별 리포트 데이터
아래는 해당 기간 동안 생성된 일별 리포트 요약입니다:

${dailySummaries}

## 작성 지침

1. **독자**: 한국 주식시장 초보 투자자. 전문용어는 쉽게 풀어서 설명.
2. **언어**: 모든 내용은 한국어로 작성.
3. **구조**:
   - headline: 한 줄로 이번 ${periodLabel}의 가장 중요한 시사점
   - executiveSummary: 3-4문장으로 핵심 요약 (바쁜 투자자가 이것만 읽어도 됨)
   - sections: ${periodLabel} 동안의 주요 이슈별 심층 분석 (최소 4개 섹션)
   - weeklyTrends: 주요 추세 변화 (최소 3개)
   - outlook: 단기(1-2주)/중기(1-3개월) 전망, 리스크, 기회
   - keyTakeaways: 초보 투자자가 기억해야 할 핵심 포인트 (5-7개)

4. **분석 관점**:
   - 일별 데이터에서 ${periodLabel} 추세/패턴을 도출
   - 한국 시장에 미치는 영향 중심으로 분석
   - "이번 주에 이런 일이 있었다" 수준이 아닌, "왜 이런 일이 일어났고 앞으로 어떤 영향이 있을지" 분석
   - 웹 검색을 통해 최신 정보로 보강

5. **투자 가이드**: 구체적 종목 추천은 피하되, 섹터/테마 수준의 방향성은 제시.

JSON 형식으로 응답하세요.`;
}

/** Fetch daily reports for a date range and specific report types from Supabase */
export async function fetchDailyReportsForPeriod(
  periodStart: string,
  periodEnd: string,
  sector: PremiumSector
): Promise<{ reports: ReportContent[]; dates: string[] }> {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");

  const supabase = createClient(url, key);
  const { SECTOR_TO_REPORT_TYPES } = await import("./types");
  const reportTypes = SECTOR_TO_REPORT_TYPES[sector];

  const { data, error } = await supabase
    .from("dawn_reports")
    .select("date, content, report_type")
    .gte("date", periodStart)
    .lte("date", periodEnd)
    .in("report_type", reportTypes)
    .order("date", { ascending: true });

  if (error) throw new Error(`fetchDailyReports: ${error.message}`);

  // Group by date, merge contents from different report types per date
  const reports: ReportContent[] = [];
  const dates: string[] = [];

  const byDate = new Map<string, ReportContent[]>();
  for (const row of data || []) {
    const existing = byDate.get(row.date) || [];
    existing.push(row.content as ReportContent);
    byDate.set(row.date, existing);
  }

  for (const [date, contents] of byDate) {
    // Merge multiple reports for the same date into one combined entry
    const merged: ReportContent = {
      headline: contents.map((c) => c.headline).join(" | "),
      sections: contents.flatMap((c) => c.sections),
      prediction: contents[0].prediction,
      keyTakeaways: contents.flatMap((c) => c.keyTakeaways),
    };
    dates.push(date);
    reports.push(merged);
  }

  return { reports, dates };
}
