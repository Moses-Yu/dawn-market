import type { Report, ReportInput } from "./types";
import { ASIAN_SYMBOLS, REPORT_TITLES } from "./types";
import { filterMarketData } from "./data-collector";
import { generateReportWithSearch } from "./generate-with-search";

const PROMPT = `당신은 한국 초보 개인투자자를 위한 아시아 시장 분석가입니다.
아시아 주요 시장의 프리마켓/전일 동향을 분석하고, 오늘 한국 시장 개장에 미칠 영향을 예측해주세요.

웹 검색 도구를 사용하여 최신 KOSPI/KOSDAQ, 닛케이, 항셍 동향과 아시아 자금 흐름을 확인하세요.

## 분석 규칙
1. KOSPI, KOSDAQ 전일 마감과 오늘 예상을 중심으로 분석하세요
2. 일본(닛케이), 중국(CSI 300), 홍콩(항셍) 시장을 포함하세요
3. 아시아 시장 간 상관관계와 자금 흐름을 설명하세요
4. 초보자도 이해할 수 있는 쉬운 한국어를 사용하세요
5. "~할 수 있습니다" 등 단정적이지 않은 표현을 사용하세요
6. 매수/매도 추천은 절대 하지 마세요

반드시 다음 섹션을 포함하세요:
1. KOSPI/KOSDAQ 전일 마감 및 오늘 전망
2. 일본 시장 (닛케이 225)
3. 중국/홍콩 시장 (CSI 300, 항셍)
4. 아시아 자금 흐름 및 종합 전망`;

export async function generateAsianPremarketReport(
  input: ReportInput
): Promise<Report> {
  const asianData = filterMarketData(input.marketData, ASIAN_SYMBOLS);

  const asiaKeywords = [
    "kospi", "kosdaq", "nikkei", "hang seng", "shanghai", "asia", "japan",
    "china", "korea", "코스피", "코스닥", "닛케이", "항셍", "아시아",
    "일본", "중국", "홍콩", "한국", "외국인",
  ];
  const relevantArticles = input.articles.filter((a) => {
    const text = `${a.title} ${a.content}`.toLowerCase();
    return asiaKeywords.some((kw) => text.includes(kw.toLowerCase()));
  });

  const prevContext = input.previousReports
    .map((r) => `[${r.title}] ${r.content.headline} — ${r.content.prediction.summary}`)
    .join("\n");

  const marketText = asianData
    .map(
      (m) =>
        `${m.name} (${m.symbol}): ${m.price} (${m.change >= 0 ? "+" : ""}${m.change}, ${m.changePercent >= 0 ? "+" : ""}${m.changePercent}%)`
    )
    .join("\n");

  const newsText = relevantArticles
    .slice(0, 8)
    .map((a) => `- [${a.sourceName}] ${a.title}: ${a.content.slice(0, 200)}`)
    .join("\n");

  const prompt = `${PROMPT}

--- 아시아 시장 데이터 (${input.date}) ---
${marketText || "시장 데이터를 가져올 수 없습니다. 웹 검색으로 최신 데이터를 찾아주세요."}

--- 관련 뉴스 (최근 24시간) ---
${newsText || "관련 뉴스가 없습니다. 웹 검색으로 최신 뉴스를 찾아주세요."}

--- 이전 리포트 요약 ---
${prevContext || "이전 리포트 없음"}`;

  const result = await generateReportWithSearch({ prompt });

  return {
    reportNumber: 8,
    reportType: "asian-premarket",
    title: REPORT_TITLES["asian-premarket"],
    date: input.date,
    dataWindowStart: input.dataWindowStart,
    dataWindowEnd: input.dataWindowEnd,
    content: result.content,
    generatedAt: new Date().toISOString(),
    modelUsed: "claude-sonnet-4-6",
    tokensUsed: result.tokensUsed,
  };
}
