import Anthropic from "@anthropic-ai/sdk";
import type { Report, ReportInput, ReportContent } from "./types";
import { SHIPBUILDING_DEFENSE_SYMBOLS, REPORT_TITLES } from "./types";
import { filterMarketData } from "./data-collector";
import { parseLlmJson } from "./parse-json";

const anthropic = new Anthropic();

const PROMPT = `당신은 한국 초보 개인투자자를 위한 조선/방산 섹터 전문 분석가입니다.
글로벌 조선·방산 산업 동향을 분석하고, 한국 주요 기업에 미칠 영향을 예측해주세요.

## 분석 규칙
1. HD한국조선해양, 한화에어로스페이스, 한화오션을 최우선으로 분석하세요
2. 글로벌 방산 기업 동향 (Lockheed Martin, RTX, Northrop Grumman 등)을 포함하세요
3. 핵심 테마: LNG선 수주, 해군 함정 건조, K-방산 수출, 우주항공, 무인기(드론)
4. 지정학적 긴장(중동, 동아시아)이 방산주에 미치는 영향을 분석하세요
5. 초보자도 이해할 수 있는 쉬운 한국어를 사용하세요
6. "~할 수 있습니다" 등 단정적이지 않은 표현을 사용하세요
7. 매수/매도 추천은 절대 하지 마세요

## 반드시 아래 JSON 형식으로만 응답하세요:
{
  "headline": "조선/방산 섹터 핵심 한줄 (30자 이내)",
  "sections": [
    {
      "title": "섹션 제목",
      "body": "분석 내용 (3-5문장)",
      "dataPoints": [
        {
          "label": "종목/지표명",
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
    "summary": "한국 조선/방산 종목에 미칠 영향 예측 (2-3문장)",
    "factors": ["주요 요인 1", "주요 요인 2", "주요 요인 3"]
  },
  "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"]
}

반드시 다음 섹션을 포함하세요:
1. 글로벌 방산 기업 동향 (Lockheed Martin, RTX 등)
2. HD한국조선해양/한화오션 영향 분석 (조선 수주, LNG선)
3. 한화에어로스페이스 영향 분석 (K-방산 수출, 우주항공)
4. 핵심 테마 (지정학 리스크, 방위비 증액, 해양 안보)`;

export async function generateShipbuildingDefenseReport(
  input: ReportInput
): Promise<Report> {
  const sectorData = filterMarketData(
    input.marketData,
    SHIPBUILDING_DEFENSE_SYMBOLS
  );

  const keywords = [
    "shipbuilding",
    "defense",
    "defence",
    "military",
    "navy",
    "missile",
    "drone",
    "LNG",
    "vessel",
    "weapon",
    "arms",
    "lockheed",
    "raytheon",
    "rtx",
    "northrop",
    "조선",
    "방산",
    "방위",
    "군수",
    "한화",
    "HD현대",
    "해군",
    "미사일",
    "드론",
    "K-방산",
    "함정",
    "수주",
    "LNG선",
  ];
  const relevantArticles = input.articles.filter((a) => {
    const text = `${a.title} ${a.content}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw.toLowerCase()));
  });

  const prevContext = input.previousReports
    .map(
      (r) =>
        `\n--- 이전 리포트: ${REPORT_TITLES[r.reportType]} ---\n${r.content.headline}\n${r.content.prediction.summary}`
    )
    .join("");

  const marketText = sectorData
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

--- 조선/방산 관련 시장 데이터 (${input.date}) ---
${marketText || "시장 데이터를 가져올 수 없습니다."}

--- 조선/방산 관련 뉴스 (최근 24시간) ---
${newsText || "관련 뉴스가 없습니다."}
${prevContext}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
    messages: [{ role: "user", content: userContent }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const content: ReportContent = parseLlmJson(text);

  return {
    reportNumber: 3,
    reportType: "shipbuilding-defense",
    title: REPORT_TITLES["shipbuilding-defense"],
    date: input.date,
    dataWindowStart: input.dataWindowStart,
    dataWindowEnd: input.dataWindowEnd,
    content,
    generatedAt: new Date().toISOString(),
    modelUsed: "claude-sonnet-4-6",
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
