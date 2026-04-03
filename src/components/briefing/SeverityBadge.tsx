import type { Severity } from "@/lib/pipeline/types";

const config: Record<Severity, { emoji: string; bg: string; text: string }> = {
  긴급: { emoji: "🔴", bg: "bg-red-500/15", text: "text-red-400" },
  주의: { emoji: "🟡", bg: "bg-yellow-500/15", text: "text-yellow-400" },
  참고: { emoji: "🟢", bg: "bg-green-500/15", text: "text-green-400" },
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const c = config[severity] ?? config["참고"];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span>{c.emoji}</span>
      {severity}
    </span>
  );
}
