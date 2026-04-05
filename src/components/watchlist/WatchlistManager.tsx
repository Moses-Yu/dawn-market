"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Plus, Star } from "lucide-react";
import {
  SEMICONDUCTOR_SYMBOLS,
  SHIPBUILDING_DEFENSE_SYMBOLS,
  AI_INFRA_SYMBOLS,
  SECONDARY_BATTERY_SYMBOLS,
  BIO_HEALTHCARE_SYMBOLS,
  FINANCE_SYMBOLS,
  US_MARKET_SYMBOLS,
  CURRENCY_SYMBOLS,
  ASIAN_SYMBOLS,
  COMMODITY_SYMBOLS,
} from "@/lib/pipeline/reports/types";
export interface WatchlistItem {
  symbol: string;
  name: string;
  sector: string;
}

const MAX_WATCHLIST = 20;

interface SectorGroup {
  id: string;
  label: string;
  symbols: { symbol: string; name: string }[];
}

const SECTOR_GROUPS: SectorGroup[] = [
  { id: "semiconductor", label: "반도체", symbols: SEMICONDUCTOR_SYMBOLS },
  {
    id: "shipbuilding-defense",
    label: "조선/방산",
    symbols: SHIPBUILDING_DEFENSE_SYMBOLS,
  },
  { id: "ai-infra", label: "AI 인프라", symbols: AI_INFRA_SYMBOLS },
  {
    id: "secondary-battery",
    label: "2차전지",
    symbols: SECONDARY_BATTERY_SYMBOLS,
  },
  {
    id: "bio-healthcare",
    label: "바이오/헬스케어",
    symbols: BIO_HEALTHCARE_SYMBOLS,
  },
  { id: "finance", label: "금융/은행", symbols: FINANCE_SYMBOLS },
  { id: "us-market", label: "미국/글로벌 지수", symbols: US_MARKET_SYMBOLS },
  { id: "currency", label: "환율/채권", symbols: CURRENCY_SYMBOLS },
  { id: "asian-premarket", label: "아시아 지수", symbols: ASIAN_SYMBOLS },
  { id: "commodity", label: "원자재", symbols: COMMODITY_SYMBOLS },
];

// Build a symbol→sector lookup (first match wins for deduped symbols)
const SYMBOL_SECTOR_MAP = new Map<string, string>();
for (const group of SECTOR_GROUPS) {
  for (const s of group.symbols) {
    if (!SYMBOL_SECTOR_MAP.has(s.symbol)) {
      SYMBOL_SECTOR_MAP.set(s.symbol, group.id);
    }
  }
}

export default function WatchlistManager({
  initialWatchlist,
}: {
  initialWatchlist: WatchlistItem[];
}) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const watchlistSymbols = new Set(watchlist.map((w) => w.symbol));

  const saveWatchlist = useCallback(async (items: WatchlistItem[]) => {
    setSaving(true);
    try {
      await fetch("/api/watchlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stocks: items }),
      });
    } catch {
      // silent fail — optimistic update stays
    } finally {
      setSaving(false);
    }
  }, []);

  function addSymbol(symbol: string, name: string) {
    if (watchlistSymbols.has(symbol) || watchlist.length >= MAX_WATCHLIST)
      return;
    const sector = SYMBOL_SECTOR_MAP.get(symbol) ?? "other";
    const next = [...watchlist, { symbol, name, sector }];
    setWatchlist(next);
    saveWatchlist(next);
  }

  function removeSymbol(symbol: string) {
    const next = watchlist.filter((w) => w.symbol !== symbol);
    setWatchlist(next);
    saveWatchlist(next);
  }

  // Filter sector groups by search term
  const filteredGroups = SECTOR_GROUPS.map((group) => ({
    ...group,
    symbols: group.symbols.filter(
      (s) =>
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.symbol.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((g) => g.symbols.length > 0);

  useEffect(() => {
    if (showPicker && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showPicker]);

  return (
    <div className="space-y-3">
      {/* Count badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-muted)]">
          {watchlist.length}/{MAX_WATCHLIST} 종목
        </span>
        {saving && (
          <span className="text-[10px] text-[var(--color-muted)]">
            저장 중...
          </span>
        )}
      </div>

      {/* Selected watchlist */}
      {watchlist.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          <Star className="mx-auto mb-2 h-6 w-6 text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted)]">
            관심 종목을 추가하세요
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {watchlist.map((item) => (
            <button
              key={item.symbol}
              type="button"
              onClick={() => removeSymbol(item.symbol)}
              className="group flex items-center gap-1 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2.5 py-1.5 text-xs transition-colors hover:border-red-400/50 hover:bg-red-400/10"
            >
              <span>{item.name}</span>
              <X className="h-3 w-3 text-[var(--color-muted)] group-hover:text-red-400" />
            </button>
          ))}
        </div>
      )}

      {/* Add button / Picker toggle */}
      {!showPicker ? (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          disabled={watchlist.length >= MAX_WATCHLIST}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/5 py-2.5 text-sm text-[var(--color-muted)] transition-colors hover:border-white/30 hover:bg-white/10 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          종목 추가
        </button>
      ) : (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="종목명 또는 심볼 검색"
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm text-white placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)]/50 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5 text-[var(--color-muted)]" />
              </button>
            )}
          </div>

          {/* Symbol groups */}
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {filteredGroups.map((group) => (
              <div key={group.id}>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {group.symbols.map((s) => {
                    const inList = watchlistSymbols.has(s.symbol);
                    return (
                      <button
                        key={s.symbol}
                        type="button"
                        onClick={() => !inList && addSymbol(s.symbol, s.name)}
                        disabled={
                          inList || watchlist.length >= MAX_WATCHLIST
                        }
                        className={`rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                          inList
                            ? "border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : "border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40"
                        }`}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-1 text-[var(--color-muted)]">
                          {s.symbol.replace(".KS", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <p className="py-4 text-center text-xs text-[var(--color-muted)]">
                검색 결과가 없습니다
              </p>
            )}
          </div>

          {/* Close picker */}
          <button
            type="button"
            onClick={() => {
              setShowPicker(false);
              setSearch("");
            }}
            className="w-full rounded-lg bg-white/5 py-1.5 text-xs text-[var(--color-muted)] hover:bg-white/10"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
