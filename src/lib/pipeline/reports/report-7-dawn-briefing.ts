import Anthropic from "@anthropic-ai/sdk";
import type { Report, ReportInput, ReportContent } from "./types";
import { REPORT_TITLES } from "./types";

const anthropic = new Anthropic();

const PROMPT = `당신은 한국 초보 개인투자자를 위한 새벽시장 종합 브리핑 작성자입니다.
9개의 개별 리포트를 종합하여, 오늘 한국 시장에 대한 최종 예측과 핵심 체크포인트를 작성해주세요.

## 종합할 리포트
1. 미국/글로벌 시장 마감 리포트
2. 반도체 섹터 인텔리전스
3. 조선/방산 섹터 인텔리전스
4. AI 인프라 섹터 인텔리전스
5. 2차전지 섹터 인텔리전스
6. 지정학 & 거시경제 리포트
7. 환율 & 채권 리포트
8. 아시아 프리마켓 리포트
9. 기술적 분석 & 센티먼트 리포트

## 작성 규칙
1. 9개 리포트의 예측이 일치하는 부분과 상충하는 부분을 모두 다루세요
2. 4대 핵심 섹터(반도체, 조선/방산, AI 인프라, 2차전지) 전망을 각각 요약하세요
3. 종합적인 최종 예측을 제시하되, 불확실성을 인정하세요
4. 오늘 하루 초보 투자자가 주목해야 할 3가지 핵심 포인트를 제시하세요
5. 구체적인 매수/매도 추천은 절대 하지 마세요
6. 초보자도 이해할 수 있는 쉬운 한국어를 사용하세요
7. 공포를 조장하지 말고 객관적이고 차분한 톤을 유지하세요
8. "~할 수 있습니다", "~가능성이 있습니다" 등 단정적이지 않은 표현을 사용하세요

## 반드시 아래 JSON 형식으로만 응답하세요:
{
  "headline": "오늘의 종합 전망 핵심 한줄 (30자 이내)",
  "sections": [
    {
      "title": "섹션 제목",
      "body": "분석 내용 (3-5문장)",
      "dataPoints": [
        {
          "label": "지표/포인트",
          "value": "상태/수치",
          "change": "변화",
          "sentiment": "bullish|bearish|neutral"
        }
      ]
    }
  ],
  "prediction": {
    "direction": "up|down|sideways",
    "confidence": "high|medium|low",
    "summary": "오늘 한국 시장 종합 예측 (3-4문장, 초보자 친화적)",
    "factors": ["결정적 요인 1", "결정적 요인 2", "결정적 요인 3"]
  },
  "keyTakeaways": [
    "오늘 주목할 포인트 1",
    "오늘 주목할 포인트 2",
    "오늘 주목할 포인트 3"
  ]
}

반드시 다음 섹션을 포함하세요:
1. 종합 시장 전망 (9개 리포트 종합)
2. 핵심 리스크 요인
3. 4대 섹터 종합 전망 (반도체, 조선/방산, AI 인프라, 2차전지)
4. 초보 투자자를 위한 오늘의 체크포인트`;

export async function generateDawnBriefingReport(
  input: ReportInput
): Promise<Report> {
  // Compile all previous reports into a structured summary
  const reportsSummary = input.previousReports
    .map(
      (r) => `
## ${r.title} (리포트 ${r.reportNumber})
**핵심:** ${r.content.headline}
**예측:** ${r.content.prediction.direction} (확신도: ${r.content.prediction.confidence})
**요약:** ${r.content.prediction.summary}
**주요 요인:** ${r.content.prediction.factors.join(", ")}
**핵심 포인트:**
${r.content.keyTakeaways.map((t) => `- ${t}`).join("\n")}`
    )
    .join("\n");

  // Count prediction directions
  const directions = input.previousReports.map(
    (r) => r.content.prediction.direction
  );
  const upCount = directions.filter((d) => d === "up").length;
  const downCount = directions.filter((d) => d === "down").length;
  const sidewaysCount = directions.filter((d) => d === "sideways").length;

  const consensusText = `예측 종합: 상승 ${upCount}개, 하락 ${downCount}개, 보합 ${sidewaysCount}개 (총 ${directions.length}개 리포트)`;

  // Key market data summary
  const keyMarket = input.marketData
    .filter((m) =>
      ["^KS11", "^KQ11", "^GSPC", "^VIX", "USDKRW=X", "005930.KS", "000660.KS", "009540.KS", "012450.KS", "373220.KS"].includes(
        m.symbol
      )
    )
    .map(
      (m) =>
        `${m.name}: ${m.price} (${m.changePercent >= 0 ? "+" : ""}${m.changePercent}%)`
    )
    .join("\n");

  const userContent = `${PROMPT}

--- 9개 리포트 종합 ---
${reportsSummary}

--- ${consensusText} ---

--- 주요 시장 데이터 ---
${keyMarket || "시장 데이터를 가져올 수 없습니다."}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: userContent }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      "Report 7 (Dawn Briefing): Failed to parse JSON response"
    );
  }

  const content: ReportContent = JSON.parse(jsonMatch[0]);

  return {
    reportNumber: 10,
    reportType: "dawn-briefing",
    title: REPORT_TITLES["dawn-briefing"],
    date: input.date,
    dataWindowStart: input.dataWindowStart,
    dataWindowEnd: input.dataWindowEnd,
    content,
    generatedAt: new Date().toISOString(),
    modelUsed: "claude-sonnet-4-6",
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
