import Anthropic from "@anthropic-ai/sdk";
import type { Report, ReportInput, ReportContent } from "./types";
import { SEMICONDUCTOR_SYMBOLS, REPORT_TITLES } from "./types";
import { filterMarketData } from "./data-collector";
import { parseLlmJson } from "./parse-json";

const anthropic = new Anthropic();

const PROMPT = `당신은 한국 초보 개인투자자를 위한 반도체 섹터 전문 분석가입니다.
글로벌 반도체 산업 동향을 분석하고, 삼성전자와 SK하이닉스에 미칠 영향을 예측해주세요.

## 분석 규칙
1. 삼성전자와 SK하이닉스를 최우선으로 분석하세요
2. NVIDIA, TSMC, ASML 등 글로벌 반도체 기업 동향을 포함하세요
3. HBM(고대역폭메모리), AI칩, 파운드리 등 핵심 테마를 다루세요
4. 초보자도 이해할 수 있는 쉬운 한국어를 사용하세요
5. "~할 수 있습니다" 등 단정적이지 않은 표현을 사용하세요
6. 매수/매도 추천은 절대 하지 마세요

## 반드시 아래 JSON 형식으로만 응답하세요:
{
  "headline": "반도체 섹터 핵심 한줄 (30자 이내)",
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
    "summary": "한국 반도체 종목에 미칠 영향 예측 (2-3문장)",
    "factors": ["주요 요인 1", "주요 요인 2", "주요 요인 3"]
  },
  "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"]
}

반드시 다음 섹션을 포함하세요:
1. 글로벌 반도체 기업 동향 (NVIDIA, TSMC, ASML 등)
2. 삼성전자 영향 분석
3. SK하이닉스 영향 분석
4. 핵심 테마 (HBM, AI칩, 파운드리 등)`;

export async function generateSemiconductorReport(
  input: ReportInput
): Promise<Report> {
  const semiData = filterMarketData(input.marketData, SEMICONDUCTOR_SYMBOLS);

  // Filter semiconductor-relevant news
  const semiKeywords = [
    "semiconductor",
    "chip",
    "nvidia",
    "tsmc",
    "asml",
    "samsung",
    "hynix",
    "반도체",
    "삼성",
    "하이닉스",
    "HBM",
    "AI칩",
    "파운드리",
    "foundry",
    "memory",
    "DRAM",
    "NAND",
    "GPU",
    "amd",
    "intel",
  ];
  const relevantArticles = input.articles.filter((a) => {
    const text = `${a.title} ${a.content}`.toLowerCase();
    return semiKeywords.some((kw) => text.includes(kw.toLowerCase()));
  });

  // Include US market report context if available
  const usReport = input.previousReports.find(
    (r) => r.reportType === "us-market"
  );
  const usContext = usReport
    ? `\n--- 이전 리포트: 미국 시장 마감 ---\n${usReport.content.headline}\n${usReport.content.prediction.summary}`
    : "";

  const marketText = semiData
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

--- 반도체 관련 시장 데이터 (${input.date}) ---
${marketText || "시장 데이터를 가져올 수 없습니다."}

--- 반도체 관련 뉴스 (최근 24시간) ---
${newsText || "관련 뉴스가 없습니다."}
${usContext}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
    messages: [{ role: "user", content: userContent }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const content: ReportContent = parseLlmJson(text);

  return {
    reportNumber: 2,
    reportType: "semiconductor",
    title: REPORT_TITLES["semiconductor"],
    date: input.date,
    dataWindowStart: input.dataWindowStart,
    dataWindowEnd: input.dataWindowEnd,
    content,
    generatedAt: new Date().toISOString(),
    modelUsed: "claude-sonnet-4-6",
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
