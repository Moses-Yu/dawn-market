import Anthropic from "@anthropic-ai/sdk";
import type { ReportContent } from "./types";

const anthropic = new Anthropic();

/**
 * JSON Schema for ReportContent — used with structured outputs
 * to guarantee valid, parseable report JSON from Claude.
 */
const REPORT_CONTENT_SCHEMA = {
  type: "object" as const,
  properties: {
    headline: { type: "string" as const },
    sections: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const },
          body: { type: "string" as const },
          dataPoints: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                label: { type: "string" as const },
                value: { type: "string" as const },
                change: { type: "string" as const },
                sentiment: {
                  type: "string" as const,
                  enum: ["bullish", "bearish", "neutral"],
                },
              },
              required: ["label", "value"] as const,
              additionalProperties: false,
            },
          },
        },
        required: ["title", "body"] as const,
        additionalProperties: false,
      },
    },
    prediction: {
      type: "object" as const,
      properties: {
        direction: {
          type: "string" as const,
          enum: ["up", "down", "sideways"],
        },
        confidence: {
          type: "string" as const,
          enum: ["high", "medium", "low"],
        },
        summary: { type: "string" as const },
        factors: {
          type: "array" as const,
          items: { type: "string" as const },
        },
      },
      required: ["direction", "confidence", "summary", "factors"] as const,
      additionalProperties: false,
    },
    keyTakeaways: {
      type: "array" as const,
      items: { type: "string" as const },
    },
  },
  required: ["headline", "sections", "prediction", "keyTakeaways"] as const,
  additionalProperties: false,
};

interface GenerateReportOptions {
  /** The full prompt including analysis instructions */
  prompt: string;
  /** Whether to enable web search for real-time data (default: true) */
  enableWebSearch?: boolean;
  /** Max tokens for the response (default: 8000) */
  maxTokens?: number;
}

interface GenerateReportResult {
  content: ReportContent;
  tokensUsed: number;
}

/**
 * Generate a report using Claude with web search for real-time data
 * and structured outputs for guaranteed valid JSON.
 */
export async function generateReportWithSearch(
  options: GenerateReportOptions
): Promise<GenerateReportResult> {
  const { prompt, enableWebSearch = true, maxTokens = 8000 } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = enableWebSearch
    ? [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: 3,
          user_location: {
            type: "approximate",
            country: "KR",
          },
        },
      ]
    : [];

  const MAX_RETRIES = 3;
  let response: Anthropic.Messages.Message | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        tools,
        output_config: {
          format: {
            type: "json_schema",
            schema: REPORT_CONTENT_SCHEMA,
          },
        },
        messages: [{ role: "user", content: prompt }],
      });
      break;
    } catch (err) {
      const status = (err as { status?: number }).status;
      if ((status === 529 || status === 503 || status === 500) && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 5000 + Math.random() * 2000;
        console.log(`[GenerateReport] ${status} error, retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  if (!response) throw new Error("Failed after retries");

  console.log(`[GenerateReport] stop_reason=${response.stop_reason}, blocks=${response.content.length}, output_tokens=${response.usage.output_tokens}`);

  // Check for truncated output
  if (response.stop_reason === "max_tokens") {
    throw new Error("Response truncated (max_tokens reached) — increase maxTokens");
  }

  // With web search, there may be multiple text blocks — the last one contains the JSON
  const textBlocks = response.content.filter((block) => block.type === "text");
  console.log(`[GenerateReport] ${textBlocks.length} text blocks found`);
  const textBlock = textBlocks[textBlocks.length - 1];
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block in response");
  }

  console.log(`[GenerateReport] text length=${textBlock.text.length}, first 100 chars: ${textBlock.text.substring(0, 100)}`);

  const content: ReportContent = JSON.parse(textBlock.text);

  return {
    content,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
