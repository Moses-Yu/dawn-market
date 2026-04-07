export const dynamic = "force-dynamic";

import Link from "next/link";
import { getLatestReportSet } from "@/lib/pipeline/reports";
import type { ReportType, MarketPrediction, DataPoint } from "@/lib/pipeline/reports";
import PaywallGate from "@/components/PaywallGate";
import PageTransition from "@/components/PageTransition";
import { StaggerContainer, StaggerItem } from "@/components/StaggerList";
import TrackEvent from "@/components/TrackEvent";
import SignupCTA from "@/components/SignupCTA";


const SECTOR_CONFIG: Record<
  string,
  { label: string; icon: string; companies: string[]; color: string }
> = {
  semiconductor: {
    label: "반도체",
    icon: "🔬",
    companies: ["삼성전자", "SK하이닉스", "NVIDIA", "TSMC"],
    color: "blue",
  },
  "shipbuilding-defense": {
    label: "조선/방산",
    icon: "🚢",
    companies: ["HD한국조선해양", "한화에어로스페이스", "한화오션"],
    color: "teal",
  },
  "ai-infra": {
    label: "AI 인프라",
    icon: "🤖",
    companies: ["NAVER", "카카오", "Microsoft", "Alphabet"],
    color: "cyan",
  },
  "secondary-battery": {
    label: "2차전지",
    icon: "🔋",
    companies: ["LG에너지솔루션", "삼성SDI", "에코프로비엠"],
    color: "green",
  },
  "bio-healthcare": {
    label: "바이오/헬스케어",
    icon: "🧬",
    companies: ["삼성바이오로직스", "셀트리온", "Eli Lilly", "Novo Nordisk"],
    color: "pink",
  },
  finance: {
    label: "금융/은행",
    icon: "🏦",
    companies: ["KB금융", "신한지주", "하나금융지주", "JPMorgan"],
    color: "amber",
  },
};

const SECTOR_REPORT_TYPES: ReportType[] = [
  "semiconductor",
  "shipbuilding-defense",
  "ai-infra",
  "secondary-battery",
  "bio-healthcare",
  "finance",
];

function getRiskLevel(prediction: MarketPrediction): {
  emoji: string;
  label: string;
  bg: string;
  text: string;
} {
  if (prediction.direction === "down" && prediction.confidence === "high") {
    return {
      emoji: "🔴",
      label: "위험",
      bg: "bg-red-500/15",
      text: "text-red-400",
    };
  }
  if (
    prediction.direction === "down" ||
    (prediction.direction === "sideways" && prediction.confidence === "low")
  ) {
    return {
      emoji: "🟡",
      label: "주의",
      bg: "bg-yellow-500/15",
      text: "text-yellow-400",
    };
  }
  return {
    emoji: "🟢",
    label: "안전",
    bg: "bg-green-500/15",
    text: "text-green-400",
  };
}

function DirectionArrow({ prediction }: { prediction: MarketPrediction }) {
  const config = {
    up: { arrow: "▲", color: "text-[var(--color-market-up)]", label: "상승" },
    down: {
      arrow: "▼",
      color: "text-[var(--color-market-down)]",
      label: "하락",
    },
    sideways: { arrow: "→", color: "text-gray-400", label: "보합" },
  };
  const c = config[prediction.direction];
  return (
    <span className={`text-sm font-bold ${c.color}`}>
      {c.arrow} {c.label}
    </span>
  );
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

function SectorCard({
  type,
  headline,
  prediction,
  keyTakeaways,
  dataPoints,
}: {
  type: string;
  headline: string;
  prediction: MarketPrediction;
  keyTakeaways: string[];
  dataPoints: DataPoint[];
}) {
  const config = SECTOR_CONFIG[type];
  if (!config) return null;

  const risk = getRiskLevel(prediction);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <h3 className="font-semibold text-sm">{config.label}</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${risk.bg} ${risk.text}`}
        >
          {risk.emoji} {risk.label}
        </span>
      </div>

      {/* Headline + prediction */}
      <div>
        <p className="text-sm font-medium leading-snug">{headline}</p>
        <div className="mt-1 flex items-center gap-2">
          <DirectionArrow prediction={prediction} />
          <span className="text-xs text-[var(--color-muted)]">
            확신도: {prediction.confidence === "high" ? "높음" : prediction.confidence === "medium" ? "중간" : "낮음"}
          </span>
        </div>
      </div>

      {/* Key data points (top 4) */}
      {dataPoints.length > 0 && (
        <div className="space-y-1.5 rounded-lg bg-white/5 p-2.5">
          {dataPoints.slice(0, 4).map((dp, i) => (
            <DataPointRow key={i} dp={dp} />
          ))}
        </div>
      )}

      {/* Key takeaways */}
      {keyTakeaways.length > 0 && (
        <div className="space-y-1">
          {keyTakeaways.slice(0, 2).map((t, i) => (
            <p
              key={i}
              className="text-xs text-[var(--color-muted)] leading-relaxed"
            >
              • {t}
            </p>
          ))}
        </div>
      )}

      {/* Companies */}
      <div className="flex flex-wrap gap-1.5">
        {config.companies.map((c) => (
          <span
            key={c}
            className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--color-muted)]"
          >
            {c}
          </span>
        ))}
      </div>

      {/* Deep dive link */}
      <Link
        href={`/sectors/${type}`}
        className="block text-center text-xs text-[var(--color-primary)] hover:underline pt-1"
      >
        딥다이브 보기 →
      </Link>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

export default async function SectorsPage() {
  let reportSet;
  try {
    reportSet = await getLatestReportSet();
  } catch {
    reportSet = null;
  }

  const sectorReports = reportSet
    ? SECTOR_REPORT_TYPES.map((type) => {
        const report = reportSet.reports.find((r) => r.reportType === type);
        return report ? { type, report } : null;
      }).filter(Boolean)
    : [];

  return (
    <PageTransition>
    <div className="space-y-4">
      <TrackEvent name="report_view" category="engagement" properties={{ report_type: "sectors_overview" }} />
      <div>
        <h2 className="text-xl font-bold">섹터 영향도</h2>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {reportSet
            ? `${formatDate(reportSet.date)} 기준 · 밤사이 이벤트가 각 섹터에 미치는 영향`
            : "6대 핵심 섹터 실시간 영향 분석"}
        </p>
      </div>

      {sectorReports.length > 0 ? (
        <PaywallGate
          requiredTier="pro"
          fallback={
            <StaggerContainer className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sectorReports.map((item) => {
                if (!item) return null;
                const { type, report } = item;
                const config = SECTOR_CONFIG[type];
                if (!config) return null;
                const risk = getRiskLevel(report.content.prediction);
                return (
                  <StaggerItem key={type}>
                  <div
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <h3 className="font-semibold text-sm">{config.label}</h3>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${risk.bg} ${risk.text}`}
                      >
                        {risk.emoji} {risk.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-snug">
                      {report.content.headline}
                    </p>
                    <DirectionArrow prediction={report.content.prediction} />
                    <Link
                      href={`/sectors/${type}`}
                      className="mt-2 block text-center text-xs text-[var(--color-primary)] hover:underline"
                    >
                      딥다이브 보기 →
                    </Link>
                  </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          }
        >
          <StaggerContainer className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sectorReports.map((item) => {
              if (!item) return null;
              const { type, report } = item;
              const allDataPoints = report.content.sections.flatMap(
                (s) => s.dataPoints ?? []
              );
              return (
                <StaggerItem key={type}>
                  <SectorCard
                    type={type}
                    headline={report.content.headline}
                    prediction={report.content.prediction}
                    keyTakeaways={report.content.keyTakeaways}
                    dataPoints={allDataPoints}
                  />
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </PaywallGate>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="text-3xl mb-3">📊</div>
          <p className="text-sm text-[var(--color-muted)]">
            섹터 데이터 준비 중...
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            AI가 6대 핵심 섹터를 분석하고 있습니다.
          </p>
        </div>
      )}

      <SignupCTA
        message="6대 섹터 심층 분석과 AI 전망을 받아보세요"
        buttonText="무료로 시작하기"
      />

      {/* Link to full reports */}
      {reportSet && (
        <Link
          href="/briefing/reports"
          className="block text-center text-sm text-[var(--color-primary)] hover:underline"
        >
          전체 리포트 보기 →
        </Link>
      )}
    </div>
    </PageTransition>
  );
}
