/**
 * Robustly parse JSON from LLM output.
 * Handles: trailing commas, markdown code fences, extra text around JSON.
 */
export function parseLlmJson<T>(text: string): T {
  // Strip markdown code fences if present
  let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");

  // Try to extract the JSON object/array
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in response");
  }

  cleaned = jsonMatch[0];

  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  // Remove JavaScript-style comments (// ...)
  cleaned = cleaned.replace(/\/\/[^\n]*/g, "");

  // Remove control characters that break JSON (except newline/tab)
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    // Second attempt: try to fix common issues
    // Double-escaped quotes
    cleaned = cleaned.replace(/\\\\"/g, '\\"');

    // Unescaped newlines in strings — replace with \\n
    cleaned = cleaned.replace(
      /"([^"]*?)"/g,
      (match) => match.replace(/\n/g, "\\n").replace(/\r/g, "\\r")
    );

    try {
      return JSON.parse(cleaned);
    } catch {
      throw firstError;
    }
  }
}
