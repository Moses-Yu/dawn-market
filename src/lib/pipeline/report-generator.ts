import Anthropic from "@anthropic-ai/sdk";
import type { Report, ReportType, ReportContent } from "./reports/types";
import {
  REPORT_TITLES,
  US_MARKET_SYMBOLS,
  SEMICONDUCTOR_SYMBOLS,
  SHIPBUILDING_DEFENSE_SYMBOLS,
  AI_INFRA_SYMBOLS,
  SECONDARY_BATTERY_SYMBOLS,
  BIO_HEALTHCARE_SYMBOLS,
  FINANCE_SYMBOLS,
  CURRENCY_SYMBOLS,
  COMMODITY_SYMBOLS,
  COMMODITY_KR_IMPACT,
} from "./reports/types";
import { filterMarketData } from "./reports/data-collector";
import type { CollectedData } from "./reports/data-collector";

const CORE_REPORT_TYPES: ReportType[] = [
  "us-market",
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
  "bio-healthcare",
  "finance",
  "geopolitical",
  "currency",
];

const SYMBOL_MAP: Record<string, { symbol: string; name: string }[]> = {
  "us-market": [...US_MARKET_SYMBOLS, ...COMMODITY_SYMBOLS],
  semiconductor: SEMICONDUCTOR_SYMBOLS,
  "shipbuilding-defense": SHIPBUILDING_DEFENSE_SYMBOLS,
  "ai-infra": AI_INFRA_SYMBOLS,
  "secondary-battery": SECONDARY_BATTERY_SYMBOLS,
  "bio-healthcare": BIO_HEALTHCARE_SYMBOLS,
  finance: FINANCE_SYMBOLS,
  currency: CURRENCY_SYMBOLS,
  geopolitical: [...CURRENCY_SYMBOLS, ...COMMODITY_SYMBOLS],
};

function buildPrompt(
  reportType: ReportType,
  data: CollectedData,
  previousReports: Report[]
): string {
  const symbols = SYMBOL_MAP[reportType] || [];
  const relevantMarket = filterMarketData(data.marketData, symbols);

  const marketSummary = relevantMarket
    .map(
      (m) =>
        `${m.name} (${m.symbol}): ${m.price} (${m.change >= 0 ? "+" : ""}${m.change}, ${m.changePercent >= 0 ? "+" : ""}${m.changePercent}%)`
    )
    .join("\n");

  const articleSummary = data.articles
    .slice(0, 30)
    .map((a) => `- [${a.sourceName}] ${a.title}: ${a.content.slice(0, 200)}`)
    .join("\n");

  const prevContext =
    previousReports.length > 0
      ? `\n\n이전 리포트 요약 (중복 방지):\n${previousReports.map((r) => `- ${r.content.headline}`).join("\n")}`
      : "";

  // Build commodity → Korean sector/stock mapping context for us-market report
  const commodityContext =
    reportType === "us-market"
      ? `\n\n## 원자재 → 한국 섹터/종목 매핑 (반드시 섹션에 포함)
아래 원자재의 야간 변동을 분석하고, 영향받는 한국 섹터와 종목을 매핑하세요.
이 내용을 "원자재 동향" 이라는 별도 섹션으로 반드시 포함하세요.

${COMMODITY_SYMBOLS.map((c) => {
  const impact = COMMODITY_KR_IMPACT[c.symbol];
  return `- **${c.name} (${c.symbol})**: 영향 섹터: ${impact.sectors.join(", ")} / 관련 종목: ${impact.stocks.join(", ")}`;
}).join("\n")}

각 원자재별로:
1. 야간 가격 변동 (제공된 시장 데이터 기반)
2. 변동 원인 (뉴스 기반, 간단히)
3. 한국 시장 영향 (위 매핑 기반, 초보자 눈높이로)
dataPoints에 각 원자재의 가격/변동/sentiment를 반드시 포함하세요.`
      : "";

  return `당신은 한국 초보 투자자를 위한 시장 분석가입니다.
새벽시장(Dawn Market) 플랫폼에서 매일 아침 전달되는 "${REPORT_TITLES[reportType]}" 리포트를 작성하세요.

## 작성 원칙
1. **초보자 친화적**: 전문 용어에는 반드시 쉬운 설명을 괄호로 추가
2. **정확한 수치 기반**: 제공된 시장 데이터를 정확히 인용
3. **시의성**: 오늘 새벽 데이터 기준으로 작성
4. **한국 투자자 관점**: 한국 시장에 미치는 영향 중심으로 분석
5. **객관적 톤**: 과장하지 말고, 불확실한 부분은 명시

## 데이터 윈도우
- 시작: ${data.dataWindowStart}
- 종료: ${data.dataWindowEnd}

## 시장 데이터
${marketSummary || "(관련 시장 데이터 없음)"}

## 오늘 주요 뉴스
${articleSummary || "(관련 뉴스 없음)"}
${prevContext}
${commodityContext}

## 출력 형식 (JSON)
아래 JSON 구조를 **정확히** 따르세요. JSON만 출력하고, 다른 텍스트는 포함하지 마세요.

{
  "headline": "한 줄 요약 (한국어, 50자 이내)",
  "sections": [
    {
      "title": "섹션 제목",
      "body": "본문 (한국어, 마크다운 허용)",
      "dataPoints": [
        { "label": "지표명", "value": "수치", "change": "+/-변동", "sentiment": "bullish|bearish|neutral" }
      ]
    }
  ],
  "prediction": {
    "direction": "up|down|sideways",
    "confidence": "high|medium|low",
    "summary": "예측 요약 (한국어, 100자 이내)",
    "factors": ["근거1", "근거2"]
  },
  "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"]
}`;
}

function parseReportContent(raw: string): ReportContent {
  // Extract JSON from potential markdown code blocks
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
  const jsonStr = (jsonMatch[1] || raw).trim();
  return JSON.parse(jsonStr);
}

export interface GenerationResult {
  report: Report;
  tokensUsed: number;
  model: string;
}

export interface PipelineResult {
  date: string;
  reports: GenerationResult[];
  failures: { reportType: ReportType; error: string }[];
  collectedAt: string;
  totalTokens: number;
}

export async function generateReport(
  client: Anthropic,
  reportType: ReportType,
  reportNumber: number,
  date: string,
  data: CollectedData,
  previousReports: Report[],
  model: string = "claude-sonnet-4-20250514"
): Promise<GenerationResult> {
  const prompt = buildPrompt(reportType, data, previousReports);

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error(`No text response for ${reportType}`);
  }

  const content = parseReportContent(textBlock.text);
  const tokensUsed =
    (response.usage?.input_tokens || 0) +
    (response.usage?.output_tokens || 0);

  const report: Report = {
    reportNumber,
    reportType,
    title: REPORT_TITLES[reportType],
    date,
    dataWindowStart: data.dataWindowStart,
    dataWindowEnd: data.dataWindowEnd,
    content,
    generatedAt: new Date().toISOString(),
    modelUsed: model,
    tokensUsed,
  };

  return { report, tokensUsed, model };
}

export async function generateAllReports(
  data: CollectedData,
  date: string
): Promise<PipelineResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const client = new Anthropic({ apiKey });
  const reports: GenerationResult[] = [];
  const failures: { reportType: ReportType; error: string }[] = [];
  let totalTokens = 0;

  for (let i = 0; i < CORE_REPORT_TYPES.length; i++) {
    const reportType = CORE_REPORT_TYPES[i];
    const previousReports = reports.map((r) => r.report);

    // Try up to 2 times per report
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await generateReport(
          client,
          reportType,
          i + 1,
          date,
          data,
          previousReports
        );
        reports.push(result);
        totalTokens += result.tokensUsed;
        break;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (attempt === 1) {
          console.error(
            `Report ${reportType} failed after 2 attempts: ${msg}`
          );
          failures.push({ reportType, error: msg });
        } else {
          console.warn(`Report ${reportType} attempt ${attempt + 1} failed, retrying: ${msg}`);
        }
      }
    }
  }

  return {
    date,
    reports,
    failures,
    collectedAt: data.collectedAt,
    totalTokens,
  };
}
