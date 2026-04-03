import Anthropic from "@anthropic-ai/sdk";
import type {
  RawArticle,
  MarketSnapshot,
  ArticleSummary,
  SummarizationResult,
} from "./types";

const anthropic = new Anthropic();

const CLASSIFICATION_PROMPT = `당신은 한국 개인투자자를 위한 금융 뉴스 분석가입니다. 초보 투자자도 이해할 수 있도록 쉬운 한국어로 분석해주세요.

다음 뉴스 기사들을 분석하고, 각 기사에 대해 JSON 형식으로 응답해주세요.

분류 기준:
- category: "semiconductor" (반도체/AI칩/메모리), "shipbuilding-defense" (조선/방산/군수), "ai-infra" (AI 인프라/데이터센터/클라우드), "secondary-battery" (2차전지/배터리/EV), "geopolitics" (지정학/전쟁/무역), "market" (시장 전반), "general" (기타)
- severity: "긴급" (즉시 대응 필요), "주의" (주시 필요), "참고" (참고용)
- sentiment: "bullish" (호재), "bearish" (악재), "neutral" (중립)

반드시 JSON 배열로만 응답하세요. 다른 텍스트는 포함하지 마세요.

각 항목 형식:
{
  "articleSourceId": "원본 기사 sourceId",
  "title": "한국어 제목 (15자 이내)",
  "summaryKo": "초보 투자자를 위한 한국어 요약 (2-3문장)",
  "category": "semiconductor|shipbuilding-defense|ai-infra|secondary-battery|geopolitics|market|general",
  "severity": "긴급|주의|참고",
  "sentiment": "bullish|bearish|neutral",
  "sectorImpact": ["영향받는 섹터들"],
  "keyTakeaway": "핵심 한줄 요약"
}`;

export async function summarizeArticles(
  articles: RawArticle[],
  _marketData: MarketSnapshot[]
): Promise<SummarizationResult> {
  const errors: string[] = [];
  const summaries: ArticleSummary[] = [];

  // Process in batches of 5 to stay within token limits
  const batchSize = 5;
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);

    const articlesText = batch
      .map(
        (a, idx) =>
          `[Article ${idx + 1}]
sourceId: ${a.sourceId}
Source: ${a.sourceName}
Title: ${a.title}
Content: ${a.content.slice(0, 500)}
Published: ${a.publishedAt}`
      )
      .join("\n\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `${CLASSIFICATION_PROMPT}\n\n--- 기사 목록 ---\n\n${articlesText}`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      // Extract JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed: ArticleSummary[] = JSON.parse(jsonMatch[0]);
        summaries.push(...parsed);
      } else {
        errors.push(`Batch ${i / batchSize}: No valid JSON in response`);
      }
    } catch (error) {
      errors.push(`Batch ${i / batchSize}: ${error}`);
    }
  }

  return {
    summaries,
    processedAt: new Date().toISOString(),
    errors,
  };
}
