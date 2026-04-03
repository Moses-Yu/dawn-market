import Anthropic from "@anthropic-ai/sdk";
import type { Report, ReportInput, ReportContent } from "./types";
import { REPORT_TITLES } from "./types";
import { parseLlmJson } from "./parse-json";

const anthropic = new Anthropic();

const PROMPT = `당신은 한국 초보 개인투자자를 위한 지정학/거시경제 분석가입니다.
최근 24시간의 지정학적 이벤트와 거시경제 지표를 분석하고, 한국 시장에 미칠 영향을 예측해주세요.

## 분석 규칙
1. 미중 관계, 무역 분쟁, 관세, 제재 등을 우선적으로 다루세요
2. 중앙은행 정책 (연준, 한은, ECB, BOJ) 변화를 포함하세요
3. 전쟁/분쟁, 에너지 공급, 공급망 이슈를 다루세요
4. 초보자도 이해할 수 있는 쉬운 한국어를 사용하세요
5. "~할 수 있습니다" 등 단정적이지 않은 표현을 사용하세요
6. 매수/매도 추천은 절대 하지 마세요
7. 공포를 조장하지 말고 객관적이고 차분한 톤을 유지하세요

## 반드시 아래 JSON 형식으로만 응답하세요:
{
  "headline": "지정학/거시경제 핵심 한줄 (30자 이내)",
  "sections": [
    {
      "title": "섹션 제목",
      "body": "분석 내용 (3-5문장)",
      "dataPoints": [
        {
          "label": "지표/이벤트",
          "value": "상태/수치",
          "change": "변화 내용",
          "sentiment": "bullish|bearish|neutral"
        }
      ]
    }
  ],
  "prediction": {
    "direction": "up|down|sideways",
    "confidence": "high|medium|low",
    "summary": "한국 시장에 미칠 지정학적 영향 예측 (2-3문장)",
    "factors": ["주요 요인 1", "주요 요인 2", "주요 요인 3"]
  },
  "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"]
}

반드시 다음 섹션을 포함하세요:
1. 미중 관계 및 무역 동향
2. 중앙은행 정책 동향
3. 글로벌 리스크 요인 (전쟁, 에너지, 공급망)
4. 한국 시장 영향 분석`;

export async function generateGeopoliticalReport(
  input: ReportInput
): Promise<Report> {
  // Filter geopolitical/macro news
  const geoKeywords = [
    "tariff",
    "trade",
    "sanction",
    "war",
    "conflict",
    "fed",
    "interest rate",
    "inflation",
    "gdp",
    "employment",
    "관세",
    "무역",
    "제재",
    "전쟁",
    "금리",
    "인플레이션",
    "고용",
    "연준",
    "한은",
    "ECB",
    "BOJ",
    "OPEC",
    "중국",
    "china",
    "geopolit",
    "지정학",
    "공급망",
    "supply chain",
  ];
  const relevantArticles = input.articles.filter((a) => {
    const text = `${a.title} ${a.content}`.toLowerCase();
    return geoKeywords.some((kw) => text.includes(kw.toLowerCase()));
  });

  // Context from previous reports
  const prevContext = input.previousReports
    .map((r) => `[${r.title}] ${r.content.headline} — ${r.content.prediction.summary}`)
    .join("\n");

  const newsText = relevantArticles
    .slice(0, 12)
    .map((a) => `- [${a.sourceName}] ${a.title}: ${a.content.slice(0, 250)}`)
    .join("\n");

  const userContent = `${PROMPT}

--- 지정학/거시경제 관련 뉴스 (최근 24시간) ---
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
    reportNumber: 6,
    reportType: "geopolitical",
    title: REPORT_TITLES["geopolitical"],
    date: input.date,
    dataWindowStart: input.dataWindowStart,
    dataWindowEnd: input.dataWindowEnd,
    content,
    generatedAt: new Date().toISOString(),
    modelUsed: "claude-sonnet-4-6",
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
