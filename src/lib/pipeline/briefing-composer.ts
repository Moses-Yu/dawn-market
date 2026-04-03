import Anthropic from "@anthropic-ai/sdk";
import type {
  ArticleSummary,
  MarketSnapshot,
  MorningBriefing,
  BriefingStory,
} from "./types";

const anthropic = new Anthropic();

const BRIEFING_PROMPT = `당신은 한국 초보 개인투자자를 위한 아침 브리핑 작성자입니다.
밤새 일어난 해외 시장 뉴스를 분석하여, 오늘 한국 시장에 미칠 영향을 쉬운 한국어로 정리해주세요.

다음 규칙을 따르세요:
1. 4대 핵심 섹터를 반드시 분석하세요: 반도체, 조선/방산, AI 인프라, 2차전지
2. 각 섹터별 주요 기업을 언급하세요:
   - 반도체: 삼성전자, SK하이닉스, NVIDIA, TSMC
   - 조선/방산: HD한국조선해양, 한화에어로스페이스, 한화오션
   - AI 인프라: NAVER, 카카오, Microsoft, Alphabet
   - 2차전지: LG에너지솔루션, 삼성SDI, 에코프로비엠
3. 초보자도 이해할 수 있는 쉬운 용어를 사용하세요
4. 공포를 조장하지 말고, 객관적이고 차분한 톤을 유지하세요
5. "~할 수 있습니다", "~가능성이 있습니다" 등 단정적이지 않은 표현을 사용하세요
6. 구체적인 매수/매도 추천은 절대 하지 마세요

반드시 아래 JSON 형식으로만 응답하세요:
{
  "marketOverviewSummary": "시장 전체 요약 (3-4문장, 초보자 친화적)",
  "topStories": [
    {
      "title": "한국어 제목",
      "summary": "2-3문장 요약",
      "category": "semiconductor|shipbuilding-defense|ai-infra|secondary-battery|geopolitics|market|general",
      "severity": "긴급|주의|참고",
      "sentiment": "bullish|bearish|neutral",
      "sources": ["출처명"]
    }
  ],
  "sectorAnalysis": [
    {
      "sector": "섹터명",
      "outlook": "전망 요약 (1-2문장)",
      "sentiment": "bullish|bearish|neutral"
    }
  ],
  "actionItems": ["초보 투자자를 위한 오늘의 체크포인트 (매수/매도 추천 제외)"]
}`;

export async function composeBriefing(
  summaries: ArticleSummary[],
  marketData: MarketSnapshot[]
): Promise<MorningBriefing> {
  const today = new Date().toISOString().split("T")[0];

  const marketText = marketData
    .map(
      (m) =>
        `${m.name} (${m.symbol}): ${m.price} (${m.change >= 0 ? "+" : ""}${m.change}, ${m.changePercent >= 0 ? "+" : ""}${m.changePercent}%)`
    )
    .join("\n");

  const summariesText = summaries
    .map(
      (s) =>
        `[${s.severity}] [${s.category}] ${s.title}
요약: ${s.summaryKo}
핵심: ${s.keyTakeaway}
영향 섹터: ${s.sectorImpact.join(", ")}`
    )
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `${BRIEFING_PROMPT}\n\n--- 시장 데이터 (${today}) ---\n${marketText}\n\n--- 분석된 뉴스 요약 ---\n${summariesText}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse briefing response as JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const topStories: BriefingStory[] = (parsed.topStories || []).map(
    (s: BriefingStory) => ({
      title: s.title,
      summary: s.summary,
      category: s.category,
      severity: s.severity,
      sentiment: s.sentiment,
      sources: s.sources || [],
    })
  );

  return {
    date: today,
    generatedAt: new Date().toISOString(),
    marketOverview: {
      summary: parsed.marketOverviewSummary || "",
      keyIndices: marketData,
    },
    topStories,
    sectorAnalysis: parsed.sectorAnalysis || [],
    actionItems: parsed.actionItems || [],
  };
}
