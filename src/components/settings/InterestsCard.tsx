"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { SECTORS } from "./SectorPreferences";
import InterestsEditModal from "./InterestsEditModal";
import type { WatchlistItem } from "@/components/watchlist/WatchlistManager";

const SECTOR_LABEL_MAP = new Map(SECTORS.map((s) => [s.id, s.label]));

const MAX_VISIBLE_STOCKS = 3;

interface InterestsCardProps {
  initialSectors: string[];
  initialWatchlist: WatchlistItem[];
}

export default function InterestsCard({
  initialSectors,
  initialWatchlist,
}: InterestsCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">나의 관심</h3>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
          >
            <Pencil className="h-3.5 w-3.5" />
            편집
          </button>
        </div>

        {/* Sector badges */}
        {initialSectors.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {initialSectors.map((sectorId) => (
              <span
                key={sectorId}
                className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs text-[var(--color-primary)]"
              >
                {SECTOR_LABEL_MAP.get(sectorId) ?? sectorId}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-muted)]">
            관심 섹터를 설정하세요
          </p>
        )}

        {/* Stock summary */}
        {initialWatchlist.length > 0 ? (
          <p className="text-xs text-[var(--color-muted)]">
            {initialWatchlist
              .slice(0, MAX_VISIBLE_STOCKS)
              .map((w) => w.name)
              .join(", ")}
            {initialWatchlist.length > MAX_VISIBLE_STOCKS &&
              ` 외 ${initialWatchlist.length - MAX_VISIBLE_STOCKS}개`}
          </p>
        ) : (
          <p className="text-xs text-[var(--color-muted)]">
            관심 종목을 설정하세요
          </p>
        )}
      </div>

      <InterestsEditModal
        open={open}
        onClose={() => setOpen(false)}
        initialSectors={initialSectors}
        initialWatchlist={initialWatchlist}
      />
    </>
  );
}
