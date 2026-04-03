import Anthropic from "@anthropic-ai/sdk";
import type { Report, ReportInput, ReportContent } from "./types";
import { US_MARKET_SYMBOLS, REPORT_TITLES } from "./types";
import { filterMarketData } from "./data-collector";
import { parseLlmJson } from "./parse-json";

const anthropic = new Anthropic();

const PROMPT = `당신은 한국 초보 개인투자자를 위한 미국/글로벌 시장 분석가입니다.
밤새 미국과 글로벌 시장에서 일어난 일을 분석하고, 오늘 한국 시장에 미칠 영향을 예측해주세요.

## 분석 규칙
1. 초보자도 이해할 수 있는 쉬운 한국어를 사용하세요
2. 구체적인 수치와 변동률을 포함하세요
3. "~할 수 있습니다", "~가능성이 있습니다" 등 단정적이지 않은 표현을 사용하세요
4. 매수/매도 추천은 절대 하지 마세요
5. 공포를 조장하지 말고 객관적이고 차분한 톤을 유지하세요

## 반드시 아래 JSON 형식으로만 응답하세요:
{
  "headline": "오늘의 핵심 한줄 (30자 이내)",
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
    "summary": "한국 시장에 미칠 영향 예측 (2-3문장)",
    "factors": ["주요 요인 1", "주요 요인 2", "주요 요인 3"]
  },
  "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"]
}

반드시 다음 섹션을 포함하세요:
1. 미국 3대 지수 마감 분석 (S&P 500, NASDAQ, Dow Jones)
2. 선물 시장 동향 (S&P, NASDAQ 선물)
3. VIX 공포지수 분석
4. 한국 시장 영향 예측`;

export async function generateUsMarketReport(
  input: ReportInput
): Promise<Report> {
  const usMarketData = filterMarketData(input.marketData, US_MARKET_SYMBOLS);

  // Filter news relevant to US markets
  const usKeywords = [
    "S&P",
    "nasdaq",
    "dow",
    "wall street",
    "fed",
    "fomc",
    "treasury",
    "미국",
    "뉴욕",
    "월가",
    "연준",
  ];
  const relevantArticles = input.articles.filter((a) => {
    const text = `${a.title} ${a.content}`.toLowerCase();
    return usKeywords.some((kw) => text.includes(kw.toLowerCase()));
  });

  const marketText = usMarketData
    .map(
      (m) =>
        `${m.name} (${m.symbol}): ${m.price} (${m.change >= 0 ? "+" : ""}${m.change}, ${m.changePercent >= 0 ? "+" : ""}${m.changePercent}%)`
    )
    .join("\n");

  const newsText = relevantArticles
    .slice(0, 10)
    .map((a) => `- [${a.sourceName}] ${a.title}: ${a.content.slice(0, 200)}`)
    .join("\n");

  const userContent = `${PROMPT}

--- 미국/글로벌 시장 데이터 (${input.date}) ---
${marketText || "시장 데이터를 가져올 수 없습니다."}

--- 관련 뉴스 (최근 24시간) ---
${newsText || "관련 뉴스가 없습니다."}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
    messages: [{ role: "user", content: userContent }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const content: ReportContent = parseLlmJson(text);

  return {
    reportNumber: 1,
    reportType: "us-market",
    title: REPORT_TITLES["us-market"],
    date: input.date,
    dataWindowStart: input.dataWindowStart,
    dataWindowEnd: input.dataWindowEnd,
    content,
    generatedAt: new Date().toISOString(),
    modelUsed: "claude-sonnet-4-6",
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
