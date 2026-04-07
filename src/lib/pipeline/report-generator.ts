import Anthropic from "@anthropic-ai/sdk";
import type { Report, ReportType, ReportContent } from "./reports/types";
import {
  REPORT_TITLES,
  REPORT_ORDER,
  US_MARKET_SYMBOLS,
  SEMICONDUCTOR_SYMBOLS,
  SHIPBUILDING_DEFENSE_SYMBOLS,
  AI_INFRA_SYMBOLS,
  SECONDARY_BATTERY_SYMBOLS,
  BIO_HEALTHCARE_SYMBOLS,
  FINANCE_SYMBOLS,
  CURRENCY_SYMBOLS,
  ASIAN_SYMBOLS,
  COMMODITY_SYMBOLS,
  COMMODITY_KR_IMPACT,
  KOSPI_FUTURES_SYMBOLS,
  ALL_SYMBOLS,
} from "./reports/types";
import { filterMarketData } from "./reports/data-collector";
import type { CollectedData } from "./reports/data-collector";

// Generate all 12 reports in the canonical order defined in types.ts
const CORE_REPORT_TYPES: ReportType[] = REPORT_ORDER;

const SYMBOL_MAP: Record<string, { symbol: string; name: string }[]> = {
  "us-market": [...US_MARKET_SYMBOLS, ...COMMODITY_SYMBOLS, ...KOSPI_FUTURES_SYMBOLS],
  semiconductor: SEMICONDUCTOR_SYMBOLS,
  "shipbuilding-defense": SHIPBUILDING_DEFENSE_SYMBOLS,
  "ai-infra": AI_INFRA_SYMBOLS,
  "secondary-battery": SECONDARY_BATTERY_SYMBOLS,
  "bio-healthcare": BIO_HEALTHCARE_SYMBOLS,
  finance: FINANCE_SYMBOLS,
  currency: CURRENCY_SYMBOLS,
  geopolitical: [...CURRENCY_SYMBOLS, ...COMMODITY_SYMBOLS],
  "asian-premarket": ASIAN_SYMBOLS,
  technical: ALL_SYMBOLS,
  "dawn-briefing": ALL_SYMBOLS,
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

  // KOSPI futures overnight context for us-market report
  const kospiFuturesContext =
    reportType === "us-market"
      ? `\n\n## 야간 선물 동향 (반드시 섹션에 포함)
KOSPI200 선물(KM=F) 야간 마감 데이터를 "야간 선물 동향" 섹션으로 반드시 포함하세요.
이 섹션은 초보자에게 오전 시장 방향성 힌트를 제공하기 위한 것입니다.

작성 방식:
- 예시: "야간 선물이 -1.2%로 마감 → 오전 약세 출발 가능"
- 선물 매매를 유도하는 것이 아님을 명확히 할 것
- "선물(미래 가격을 미리 거래하는 시장)"처럼 초보자를 위한 용어 설명 포함
- 교육 맥락으로 제공: 왜 선물 동향이 다음날 시장 방향의 힌트가 되는지 간단히 설명
- dataPoints에 KOSPI200 선물의 가격/변동/sentiment를 반드시 포함`
      : "";

  // Asian pre-market context
  const asianPremarketContext =
    reportType === "asian-premarket"
      ? `\n\n## 아시아 프리마켓 분석 지침
이 리포트는 아시아 주요 시장의 프리마켓/야간 동향을 분석합니다.
- KOSPI, KOSDAQ, KOSPI200 선물의 야간 동향
- 일본 닛케이225, 홍콩 항셍, 중국 CSI300 선물/ADR 동향
- 미국 시장 마감이 아시아 시장에 미칠 영향 분석
- 초보자에게 "오늘 장 시작 전 알아야 할 것"을 명확히 전달
- 이전 리포트에서 다룬 미국/반도체/환율 동향을 아시아 시장 관점으로 연결`
      : "";

  // Technical analysis context
  const technicalContext =
    reportType === "technical"
      ? `\n\n## 기술적 분석 지침
이 리포트는 주요 지수와 종목의 기술적 분석과 시장 센티먼트를 다룹니다.
- 주요 지수(KOSPI, S&P500, NASDAQ)의 기술적 지지선/저항선 분석
- 거래량 동향, 이동평균선(5일/20일/60일) 위치 관계
- 공포-탐욕 지수(VIX), 풋콜비율 등 센티먼트 지표 해석
- 기술적 용어는 반드시 초보자 설명 포함 (예: "이동평균선(최근 N일간 평균 가격을 이은 선)")
- 차트 패턴이나 기술적 신호를 과신하지 말고 참고 수준으로 제공`
      : "";

  // Dawn briefing (comprehensive summary) context
  const dawnBriefingContext =
    reportType === "dawn-briefing"
      ? `\n\n## 새벽시장 종합 브리핑 지침
이 리포트는 모든 이전 리포트를 종합하는 **최종 브리핑**입니다.
- 이전 ${previousReports.length}개 리포트의 핵심 내용을 통합 요약
- "오늘 장에서 가장 주목할 3가지"를 명확히 제시
- 섹터별 크로스 임팩트 분석 (예: 환율→반도체→조선 연쇄 영향)
- 초보 투자자가 "오늘 뭘 봐야 하나?"에 대한 명확한 답을 제공
- 개별 리포트를 반복하지 말고, 상호 연관성과 큰 그림에 집중
- prediction은 전체 한국 시장 방향성에 대한 종합 판단으로 작성
- **무효화 조건**: prediction에 반드시 invalidationConditions를 포함하세요. 예측이 틀릴 수 있는 구체적 조건들입니다.
  예시: 원화 급락(달러/원 1,400원 돌파), 지수 약세(KOSPI 선물 -1% 이상), 선물 매도 확대 시 상승폭 축소 가능
  초보자가 "이런 상황이 오면 조심해야 한다"고 이해할 수 있도록 쉽게 작성하세요.`
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
${kospiFuturesContext}
${asianPremarketContext}
${technicalContext}
${dawnBriefingContext}

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
    "factors": ["근거1", "근거2"],
    "invalidationConditions": ["이 예측이 틀릴 수 있는 조건1", "조건2"]
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
  model: string = "claude-sonnet-4-6"
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

    // Small delay between API calls to avoid rate limiting
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

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
        console.log(`Report ${reportType} generated (${result.tokensUsed} tokens)`);
        break;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const statusCode = (error as { status?: number })?.status;
        if (attempt === 1) {
          console.error(
            `Report ${reportType} failed after 2 attempts (status: ${statusCode}): ${msg}`
          );
          failures.push({ reportType, error: `${statusCode || "unknown"}: ${msg}` });
        } else {
          console.warn(`Report ${reportType} attempt ${attempt + 1} failed (status: ${statusCode}), retrying in 2s: ${msg}`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
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
