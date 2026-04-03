import Anthropic from "@anthropic-ai/sdk";
import type { Report, ReportInput, ReportContent } from "./types";
import { CURRENCY_SYMBOLS, REPORT_TITLES } from "./types";
import { filterMarketData } from "./data-collector";
import { parseLlmJson } from "./parse-json";

const anthropic = new Anthropic();

const PROMPT = `당신은 한국 초보 개인투자자를 위한 환율/채권 분석가입니다.
환율 변동과 채권 시장 동향을 분석하고, 한국 시장에 미칠 영향을 예측해주세요.

## 분석 규칙
1. 달러/원 환율을 최우선으로 분석하세요 — 한국 투자자에게 가장 중요합니다
2. 미국 국채 수익률 변화와 의미를 설명하세요
3. 달러 강세/약세가 한국 수출주에 미치는 영향을 포함하세요
4. 외국인 자금 흐름 가능성을 분석하세요
5. 초보자도 이해할 수 있는 쉬운 한국어를 사용하세요
6. "~할 수 있습니다" 등 단정적이지 않은 표현을 사용하세요
7. 매수/매도 추천은 절대 하지 마세요

## 반드시 아래 JSON 형식으로만 응답하세요:
{
  "headline": "환율/채권 핵심 한줄 (30자 이내)",
  "sections": [
    {
      "title": "섹션 제목",
      "body": "분석 내용 (3-5문장)",
      "dataPoints": [
        {
          "label": "지표명",
          "value": "현재값",
          "change": "+/-변동",
          "sentiment": "bullish|bearish|neutral"
        }
      ]
    }
  ],
  "prediction": {
    "direction": "up|down|sideways",
    "confidence": "high|medium|low",
    "summary": "환율/채권이 한국 시장에 미칠 영향 예측 (2-3문장)",
    "factors": ["주요 요인 1", "주요 요인 2", "주요 요인 3"]
  },
  "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"]
}

반드시 다음 섹션을 포함하세요:
1. 달러/원 환율 분석
2. 주요 통화쌍 동향 (달러/엔, 유로/달러)
3. 미국 국채 수익률 분석
4. 외국인 자금 흐름 전망`;

export async function generateCurrencyReport(
  input: ReportInput
): Promise<Report> {
  const currencyData = filterMarketData(input.marketData, CURRENCY_SYMBOLS);

  // Filter currency/bond relevant news
  const fxKeywords = [
    "dollar",
    "won",
    "yen",
    "euro",
    "currency",
    "forex",
    "treasury",
    "bond",
    "yield",
    "환율",
    "달러",
    "원화",
    "엔화",
    "국채",
    "금리",
    "채권",
    "외국인",
    "자금",
    "유출",
    "유입",
  ];
  const relevantArticles = input.articles.filter((a) => {
    const text = `${a.title} ${a.content}`.toLowerCase();
    return fxKeywords.some((kw) => text.includes(kw.toLowerCase()));
  });

  const prevContext = input.previousReports
    .map((r) => `[${r.title}] ${r.content.headline}`)
    .join("\n");

  const marketText = currencyData
    .map(
      (m) =>
        `${m.name} (${m.symbol}): ${m.price} (${m.change >= 0 ? "+" : ""}${m.change}, ${m.changePercent >= 0 ? "+" : ""}${m.changePercent}%)`
    )
    .join("\n");

  const newsText = relevantArticles
    .slice(0, 8)
    .map((a) => `- [${a.sourceName}] ${a.title}: ${a.content.slice(0, 200)}`)
    .join("\n");

  const userContent = `${PROMPT}

--- 환율/채권 시장 데이터 (${input.date}) ---
${marketText || "시장 데이터를 가져올 수 없습니다."}

--- 관련 뉴스 (최근 24시간) ---
${newsText || "관련 뉴스가 없습니다."}

--- 이전 리포트 요약 ---
${prevContext || "이전 리포트 없음"}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
    messages: [{ role: "user", content: userContent }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const content: ReportContent = parseLlmJson(text);

  return {
    reportNumber: 7,
    reportType: "currency",
    title: REPORT_TITLES["currency"],
    date: input.date,
    dataWindowStart: input.dataWindowStart,
    dataWindowEnd: input.dataWindowEnd,
    content,
    generatedAt: new Date().toISOString(),
    modelUsed: "claude-sonnet-4-6",
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
