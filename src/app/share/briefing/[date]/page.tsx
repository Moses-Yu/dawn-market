export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { getReportsByDate } from "@/lib/pipeline/reports";
import type {
  ReportSet,
  ReportSection,
  DataPoint,
  MarketPrediction,
} from "@/lib/pipeline/reports";
import SentimentBadge from "@/components/briefing/SentimentBadge";

type Props = {
  params: Promise<{ date: string }>;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://dawn-market.vercel.app";

async function getReportSet(date: string): Promise<ReportSet | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  const reportSet = await getReportSet(date);

  if (!reportSet) {
    return { title: "시장 브리핑 | 새벽시장" };
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
    openGraph: {
      title: `${dateLabel} 새벽시장 브리핑`,
      description: summary,
      type: "article",
      publishedTime: reportSet.generatedAt,
      images: [
        {
          url: `${SITE_URL}/share/briefing/${date}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${dateLabel} 새벽시장 브리핑`,
        },
      ],
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
    </div>
  );
}

function SignupCTA() {
  return (
    <div className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-6 text-center">
      <div className="mb-2 text-2xl">🌅</div>
      <h3 className="mb-2 text-lg font-bold">
        매일 새벽, AI 시장 브리핑을 받아보세요
      </h3>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        반도체·방산·AI·2차전지 등 12개 섹터 심층 리포트와
        <br />
        개인 맞춤 관심종목 브리핑까지.
      </p>
      <Link
        href="/auth/signup"
        className="inline-block rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
      >
        무료로 시작하기
      </Link>
      <p className="mt-2 text-xs text-[var(--color-muted)]">
        가입 후 매일 아침 브리핑을 받아보세요
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-4xl">🌅</div>
      <h2 className="mb-2 text-lg font-bold">브리핑을 찾을 수 없습니다</h2>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        해당 날짜의 브리핑이 존재하지 않습니다.
      </p>
      <SignupCTA />
    </div>
  );
}

export default async function SharedBriefingPage({ params }: Props) {
  const { date } = await params;
  const reportSet = await getReportSet(date);

  if (!reportSet || reportSet.reports.length === 0) {
    return <EmptyState />;
  }

  const dawnBriefing = reportSet.reports.find(
    (r) => r.reportType === "dawn-briefing"
  );
  const usMarketReport = reportSet.reports.find(
    (r) => r.reportType === "us-market"
  );
  const primaryReport = dawnBriefing || usMarketReport;

  if (!primaryReport) return <EmptyState />;

  const headline = primaryReport.content.headline;
  const sections = primaryReport.content.sections;
  const prediction = primaryReport.content.prediction;
  const keyTakeaways = primaryReport.content.keyTakeaways;

  const marketDataPoints = usMarketReport
    ? usMarketReport.content.sections.flatMap((s) => s.dataPoints ?? [])
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-[var(--color-primary)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
            공유된 브리핑
          </span>
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          {formatDate(reportSet.date)}
        </p>
        <h1 className="mt-0.5 text-2xl font-bold">오늘의 시장 브리핑</h1>
        <div className="mt-1 text-xs text-[var(--color-muted)]">
          생성:{" "}
          {new Date(reportSet.generatedAt).toLocaleTimeString("ko-KR", {
            timeZone: "Asia/Seoul",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Headline */}
      <section>
        <p className="mb-4 text-sm font-medium leading-relaxed">{headline}</p>
      </section>

      {/* Market Overview */}
      {marketDataPoints.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
            <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
            시장 개요
          </h3>
          <MarketDataSection dataPoints={marketDataPoints} />
        </section>
      )}

      {/* Sections — show first 2 to tease, then blur rest */}
      {sections.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
            <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
            상세 분석
          </h3>
          <div className="space-y-3">
            {sections.slice(0, 2).map((s, i) => (
              <ReportSectionCard key={i} section={s} />
            ))}
            {sections.length > 2 && (
              <div className="relative">
                <div className="pointer-events-none select-none blur-sm opacity-50">
                  <ReportSectionCard section={sections[2]} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Link
                    href="/auth/signup"
                    className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-black shadow-lg transition-opacity hover:opacity-90"
                  >
                    가입하고 전체 분석 보기
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Prediction */}
      {prediction && (
        <section>
          <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
            <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
            시장 전망
          </h3>
          <PredictionCard prediction={prediction} />
        </section>
      )}

      {/* Key Takeaways — show first 3 */}
      {keyTakeaways.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 mb-3 text-base font-semibold">
            <span className="h-3.5 w-0.5 rounded-full bg-[var(--color-primary)]" />
            오늘의 체크포인트
          </h3>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <ul className="space-y-2">
              {keyTakeaways.slice(0, 3).map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm leading-relaxed"
                >
                  <span className="mt-0.5 text-[var(--color-primary)]">•</span>
                  <span>{item}</span>
                </li>
              ))}
              {keyTakeaways.length > 3 && (
                <li className="text-xs text-[var(--color-muted)]">
                  +{keyTakeaways.length - 3}개 더...{" "}
                  <Link
                    href="/auth/signup"
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    가입하고 전체 보기
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </section>
      )}

      {/* Signup CTA */}
      <SignupCTA />

      {/* Disclaimer */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-[var(--color-muted)]">
        본 브리핑은 AI가 자동 생성한 정보로, 투자 조언이 아닙니다. 투자
        결정은 본인의 판단과 책임 하에 이루어져야 합니다.
      </div>
    </div>
  );
}
