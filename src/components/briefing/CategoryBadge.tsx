import type { Category } from "@/lib/pipeline/types";

const config: Record<Category, { label: string; bg: string; text: string }> = {
  semiconductor: {
    label: "반도체",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
  },
  "shipbuilding-defense": {
    label: "조선/방산",
    bg: "bg-teal-500/15",
    text: "text-teal-400",
  },
  "ai-infra": {
    label: "AI 인프라",
    bg: "bg-cyan-500/15",
    text: "text-cyan-400",
  },
  "secondary-battery": {
    label: "2차전지",
    bg: "bg-green-500/15",
    text: "text-green-400",
  },
  "bio-healthcare": {
    label: "바이오/헬스케어",
    bg: "bg-pink-500/15",
    text: "text-pink-400",
  },
  finance: {
    label: "금융/은행",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
  },
  geopolitics: {
    label: "지정학",
    bg: "bg-orange-500/15",
    text: "text-orange-400",
  },
  market: {
    label: "시장",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
  },
  general: {
    label: "일반",
    bg: "bg-gray-500/15",
    text: "text-gray-400",
  },
};

export default function CategoryBadge({ category }: { category: Category }) {
  const c = config[category] ?? config.general;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}
