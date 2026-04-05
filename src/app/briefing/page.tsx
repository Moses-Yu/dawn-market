export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import {
  getLatestReportSet,
  getReportsByDate,
} from "@/lib/pipeline/reports";
import type {
  ReportSet,
  Report,
  ReportSection,
  DataPoint,
  MarketPrediction,
} from "@/lib/pipeline/reports";
import SentimentBadge from "@/components/briefing/SentimentBadge";
import ShareButton from "@/components/briefing/ShareButton";
import PaywallGate from "@/components/PaywallGate";
import PersonalizedBriefing from "@/components/briefing/PersonalizedBriefing";
import WatchlistUpsellBanner from "@/components/briefing/WatchlistUpsellBanner";
import PageTransition from "@/components/PageTransition";
import { StaggerContainer, StaggerItem } from "@/components/StaggerList";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getReportSet(
  date?: string
): Promise<ReportSet | null> {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const reports = await getReportsByDate(date);
    if (reports.length === 0) return null;
    return {
      date,
      dataWindowStart: reports[0].dataWindowStart,
      dataWindowEnd: reports[0].dataWindowEnd,
      reports,
      generatedAt: reports[reports.length - 1].generatedAt,
    };
  }
  return getLatestReportSet();
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { date } = await searchParams;
  const reportSet = await getReportSet(
    typeof date === "string" ? date : undefined
  );

  if (!reportSet) {
    return { title: "시장 브리핑" };
  }

  const dawnBriefing = reportSet.reports.find(
    (r) => r.reportType === "dawn-briefing"
  );
  const d = new Date(reportSet.date + "T00:00:00");
  const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  const summary =
    dawnBriefing?.content.headline?.slice(0, 120) ||
    "오늘의 해외 시장 브리핑을 확인하세요";

  return {
    title: `${dateLabel} 시장 브리핑`,
    description: summary,
    alternates: { canonical: "/briefing" },
    openGraph: {
      title: `${dateLabel} 새벽시장 브리핑`,
      description: summary,
      type: "article",
      publishedTime: reportSet.generatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: `${dateLabel} 새벽시장 브리핑`,
      description: summary,
    },
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

function DataPointRow({ dp }: { dp: DataPoint }) {
  const sentimentColor =
    dp.sentiment === "bullish"
      ? "text-[var(--color-market-up)]"
      : dp.sentiment === "bearish"
        ? "text-[var(--color-market-down)]"
        : "text-gray-400";

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--color-muted)]">{dp.label}</span>
      <div className="flex items-center gap-2">
        <span>{dp.value}</span>
        {dp.change && <span className={sentimentColor}>{dp.change}</span>}
      </div>
    </div>
  );
}

function MarketDataSection({ dataPoints }: { dataPoints: DataPoint[] }) {
  if (dataPoints.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {dataPoints.slice(0, 6).map((dp, i) => {
        const sentimentColor =
          dp.sentiment === "bullish"
            ? "text-[var(--color-market-up)]"
            : dp.sentiment === "bearish"
              ? "text-[var(--color-market-down)]"
              : "text-gray-400";
        return (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div className="text-sm font-semibold">{dp.label}</div>
            <div className="mt-1 text-sm tabular-nums">{dp.value}</div>
            {dp.change && (
              <div className={`mt-0.5 text-xs font-medium ${sentimentColor}`}>
                {dp.change}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReportSectionCard({ section }: { section: ReportSection }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h4 className="mb-2 text-sm font-semibold">{section.title}</h4>
      <p className="text-sm leading-relaxed text-[var(--color-muted)] whitespace-pre-line">
        {section.body}
      </p>
      {section.dataPoints && section.dataPoints.length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-lg bg-white/5 p-2.5">
          {section.dataPoints.map((dp, i) => (
            <DataPointRow key={i} dp={dp} />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: MarketPrediction }) {
  const dirConfig = {
    up: { arrow: "▲", color: "text-[var(--color-market-up)]", label: "상승" },
    down: {
      arrow: "▼",
      color: "text-[var(--color-market-down)]",
      label: "하락",
    },
    sideways: { arrow: "→", color: "text-gray-400", label: "보합" },
  };
  const c = dirConfig[prediction.direction];
  const confLabel =
    prediction.confidence === "high"
      ? "높음"
      : prediction.confidence === "medium"
        ? "중간"
        : "낮음";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-lg font-bold ${c.color}`}>
          {c.arrow} {c.label}
        </span>
        <span className="text-xs text-[var(--color-muted)]">
          확신도: {confLabel}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-[var(--color-muted)]">
        {prediction.summary}
      </p>
      {prediction.factors.length > 0 && (
        <ul className="mt-2 space-y-1">
          {prediction.factors.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-[var(--color-muted)]"
            >
              <span className="mt-0.5 text-[var(--color-primary)]">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-4xl">🌅</div>
      <h2 className="mb-2 text-lg font-bold">아직 브리핑이 없습니다</h2>
      <p className="text-sm text-[var(--color-muted)]">
        AI가 해외 시장 뉴스를 분석 중입니다.
        <br />
        첫 브리핑이 곧 준비될 예정입니다.
      </p>
    </div>
  );
}

function BriefingJsonLd({
  reportSet,
  headline,
}: {
  reportSet: ReportSet;
  headline: string;
}) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://dawn-market.vercel.app";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: `${reportSet.date} 새벽시장 브리핑`,
    description: headline.slice(0, 200),
    datePublished: reportSet.generatedAt,
    dateModified: reportSet.generatedAt,
    author: {
      "@type": "Organization",
      name: "새벽시장 Dawn Market",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "새벽시장 Dawn Market",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icons/icon-512x512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/briefing?date=${reportSet.date}`,
    },
    image: `${siteUrl}/briefing/opengraph-image?date=${reportSet.date}`,
    inLanguage: "ko",
    articleSection: "Market Briefing",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function BriefingContent({ reportSet }: { reportSet: ReportSet }) {
  const dawnBriefing = reportSet.reports.find(
    (r) => r.reportType === "dawn-briefing"
  );
  const usMarketReport = reportSet.reports.find(
    (r) => r.reportType === "us-market"
  );

  // Use dawn-briefing as primary, fall back to us-market
  const primaryReport = dawnBriefing || usMarketReport;
  if (!primaryReport) return <EmptyState />;

  const headline = primaryReport.content.headline;
  const sections = primaryReport.content.sections;
  const prediction = primaryReport.content.prediction;
  const keyTakeaways = primaryReport.content.keyTakeaways;

  // Get market data from us-market report
  const marketDataPoints = usMarketReport
    ? usMarketReport.content.sections.flatMap((s) => s.dataPoints ?? [])
    : [];

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <BriefingJsonLd reportSet={reportSet} headline={headline} />

        {/* Header */}
        <StaggerItem>
          <div className="mb-6">
            <p className="text-xs text-[var(--color-muted)]">
              {new Date(reportSet.date + "T00:00:00").toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </p>
            <h1 className="mt-0.5 text-2xl font-bold">오늘의 시장 브리핑</h1>
            <div className="mt-1 text-xs text-[var(--color-muted)]">
              생성:{" "}
              {new Date(reportSet.generatedAt).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </StaggerItem>

        {/* Share */}
        <StaggerItem>
          <ShareButton date={reportSet.date} />
        </StaggerItem>

        {/* Headline */}
        <StaggerItem>
          <section>
            <p className="mb-4 text-sm font-medium leading-relaxed">
              {headline}
            </p>
          </section>
        </StaggerItem>

        {/* Market Overview (from us-market report) */}
        {marketDataPoints.length > 0 && (
          <StaggerItem>
            <section>
              <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
                <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
                시장 개요
              </h3>
              <MarketDataSection dataPoints={marketDataPoints} />
            </section>
          </StaggerItem>
        )}

        {/* Sections */}
        {sections.length > 0 && (
          <StaggerItem>
            <section>
              <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
                <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
                상세 분석
              </h3>
              <div className="space-y-3">
                {sections.map((s, i) => (
                  <ReportSectionCard key={i} section={s} />
                ))}
              </div>
            </section>
          </StaggerItem>
        )}

        {/* Prediction */}
        {prediction && (
          <StaggerItem>
            <section>
              <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
                <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
                시장 전망
              </h3>
              <PredictionCard prediction={prediction} />
            </section>
          </StaggerItem>
        )}

        {/* Key Takeaways */}
        {keyTakeaways.length > 0 && (
          <StaggerItem>
            <section>
              <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
                <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
                오늘의 체크포인트
              </h3>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <ul className="space-y-2">
                  {keyTakeaways.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm leading-relaxed"
                    >
                      <span className="mt-0.5 text-[var(--color-primary)]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </StaggerItem>
        )}

        {/* Personalized Watchlist Briefing (Pro) / Upsell Banner (Free) */}
        <StaggerItem>
          <PaywallGate fallback={<WatchlistUpsellBanner />}>
            <PersonalizedBriefing />
          </PaywallGate>
        </StaggerItem>

        {/* Disclaimer */}
        <StaggerItem>
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-[var(--color-muted)]">
            본 브리핑은 AI가 자동 생성한 정보로, 투자 조언이 아닙니다. 투자
            결정은 본인의 판단과 책임 하에 이루어져야 합니다.
          </div>
        </StaggerItem>

        {/* Links */}
        <StaggerItem>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/briefing/reports"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              AI 심층 리포트
            </Link>
            <span className="text-white/20">|</span>
            <Link
              href="/briefing/archive"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              지난 브리핑 보기
            </Link>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}

export default async function BriefingPage({ searchParams }: Props) {
  const { date } = await searchParams;

  let reportSet: ReportSet | null = null;
  try {
    reportSet = await getReportSet(
      typeof date === "string" ? date : undefined
    );
  } catch {
    reportSet = null;
  }

  if (!reportSet || reportSet.reports.length === 0) {
    return <PageTransition><EmptyState /></PageTransition>;
  }

  return <BriefingContent reportSet={reportSet} />;
}
