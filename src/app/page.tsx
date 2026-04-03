export const dynamic = "force-dynamic";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getLatestBriefing } from "@/lib/pipeline/storage";
import { getLatestReportSet } from "@/lib/pipeline/reports";
import type { ReportType, MarketPrediction } from "@/lib/pipeline/reports";
import SeverityBadge from "@/components/briefing/SeverityBadge";
import PushPrompt from "@/components/push/PushPrompt";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const SECTOR_CONFIG: Record<string, { label: string; icon: string }> = {
  semiconductor: { label: "반도체", icon: "🔬" },
  "shipbuilding-defense": { label: "조선/방산", icon: "🚢" },
  "ai-infra": { label: "AI 인프라", icon: "🤖" },
  "secondary-battery": { label: "2차전지", icon: "🔋" },
};

const SECTOR_REPORT_TYPES: ReportType[] = [
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
];

function getRiskBadge(prediction: MarketPrediction): {
  label: string;
  bg: string;
  text: string;
} {
  if (prediction.direction === "down" && prediction.confidence === "high") {
    return { label: "위험", bg: "bg-red-500/15", text: "text-red-400" };
  }
  if (
    prediction.direction === "down" ||
    (prediction.direction === "sideways" && prediction.confidence === "low")
  ) {
    return { label: "주의", bg: "bg-yellow-500/15", text: "text-yellow-400" };
  }
  return { label: "안전", bg: "bg-green-500/15", text: "text-green-400" };
}

export default async function Home() {
  let briefing;
  try {
    briefing = await getLatestBriefing();
  } catch {
    briefing = null;
  }

  let reportSet;
  try {
    reportSet = await getLatestReportSet();
  } catch {
    reportSet = null;
  }

  // Extract dawn-briefing headline from report set
  const dawnBriefing = reportSet?.reports.find(
    (r) => r.reportType === "dawn-briefing"
  );

  // Extract sector reports for risk badges
  const sectorReports = reportSet
    ? SECTOR_REPORT_TYPES.map((type) => {
        const report = reportSet.reports.find((r) => r.reportType === type);
        if (!report) return null;
        const config = SECTOR_CONFIG[type];
        if (!config) return null;
        return { type, report, config };
      }).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Date header + generation time */}
      <section>
        <h2 className="text-xl font-bold">
          {briefing
            ? `${formatDate(briefing.date)} 브리핑`
            : "오늘의 시장 브리핑"}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {reportSet
            ? `${formatTime(reportSet.generatedAt)} 생성 · 해외 시장 뉴스와 AI 인사이트`
            : "해외 시장 뉴스와 AI 인사이트를 매일 새벽에 전달합니다."}
        </p>
      </section>

      {briefing ? (
        <>
          {/* 2. Major indices 2x2 grid */}
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
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                    >
                      <div className="text-xs text-[var(--color-muted)]">
                        {idx.symbol}
                      </div>
                      <div className="text-sm font-semibold">{idx.name}</div>
                      <div
                        className={`mt-1 text-xs font-medium ${isPositive ? "text-[var(--color-market-up)]" : "text-[var(--color-market-down)]"}`}
                      >
                        {isPositive ? "▲" : "▼"}{" "}
                        {Math.abs(idx.changePercent).toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. Dawn Briefing headline insight card */}
          {dawnBriefing && (
            <Link
              href="/briefing/reports"
              className="block rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4 transition-colors hover:bg-[var(--color-primary)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="text-xs font-medium text-[var(--color-primary)]">
                  Dawn Briefing
                </span>
                <span className="ml-auto text-xs text-[var(--color-primary)]">
                  자세히 보기 →
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {dawnBriefing.content.headline}
              </p>
            </Link>
          )}

          {/* 4. Top 3 news stories */}
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
                    className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
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

          {/* 5. Sector risk summary badges */}
          {sectorReports.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
                  섹터 리스크
                </h3>
                <Link
                  href="/sectors"
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  섹터 상세 →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sectorReports.map((item) => {
                  if (!item) return null;
                  const { type, report, config } = item;
                  const risk = getRiskBadge(report.content.prediction);
                  return (
                    <Link
                      key={type}
                      href="/sectors"
                      className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="text-lg">{config.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">
                          {config.label}
                        </div>
                        <span
                          className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${risk.bg} ${risk.text}`}
                        >
                          {risk.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-3 text-3xl">🌅</div>
            <p className="text-sm text-[var(--color-muted)]">
              브리핑 준비 중...
              <br />
              AI가 해외 시장 뉴스를 분석하고 있습니다.
            </p>
          </div>
        </section>
      )}

      {/* 6. Push notification prompt — bottom of page */}
      <PushPrompt />
    </div>
  );
}
