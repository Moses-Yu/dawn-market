"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import SentimentBadge from "@/components/briefing/SentimentBadge";
import type { Sentiment } from "@/lib/pipeline/types";

interface WatchlistStock {
  name: string;
  price: string;
  change: string;
  changePercent: string;
  direction: "up" | "down" | "sideways";
  sentiment: Sentiment;
  sectorPrediction: string;
}

interface PersonalizedData {
  stocks: WatchlistStock[];
}

export default function PersonalizedBriefing() {
  const [data, setData] = useState<PersonalizedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/briefing/personalized")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((json: PersonalizedData) => setData(json))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section>
        <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
          <Star className="h-4 w-4 text-[var(--color-primary)]" />
          내 관심종목 브리핑
        </h3>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) return null;

  if (!data || data.stocks.length === 0) {
    return (
      <section>
        <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
          <Star className="h-4 w-4 text-[var(--color-primary)]" />
          내 관심종목 브리핑
        </h3>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            관심종목을 설정하면 맞춤 브리핑을 받을 수 있어요
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

  return (
    <section>
      <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
        <Star className="h-4 w-4 text-[var(--color-primary)]" />
        내 관심종목 브리핑
      </h3>
      <div className="space-y-2">
        {data.stocks.map((stock, i) => {
          const changeColor =
            stock.direction === "up"
              ? "text-[var(--color-market-up)]"
              : stock.direction === "down"
                ? "text-[var(--color-market-down)]"
                : "text-gray-400";
          const arrow =
            stock.direction === "up"
              ? "▲"
              : stock.direction === "down"
                ? "▼"
                : "→";

          return (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{stock.name}</span>
                  <SentimentBadge sentiment={stock.sentiment} />
                </div>
                <div className="text-right">
                  <div className="text-sm tabular-nums">{stock.price}</div>
                  <div
                    className={`text-xs font-medium tabular-nums ${changeColor}`}
                  >
                    {arrow} {stock.change} ({stock.changePercent})
                  </div>
                </div>
              </div>
              {stock.sectorPrediction && (
                <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                  {stock.sectorPrediction}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
