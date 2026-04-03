import Link from "next/link";
import { BookOpen, Loader } from "lucide-react";
import { getLatestBriefing } from "@/lib/pipeline/storage";
import SeverityBadge from "@/components/briefing/SeverityBadge";
import PushPrompt from "@/components/push/PushPrompt";
import EmptyState from "@/components/EmptyState";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

export default async function Home() {
  let briefing;
  try {
    briefing = await getLatestBriefing();
  } catch {
    briefing = null;
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-xl font-bold">오늘의 시장 브리핑</h2>
        <p className="text-sm text-[var(--color-muted)]">
          해외 시장 뉴스와 AI 인사이트를 매일 새벽에 전달합니다.
        </p>
      </section>

      {/* Glossary link */}
      <Link
        href="/glossary"
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/15">
          <BookOpen className="h-5 w-5 text-[var(--color-primary)]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold">용어 사전</p>
          <p className="text-xs text-[var(--color-muted)]">
            초보 투자자를 위한 핵심 용어 모음
          </p>
        </div>
        <span className="ml-auto shrink-0 text-xs text-[var(--color-primary)]">
          보기 →
        </span>
      </Link>

      {briefing ? (
        <>
          {/* Market overview card */}
          <Link
            href={`/briefing?date=${briefing.date}`}
            className="block rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-[var(--color-muted)]">
                {formatDate(briefing.date)} 브리핑
              </span>
              <span className="text-xs text-[var(--color-primary)]">
                자세히 보기 →
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              {briefing.marketOverview.summary}
            </p>
          </Link>

          {/* Top stories preview (first 3) */}
          {briefing.topStories.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
                <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
                주요 뉴스
              </h3>
              <div className="space-y-2">
                {briefing.topStories.slice(0, 3).map((story, i) => (
                  <Link
                    key={i}
                    href={`/briefing?date=${briefing.date}`}
                    className="block rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                  >
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <SeverityBadge severity={story.severity} />
                    </div>
                    <div className="text-sm font-semibold leading-normal">
                      {story.title}
                    </div>
                  </Link>
                ))}
              </div>
              {briefing.topStories.length > 3 && (
                <Link
                  href={`/briefing?date=${briefing.date}`}
                  className="mt-2 block text-center text-xs text-[var(--color-primary)] hover:underline"
                >
                  +{briefing.topStories.length - 3}건 더 보기
                </Link>
              )}
            </section>
          )}

          {/* Market indices */}
          {briefing.marketOverview.keyIndices.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
                <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
                주요 지수
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {briefing.marketOverview.keyIndices.map((idx) => {
                  const isPositive = idx.change >= 0;
                  return (
                    <div
                      key={idx.symbol}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="text-xs text-[var(--color-muted)]">
                        {idx.symbol}
                      </div>
                      <div className="text-sm font-semibold">{idx.name}</div>
                      <div
                        className={`mt-1 text-xs font-medium ${isPositive ? "text-[var(--color-market-up)]" : "text-[var(--color-market-down)]"}`}
                      >
                        {isPositive ? "▲" : "▼"} {Math.abs(idx.changePercent).toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <EmptyState
            icon={Loader}
            title="브리핑 준비 중..."
            description="AI가 해외 시장 뉴스를 분석하고 있습니다."
          />
        </section>
      )}

      {/* Push notification prompt — bottom of page */}
      <PushPrompt />
    </div>
  );
}
