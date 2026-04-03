import Anthropic from "@anthropic-ai/sdk";
import type { Report, ReportInput, ReportContent } from "./types";
import { REPORT_TITLES } from "./types";
import { parseLlmJson } from "./parse-json";

const anthropic = new Anthropic();

const PROMPT = `당신은 한국 초보 개인투자자를 위한 기술적 분석 및 시장 센티먼트 분석가입니다.
주요 지수의 기술적 수준과 시장 심리를 분석하고, 오늘 한국 시장의 방향을 예측해주세요.

## 분석 규칙
1. KOSPI, KOSDAQ의 주요 기술적 수준 (지지선, 저항선)을 분석하세요
2. VIX (공포지수)를 통한 시장 심리를 분석하세요
3. 이전 리포트들의 예측 방향을 종합하여 기술적 관점에서 검증하세요
4. 초보자도 이해할 수 있는 쉬운 한국어를 사용하세요
5. 기술적 용어는 반드시 쉬운 설명을 함께 달아주세요
6. "~할 수 있습니다" 등 단정적이지 않은 표현을 사용하세요
7. 매수/매도 추천은 절대 하지 마세요

## 반드시 아래 JSON 형식으로만 응답하세요:
{
  "headline": "기술적 분석 핵심 한줄 (30자 이내)",
  "sections": [
    {
      "title": "섹션 제목",
      "body": "분석 내용 (3-5문장)",
      "dataPoints": [
        {
          "label": "지표명",
          "value": "현재값/수준",
          "change": "변화/상태",
          "sentiment": "bullish|bearish|neutral"
        }
      ]
    }
  ],
  "prediction": {
    "direction": "up|down|sideways",
    "confidence": "high|medium|low",
    "summary": "기술적 관점의 한국 시장 전망 (2-3문장)",
    "factors": ["주요 요인 1", "주요 요인 2", "주요 요인 3"]
  },
  "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"]
}

반드시 다음 섹션을 포함하세요:
1. KOSPI 기술적 분석 (지지선, 저항선, 추세)
2. KOSDAQ 기술적 분석
3. VIX 공포지수 & 시장 센티먼트
4. 종합 기술적 전망`;

export async function generateTechnicalReport(
  input: ReportInput
): Promise<Report> {
  // Collect all previous predictions for cross-validation
  const previousPredictions = input.previousReports.map((r) => ({
    report: r.title,
    direction: r.content.prediction.direction,
    confidence: r.content.prediction.confidence,
    summary: r.content.prediction.summary,
  }));

  // Get key market levels
  const kospi = input.marketData.find((m) => m.symbol === "^KS11");
  const kosdaq = input.marketData.find((m) => m.symbol === "^KQ11");
  const vix = input.marketData.find((m) => m.symbol === "^VIX");
  const sp500 = input.marketData.find((m) => m.symbol === "^GSPC");

  const marketText = [kospi, kosdaq, vix, sp500]
    .filter(Boolean)
    .map(
      (m) =>
        `${m!.name} (${m!.symbol}): ${m!.price} (${m!.change >= 0 ? "+" : ""}${m!.change}, ${m!.changePercent >= 0 ? "+" : ""}${m!.changePercent}%)`
    )
    .join("\n");

  const prevPredText = previousPredictions
    .map(
      (p) =>
        `- ${p.report}: 방향=${p.direction}, 확신도=${p.confidence}\n  ${p.summary}`
    )
    .join("\n");

  const userContent = `${PROMPT}

--- 주요 지수 데이터 (${input.date}) ---
${marketText || "시장 데이터를 가져올 수 없습니다."}

--- 이전 리포트 예측 종합 ---
${prevPredText || "이전 리포트 없음"}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
    messages: [{ role: "user", content: userContent }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const content: ReportContent = parseLlmJson(text);

  return {
    reportNumber: 9,
    reportType: "technical",
    title: REPORT_TITLES["technical"],
    date: input.date,
    dataWindowStart: input.dataWindowStart,
    dataWindowEnd: input.dataWindowEnd,
    content,
    generatedAt: new Date().toISOString(),
    modelUsed: "claude-sonnet-4-6",
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
