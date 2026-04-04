export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart3, Newspaper, Activity } from "lucide-react";
import { getLatestReportSet } from "@/lib/pipeline/reports";
import type { ReportType, MarketPrediction, DataPoint, ReportSection } from "@/lib/pipeline/reports";
import PaywallGate from "@/components/PaywallGate";

const SECTOR_CONFIG: Record<
  string,
  {
    label: string;
    icon: string;
    reportType: ReportType;
    companies: string[];
    color: string;
    description: string;
  }
> = {
  semiconductor: {
    label: "반도체",
    icon: "🔬",
    reportType: "semiconductor",
    companies: ["삼성전자", "SK하이닉스", "NVIDIA", "TSMC", "ASML", "AMD", "Intel", "Applied Materials"],
    color: "blue",
    description: "글로벌 반도체 공급망, HBM·AI 칩 수요, 주요 팹리스·파운드리 동향",
  },
  "shipbuilding-defense": {
    label: "조선/방산",
    icon: "🚢",
    reportType: "shipbuilding-defense",
    companies: ["HD현대중공업", "HD한국조선해양", "한화오션", "한화에어로스페이스", "Lockheed Martin", "RTX", "Northrop Grumman"],
    color: "teal",
    description: "글로벌 방위산업 수주, 조선 발주, 지정학 리스크에 따른 방산 수혜 분석",
  },
  "ai-infra": {
    label: "AI 인프라",
    icon: "🤖",
    reportType: "ai-infra",
    companies: ["NVIDIA", "Microsoft", "Alphabet", "Amazon", "Broadcom", "Marvell", "NAVER", "카카오"],
    color: "cyan",
    description: "AI 데이터센터, 클라우드 인프라 투자, LLM·GPU 수요 및 빅테크 AI 전략",
  },
  "secondary-battery": {
    label: "2차전지",
    icon: "🔋",
    reportType: "secondary-battery",
    companies: ["LG에너지솔루션", "삼성SDI", "SK이노베이션", "에코프로비엠", "에코프로", "Tesla", "Albemarle"],
    color: "green",
    description: "EV 배터리 수요, 리튬·니켈 원자재 가격, 미국 IRA·유럽 배터리 규제 동향",
  },
};

const VALID_SECTORS = Object.keys(SECTOR_CONFIG);

function getRiskLevel(prediction: MarketPrediction) {
  if (prediction.direction === "down" && prediction.confidence === "high") {
    return { emoji: "🔴", label: "위험", bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" };
  }
  if (prediction.direction === "down" || (prediction.direction === "sideways" && prediction.confidence === "low")) {
    return { emoji: "🟡", label: "주의", bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" };
  }
  return { emoji: "🟢", label: "안전", bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/30" };
}

function DirectionIcon({ direction }: { direction: MarketPrediction["direction"] }) {
  if (direction === "up") return <TrendingUp className="h-4 w-4 text-[var(--color-market-up)]" />;
  if (direction === "down") return <TrendingDown className="h-4 w-4 text-[var(--color-market-down)]" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function SentimentBar({ dataPoints }: { dataPoints: DataPoint[] }) {
  const counts = { bullish: 0, bearish: 0, neutral: 0 };
  for (const dp of dataPoints) {
    if (dp.sentiment) counts[dp.sentiment]++;
  }
  const total = counts.bullish + counts.bearish + counts.neutral;
  if (total === 0) return null;

  const bullishPct = Math.round((counts.bullish / total) * 100);
  const bearishPct = Math.round((counts.bearish / total) * 100);
  const neutralPct = 100 - bullishPct - bearishPct;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-muted)]">감성 분석</span>
        <div className="flex items-center gap-3">
          <span className="text-[var(--color-market-up)]">강세 {bullishPct}%</span>
          <span className="text-gray-400">중립 {neutralPct}%</span>
          <span className="text-[var(--color-market-down)]">약세 {bearishPct}%</span>
        </div>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full">
        {bullishPct > 0 && (
          <div className="bg-[var(--color-market-up)]" style={{ width: `${bullishPct}%` }} />
        )}
        {neutralPct > 0 && (
          <div className="bg-gray-500" style={{ width: `${neutralPct}%` }} />
        )}
        {bearishPct > 0 && (
          <div className="bg-[var(--color-market-down)]" style={{ width: `${bearishPct}%` }} />
        )}
      </div>
    </div>
  );
}

function DataPointCard({ dp }: { dp: DataPoint }) {
  const sentimentColor =
    dp.sentiment === "bullish"
      ? "text-[var(--color-market-up)]"
      : dp.sentiment === "bearish"
        ? "text-[var(--color-market-down)]"
        : "text-gray-400";

  const sentimentBg =
    dp.sentiment === "bullish"
      ? "bg-red-500/8"
      : dp.sentiment === "bearish"
        ? "bg-blue-500/8"
        : "bg-white/5";

  return (
    <div className={`flex items-center justify-between rounded-lg ${sentimentBg} px-3 py-2`}>
      <span className="text-xs text-[var(--color-foreground)]">{dp.label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium">{dp.value}</span>
        {dp.change && <span className={`text-xs font-semibold ${sentimentColor}`}>{dp.change}</span>}
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: ReportSection }) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <span className="h-3 w-0.5 rounded-full bg-[var(--color-primary)]" />
        {section.title}
      </h4>
      <p className="text-xs leading-relaxed text-[var(--color-muted)]">{section.body}</p>
      {section.dataPoints && section.dataPoints.length > 0 && (
        <div className="space-y-1">
          {section.dataPoints.map((dp, i) => (
            <DataPointCard key={i} dp={dp} />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionPanel({ prediction }: { prediction: MarketPrediction }) {
  const risk = getRiskLevel(prediction);
  const directionLabel =
    prediction.direction === "up" ? "상승" : prediction.direction === "down" ? "하락" : "보합";
  const confidenceLabel =
    prediction.confidence === "high" ? "높음" : prediction.confidence === "medium" ? "중간" : "낮음";

  return (
    <div className={`rounded-xl border ${risk.border} ${risk.bg} p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4" />
          AI 전망
        </h3>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${risk.bg} ${risk.text}`}>
          {risk.emoji} {risk.label}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <DirectionIcon direction={prediction.direction} />
        <div>
          <span className="text-sm font-bold">{directionLabel}</span>
          <span className="ml-2 text-xs text-[var(--color-muted)]">확신도: {confidenceLabel}</span>
        </div>
      </div>

      <p className="text-xs leading-relaxed">{prediction.summary}</p>

      {prediction.factors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--color-muted)]">주요 요인</p>
          {prediction.factors.map((f, i) => (
            <p key={i} className="text-xs leading-relaxed text-[var(--color-muted)]">
              • {f}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

export async function generateMetadata({ params }: { params: Promise<{ sectorId: string }> }) {
  const { sectorId } = await params;
  const config = SECTOR_CONFIG[sectorId];
  if (!config) {
    return { title: "섹터를 찾을 수 없습니다" };
  }
  return {
    title: `${config.label} 섹터 딥다이브`,
    description: config.description,
  };
}

export default async function SectorDeepDivePage({ params }: { params: Promise<{ sectorId: string }> }) {
  const { sectorId } = await params;
  const config = SECTOR_CONFIG[sectorId];

  if (!config) {
    return (
      <div className="space-y-4">
        <Link href="/sectors" className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
          <ArrowLeft className="h-4 w-4" /> 섹터 목록
        </Link>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="text-3xl mb-3">❓</div>
          <p className="text-sm font-medium">존재하지 않는 섹터입니다</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            유효한 섹터: {VALID_SECTORS.map((s) => SECTOR_CONFIG[s].label).join(", ")}
          </p>
        </div>
      </div>
    );
  }

  let reportSet;
  try {
    reportSet = await getLatestReportSet();
  } catch {
    reportSet = null;
  }

  const report = reportSet?.reports.find((r) => r.reportType === config.reportType) ?? null;

  return (
    <div className="space-y-4">
      {/* Back navigation */}
      <Link href="/sectors" className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
        <ArrowLeft className="h-4 w-4" /> 섹터 목록
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <h2 className="text-xl font-bold">{config.label} 딥다이브</h2>
        </div>
        <p className="text-sm text-[var(--color-muted)] mt-1">{config.description}</p>
        {reportSet && (
          <p className="text-xs text-[var(--color-muted)] mt-1">
            {formatDate(reportSet.date)} 기준
          </p>
        )}
      </div>

      {report ? (
        <PaywallGate
          requiredTier="pro"
          fallback={
            <div className="space-y-4">
              {/* Free preview: headline + prediction direction */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
                <p className="text-sm font-medium leading-snug">{report.content.headline}</p>
                <div className="flex items-center gap-2">
                  <DirectionIcon direction={report.content.prediction.direction} />
                  <span className="text-sm font-bold">
                    {report.content.prediction.direction === "up" ? "상승" : report.content.prediction.direction === "down" ? "하락" : "보합"}
                  </span>
                </div>
              </div>

              {/* Blur teaser */}
              <div className="relative">
                <div className="pointer-events-none select-none blur-sm space-y-3">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 h-32" />
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 h-48" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Link
                    href="/pricing"
                    className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary)]/90"
                  >
                    Pro 구독으로 전체 분석 보기 →
                  </Link>
                </div>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Headline */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-medium leading-snug">{report.content.headline}</p>
            </div>

            {/* AI Prediction */}
            <PredictionPanel prediction={report.content.prediction} />

            {/* Sentiment analysis bar */}
            {(() => {
              const allDataPoints = report.content.sections.flatMap((s) => s.dataPoints ?? []);
              return allDataPoints.length > 0 ? (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <SentimentBar dataPoints={allDataPoints} />
                </div>
              ) : null;
            })()}

            {/* Key takeaways */}
            {report.content.keyTakeaways.length > 0 && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Newspaper className="h-4 w-4" />
                  핵심 요약
                </h3>
                <div className="space-y-1.5">
                  {report.content.keyTakeaways.map((t, i) => (
                    <p key={i} className="text-xs leading-relaxed text-[var(--color-muted)]">
                      • {t}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed sections */}
            {report.content.sections.length > 0 && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="h-4 w-4" />
                  상세 분석
                </h3>
                {report.content.sections.map((section, i) => (
                  <SectionBlock key={i} section={section} />
                ))}
              </div>
            )}

            {/* Related companies */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
              <h3 className="text-sm font-semibold">관련 종목</h3>
              <div className="flex flex-wrap gap-2">
                {config.companies.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-white/5 border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Link to full report */}
            <Link
              href="/briefing/reports"
              className="block text-center text-sm text-[var(--color-primary)] hover:underline"
            >
              전체 리포트 보기 →
            </Link>
          </div>
        </PaywallGate>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="text-3xl mb-3">📊</div>
          <p className="text-sm text-[var(--color-muted)]">
            {config.label} 섹터 데이터 준비 중...
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            AI가 섹터를 분석하고 있습니다. 잠시 후 다시 확인해주세요.
          </p>
        </div>
      )}
    </div>
  );
}
