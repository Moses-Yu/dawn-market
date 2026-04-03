import type { Report, ReportInput } from "./types";
import { AI_INFRA_SYMBOLS, REPORT_TITLES } from "./types";
import { filterMarketData } from "./data-collector";
import { generateReportWithSearch } from "./generate-with-search";

const PROMPT = `당신은 한국 초보 개인투자자를 위한 AI 인프라 섹터 전문 분석가입니다.
글로벌 AI 인프라 산업 동향을 분석하고, 한국 관련 기업에 미칠 영향을 예측해주세요.

웹 검색 도구를 사용하여 최신 AI 인프라 뉴스, 데이터센터 투자, GPU 공급 동향을 확인하세요.

## 분석 규칙
1. NAVER, 카카오 등 한국 AI 기업을 최우선으로 분석하세요
2. 글로벌 빅테크 AI 투자 동향 (Microsoft, Google, Amazon 등)을 포함하세요
3. 핵심 테마: 데이터센터 건설, GPU 공급, AI 모델 경쟁, 클라우드 인프라, 전력 수요
4. AI 인프라와 반도체/에너지 섹터 간의 연관성을 분석하세요
5. 초보자도 이해할 수 있는 쉬운 한국어를 사용하세요
6. "~할 수 있습니다" 등 단정적이지 않은 표현을 사용하세요
7. 매수/매도 추천은 절대 하지 마세요

반드시 다음 섹션을 포함하세요:
1. 글로벌 빅테크 AI 투자 동향 (Microsoft, Google, Amazon)
2. 한국 AI 기업 영향 분석 (NAVER, 카카오)
3. 데이터센터 & GPU 공급망 동향
4. 핵심 테마 (AI 모델 경쟁, 전력 인프라, 규제)`;

export async function generateAiInfraReport(
  input: ReportInput
): Promise<Report> {
  const sectorData = filterMarketData(input.marketData, AI_INFRA_SYMBOLS);

  const keywords = [
    "artificial intelligence", "AI", "data center", "datacenter", "cloud",
    "GPU", "LLM", "chatgpt", "openai", "microsoft", "google", "amazon",
    "broadcom", "marvell", "인공지능", "데이터센터", "클라우드", "AI 인프라",
    "네이버", "카카오", "하이퍼스케일", "전력",
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

  const prompt = `${PROMPT}

--- AI 인프라 관련 시장 데이터 (${input.date}) ---
${marketText || "시장 데이터를 가져올 수 없습니다. 웹 검색으로 최신 데이터를 찾아주세요."}

--- AI 인프라 관련 뉴스 (최근 24시간) ---
${newsText || "관련 뉴스가 없습니다. 웹 검색으로 최신 뉴스를 찾아주세요."}
${prevContext}`;

  const result = await generateReportWithSearch({ prompt });

  return {
    reportNumber: 4,
    reportType: "ai-infra",
    title: REPORT_TITLES["ai-infra"],
    date: input.date,
    dataWindowStart: input.dataWindowStart,
    dataWindowEnd: input.dataWindowEnd,
    content: result.content,
    generatedAt: new Date().toISOString(),
    modelUsed: "claude-sonnet-4-6",
    tokensUsed: result.tokensUsed,
  };
}
