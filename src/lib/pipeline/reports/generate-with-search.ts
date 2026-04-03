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
  /** Max tokens for the response (default: 2500) */
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
  const { prompt, enableWebSearch = true, maxTokens = 2500 } = options;

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

  const response = await anthropic.messages.create({
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

  // With structured outputs, the text block is guaranteed valid JSON
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block in response");
  }

  const content: ReportContent = JSON.parse(textBlock.text);

  return {
    content,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
