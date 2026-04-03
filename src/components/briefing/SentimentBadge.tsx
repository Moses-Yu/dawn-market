import type { Sentiment } from "@/lib/pipeline/types";

const config: Record<Sentiment, { label: string; bg: string; text: string }> = {
  bullish: { label: "긍정", bg: "bg-green-500/15", text: "text-green-400" },
  bearish: { label: "부정", bg: "bg-red-500/15", text: "text-red-400" },
  neutral: { label: "중립", bg: "bg-gray-500/15", text: "text-gray-400" },
};

export default function SentimentBadge({
  sentiment,
}: {
  sentiment: Sentiment;
}) {
  const c = config[sentiment] ?? config.neutral;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}
