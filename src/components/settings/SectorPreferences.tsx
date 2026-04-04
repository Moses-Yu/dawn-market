"use client";

import { useState, useTransition } from "react";
import { updateSectorPreferences } from "@/app/actions/preferences";

const SECTORS = [
  {
    id: "semiconductor",
    label: "반도체",
    icon: "🔬",
    description: "삼성전자, SK하이닉스, NVIDIA, TSMC",
  },
  {
    id: "shipbuilding-defense",
    label: "조선/방산",
    icon: "🚢",
    description: "HD한국조선해양, 한화에어로스페이스, 한화오션",
  },
  {
    id: "ai-infra",
    label: "AI 인프라",
    icon: "🤖",
    description: "NAVER, 카카오, Microsoft, Alphabet",
  },
  {
    id: "secondary-battery",
    label: "2차전지",
    icon: "🔋",
    description: "LG에너지솔루션, 삼성SDI, 에코프로비엠",
  },
  {
    id: "bio-healthcare",
    label: "바이오/헬스케어",
    icon: "🧬",
    description: "삼성바이오로직스, 셀트리온, Eli Lilly, Novo Nordisk",
  },
  {
    id: "finance",
    label: "금융/은행",
    icon: "🏦",
    description: "KB금융, 신한지주, 하나금융지주, JPMorgan",
  },
];

export default function SectorPreferences({
  initialSectors,
}: {
  initialSectors: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSectors)
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(sectorId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sectorId)) {
        next.delete(sectorId);
      } else {
        next.add(sectorId);
      }
      return next;
    });
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      const result = await updateSectorPreferences(Array.from(selected));
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  const hasChanges =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify([...initialSectors].sort());

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {SECTORS.map((sector) => {
          const isSelected = selected.has(sector.id);
          return (
            <button
              key={sector.id}
              type="button"
              onClick={() => toggle(sector.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                isSelected
                  ? "border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{sector.icon}</span>
                <span className="text-sm font-bold">{sector.label}</span>
              </div>
              <p className="mt-1 text-[10px] text-[var(--color-muted)] leading-tight">
                {sector.description}
              </p>
            </button>
          );
        })}
      </div>

      {(hasChanges || saved) && (
        <button
          type="button"
          onClick={save}
          disabled={isPending || saved}
          className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            saved
              ? "bg-green-500/20 text-green-400"
              : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/80"
          } disabled:opacity-50`}
        >
          {isPending ? "저장 중..." : saved ? "저장 완료" : "관심 섹터 저장"}
        </button>
      )}

      {selected.size === 0 && (
        <p className="text-xs text-[var(--color-muted)] text-center">
          관심 섹터를 선택하면 브리핑에서 해당 섹터가 우선 표시됩니다
        </p>
      )}
    </div>
  );
}
