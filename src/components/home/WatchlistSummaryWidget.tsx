"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Lock, Settings } from "lucide-react";
import SentimentBadge from "@/components/briefing/SentimentBadge";
import type { Sentiment } from "@/lib/pipeline/types";

interface StockBriefing {
  symbol: string;
  name: string;
  sector: string;
  sectorTitle: string;
  dataPoints: { label: string; value: string; change?: string; sentiment?: Sentiment }[];
  prediction: {
    direction: "up" | "down" | "sideways";
    confidence: "high" | "medium" | "low";
    summary: string;
  };
}

interface PersonalizedData {
  date: string;
  stocks: StockBriefing[];
}

type WidgetState =
  | { kind: "loading" }
  | { kind: "unauthenticated" }
  | { kind: "not-pro" }
  | { kind: "empty" }
  | { kind: "data"; stocks: StockBriefing[] }
  | { kind: "error" };

const directionToSentiment: Record<string, Sentiment> = {
  up: "bullish",
  down: "bearish",
  sideways: "neutral",
};

export default function WatchlistSummaryWidget() {
  const [state, setState] = useState<WidgetState>({ kind: "loading" });

  useEffect(() => {
    fetch("/api/briefing/personalized")
      .then((res) => {
        if (res.status === 401) {
          setState({ kind: "unauthenticated" });
          return null;
        }
        if (res.status === 403) {
          setState({ kind: "not-pro" });
          return null;
        }
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((json: PersonalizedData | null) => {
        if (!json) return;
        if (json.stocks.length === 0) {
          setState({ kind: "empty" });
        } else {
          setState({ kind: "data", stocks: json.stocks });
        }
      })
      .catch(() => setState({ kind: "error" }));
  }, []);

  if (state.kind === "error") return null;

  const header = (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
        <Star className="h-4 w-4 text-[var(--color-primary)]" />
        내 관심종목
      </h3>
      <Link
        href="/settings"
        className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)]"
      >
        설정 <Settings className="h-3 w-3" />
      </Link>
    </div>
  );

  // Loading: 2 skeleton cards
  if (state.kind === "loading") {
    return (
      <section>
        {header}
        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2" style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="min-w-[140px] animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <div className="h-4 w-16 rounded bg-white/10" />
              <div className="mt-2 h-5 w-12 rounded-full bg-white/10" />
              <div className="mt-2 h-3 w-full rounded bg-white/10" />
              <div className="mt-1 h-3 w-3/4 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Not logged in: upsell banner (reuses WatchlistUpsellBanner style)
  if (state.kind === "unauthenticated") {
    return (
      <section>
        {header}
        <div className="rounded-xl border border-[var(--color-primary)]/20 bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15">
              <Star className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold">내 종목 맞춤 브리핑은 Pro에서</h4>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                관심 종목의 실시간 분석과 맞춤 인사이트
              </p>
              <Link
                href="/pricing"
                className="mt-2.5 inline-block rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary)]/90"
              >
                Pro 시작하기 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Logged in but not Pro: blurred placeholder + upgrade CTA
  if (state.kind === "not-pro") {
    return (
      <section>
        {header}
        <div className="relative">
          <div className="pointer-events-none select-none blur-sm">
            <div className="flex gap-3 overflow-hidden pb-2">
              {["삼성전자", "SK하이닉스"].map((name) => (
                <div
                  key={name}
                  className="min-w-[140px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <div className="text-sm font-bold">{name}</div>
                  <span className="mt-1 inline-flex items-center rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
                    긍정
                  </span>
                  <p className="mt-1 text-xs text-[var(--color-muted)] line-clamp-2">
                    반도체 수요 회복세 지속
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/95 px-5 py-4 text-center backdrop-blur-sm">
              <Lock className="mx-auto mb-1.5 h-5 w-5 text-[var(--color-primary)]" />
              <p className="text-sm font-semibold">Pro 전용</p>
              <Link
                href="/pricing"
                className="mt-2 inline-block rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary)]/90"
              >
                업그레이드 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Logged in + Pro but empty watchlist
  if (state.kind === "empty") {
    return (
      <section>
        {header}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            관심종목을 추가하세요
          </p>
          <Link
            href="/settings"
            className="mt-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            관심종목 설정하기 →
          </Link>
        </div>
      </section>
    );
  }

  // Data: horizontal scrolling cards
  const { stocks } = state;
  return (
    <section>
      {header}
      <div
        className="scrollbar-hide flex gap-3 overflow-x-auto pb-2"
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        {stocks.map((stock) => {
          const sentiment = directionToSentiment[stock.prediction.direction] ?? "neutral";
          return (
            <Link
              key={stock.symbol}
              href="/briefing"
              className="min-w-[140px] flex-shrink-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              <div className="text-sm font-bold">{stock.name}</div>
              <div className="mt-1">
                <SentimentBadge sentiment={sentiment} />
              </div>
              {stock.prediction.summary && (
                <p className="mt-1.5 text-xs text-[var(--color-muted)] line-clamp-2">
                  {stock.prediction.summary}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
