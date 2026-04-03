import type { Report, ReportInput } from "./types";
import { SECONDARY_BATTERY_SYMBOLS, REPORT_TITLES } from "./types";
import { filterMarketData } from "./data-collector";
import { generateReportWithSearch } from "./generate-with-search";

const PROMPT = `당신은 한국 초보 개인투자자를 위한 2차전지 섹터 전문 분석가입니다.
글로벌 배터리·전기차 산업 동향을 분석하고, 한국 주요 기업에 미칠 영향을 예측해주세요.

웹 검색 도구를 사용하여 최신 EV/배터리 뉴스, 리튬 가격, IRA 정책 동향을 확인하세요.

## 분석 규칙
1. LG에너지솔루션, 삼성SDI, 에코프로비엠을 최우선으로 분석하세요
2. 글로벌 EV 및 배터리 동향 (Tesla, CATL, 리튬 가격 등)을 포함하세요
3. 핵심 테마: 배터리 기술 경쟁(LFP vs 삼원계), 리튬·니켈·코발트 원자재 가격, IRA(인플레이션감축법), 유럽 배터리 규제, 전고체 배터리
4. EV 판매 데이터와 배터리 수주 동향을 분석하세요
5. 초보자도 이해할 수 있는 쉬운 한국어를 사용하세요
6. "~할 수 있습니다" 등 단정적이지 않은 표현을 사용하세요
7. 매수/매도 추천은 절대 하지 마세요

반드시 다음 섹션을 포함하세요:
1. 글로벌 EV 시장 동향 (Tesla, BYD, 유럽 EV 판매)
2. LG에너지솔루션/삼성SDI 영향 분석 (수주, 공장 가동)
3. 에코프로비엠/에코프로 및 소재주 동향
4. 핵심 테마 (원자재 가격, IRA 정책, 배터리 기술 경쟁)`;

export async function generateSecondaryBatteryReport(
  input: ReportInput
): Promise<Report> {
  const sectorData = filterMarketData(
    input.marketData,
    SECONDARY_BATTERY_SYMBOLS
  );

  const keywords = [
    "battery", "EV", "electric vehicle", "lithium", "cobalt", "nickel",
    "cathode", "anode", "tesla", "CATL", "BYD", "solid-state", "LFP",
    "2차전지", "배터리", "전기차", "리튬", "양극재", "음극재", "에코프로",
    "LG에너지", "삼성SDI", "SK이노", "전고체", "IRA",
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

--- 2차전지 관련 시장 데이터 (${input.date}) ---
${marketText || "시장 데이터를 가져올 수 없습니다. 웹 검색으로 최신 데이터를 찾아주세요."}

--- 2차전지 관련 뉴스 (최근 24시간) ---
${newsText || "관련 뉴스가 없습니다. 웹 검색으로 최신 뉴스를 찾아주세요."}
${prevContext}`;

  const result = await generateReportWithSearch({ prompt });

  return {
    reportNumber: 5,
    reportType: "secondary-battery",
    title: REPORT_TITLES["secondary-battery"],
    date: input.date,
    dataWindowStart: input.dataWindowStart,
    dataWindowEnd: input.dataWindowEnd,
    content: result.content,
    generatedAt: new Date().toISOString(),
    modelUsed: "claude-sonnet-4-6",
    tokensUsed: result.tokensUsed,
  };
}
