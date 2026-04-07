export const dynamic = "force-dynamic";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getLatestReportSet } from "@/lib/pipeline/reports";
import { getUserSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import type { ReportType, MarketPrediction, DataPoint } from "@/lib/pipeline/reports";
import HomeCTA from "@/components/home/HomeCTA";
import UrgentAlertBanner from "@/components/home/UrgentAlertBanner";
import WatchlistSummaryWidget from "@/components/home/WatchlistSummaryWidget";
import LandingHero from "@/components/home/LandingHero";
import LandingSocialProof from "@/components/home/LandingSocialProof";
import LandingFeatures from "@/components/home/LandingFeatures";
import LandingPricingTeaser from "@/components/home/LandingPricingTeaser";
import type { Alert } from "@/lib/pipeline/alert-engine";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const SECTOR_CONFIG: Record<string, { label: string; icon: string }> = {
  semiconductor: { label: "반도체", icon: "🔬" },
  "shipbuilding-defense": { label: "조선/방산", icon: "🚢" },
  "ai-infra": { label: "AI 인프라", icon: "🤖" },
  "secondary-battery": { label: "2차전지", icon: "🔋" },
  "bio-healthcare": { label: "바이오/헬스케어", icon: "🧬" },
  finance: { label: "금융/은행", icon: "🏦" },
};

const SECTOR_REPORT_TYPES: ReportType[] = [
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
  "bio-healthcare",
  "finance",
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

/** Extract market index data points from the us-market report */
function extractMarketIndices(dataPoints: DataPoint[]) {
  return dataPoints.slice(0, 4).map((dp) => {
    const changeStr = dp.change || "";
    const changeNum = parseFloat(changeStr.replace(/[^-\d.]/g, "")) || 0;
    const isPositive = !changeStr.startsWith("-") && !changeStr.startsWith("▼");
    return {
      name: dp.label,
      value: dp.value,
      change: changeStr,
      isPositive,
      changeNum,
    };
  });
}

async function getUrgentAlerts(): Promise<Alert[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/alerts?limit=30`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const alerts: Alert[] = await res.json();
    const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;
    return alerts.filter(
      (a) =>
        a.severity === "긴급" &&
        a.createdAt &&
        new Date(a.createdAt).getTime() > eightHoursAgo
    );
  } catch {
    return [];
  }
}

export default async function Home() {
  let reportSet;
  try {
    reportSet = await getLatestReportSet();
  } catch {
    reportSet = null;
  }

  const { isPro } = await getUserSubscription();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Fetch urgent alerts (last 8 hours, severity === "긴급")
  const urgentAlerts = await getUrgentAlerts();

  // Extract dawn-briefing headline from report set
  const dawnBriefing = reportSet?.reports.find(
    (r) => r.reportType === "dawn-briefing"
  );

  // Extract us-market report for market indices
  const usMarketReport = reportSet?.reports.find(
    (r) => r.reportType === "us-market"
  );
  const marketIndices = usMarketReport
    ? extractMarketIndices(
        usMarketReport.content.sections.flatMap((s) => s.dataPoints ?? [])
      )
    : [];

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

  // Use dawn-briefing keyTakeaways as top highlights
  const highlights = dawnBriefing?.content.keyTakeaways ?? [];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://dawn-market.vercel.app";
  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "새벽시장 Dawn Market",
    url: siteUrl,
    description:
      "한국 초보 투자자를 위한 해외 시장 브리핑 & AI 인사이트. 매일 새벽, 밤사이 해외 시장 뉴스를 한눈에.",
    inLanguage: "ko",
    publisher: {
      "@type": "Organization",
      name: "새벽시장 Dawn Market",
      url: siteUrl,
    },
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      {/* 0. Landing hero for non-logged-in users, welcome banner for logged-in */}
      {!isLoggedIn ? (
        <LandingHero
          briefingHeadline={dawnBriefing?.content.headline}
          briefingDate={reportSet ? formatDate(reportSet.date) : undefined}
        />
      ) : null}

      {/* 1. Date header + generation time */}
      <section>
        <h2 className="text-xl font-bold">
          {reportSet
            ? `${formatDate(reportSet.date)} 브리핑`
            : "오늘의 시장 브리핑"}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {reportSet
            ? `${formatTime(reportSet.generatedAt)} 생성 · 해외 시장 뉴스와 AI 인사이트`
            : "해외 시장 뉴스와 AI 인사이트를 매일 새벽에 전달합니다."}
        </p>
      </section>

      {/* Urgent alert banner (conditional) */}
      <UrgentAlertBanner alerts={urgentAlerts} />

      {reportSet ? (
        <>
          {/* 2. Major indices 2x2 grid */}
          {marketIndices.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
                <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
                주요 지수
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {marketIndices.map((idx) => (
                  <Link
                    key={idx.name}
                    href="/briefing/reports"
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-surface-hover)]"
                  >
                    <div className="text-sm font-semibold">{idx.name}</div>
                    <div className="mt-1 text-sm tabular-nums">{idx.value}</div>
                    <div
                      className={`mt-1 text-xs font-medium ${idx.isPositive ? "text-[var(--color-market-up)]" : "text-[var(--color-market-down)]"}`}
                    >
                      {idx.change}
                    </div>
                  </Link>
                ))}
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

          {/* 4. Key takeaways from dawn-briefing */}
          {highlights.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
                <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
                주요 뉴스
              </h3>
              <div className="space-y-2">
                {highlights.slice(0, 3).map((item, i) => (
                  <Link
                    key={i}
                    href="/briefing/reports"
                    className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                  >
                    <div className="text-sm font-semibold leading-normal">
                      {item}
                    </div>
                  </Link>
                ))}
              </div>
              {highlights.length > 3 && (
                <Link
                  href="/briefing/reports"
                  className="mt-2 block text-center text-xs text-[var(--color-primary)] hover:underline"
                >
                  +{highlights.length - 3}건 더 보기
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
                      href={`/sectors/${type}`}
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

      {/* 6. Watchlist summary widget */}
      <WatchlistSummaryWidget />

      {/* 7. Single CTA — push or upgrade, never both */}
      <HomeCTA isPro={isPro} />

      {/* 8. Landing-only sections for non-logged-in users */}
      {!isLoggedIn && (
        <>
          <LandingSocialProof />
          <LandingFeatures />
          <LandingPricingTeaser />
        </>
      )}
    </div>
  );
}
