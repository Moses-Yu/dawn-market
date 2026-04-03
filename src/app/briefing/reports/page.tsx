import Link from "next/link";
import {
  getLatestReportSet,
  getReportsByDate,
  getReportSetDates,
} from "@/lib/pipeline/reports";
import type {
  ReportSet,
  ReportContent,
  ReportSection,
  DataPoint,
  MarketPrediction,
  ReportType,
} from "@/lib/pipeline/reports";
import ReportDateNav from "./ReportDateNav";

const REPORT_ICONS: Record<ReportType, string> = {
  "us-market": "🇺🇸",
  semiconductor: "🔬",
  "shipbuilding-defense": "🚢",
  "ai-infra": "🤖",
  "secondary-battery": "🔋",
  geopolitical: "🌍",
  currency: "💱",
  "asian-premarket": "🌏",
  technical: "📊",
  "dawn-briefing": "🌅",
};

const REPORT_LABELS: Record<ReportType, string> = {
  "us-market": "미국/글로벌 시장",
  semiconductor: "반도체 섹터",
  "shipbuilding-defense": "조선/방산 섹터",
  "ai-infra": "AI 인프라 섹터",
  "secondary-battery": "2차전지 섹터",
  geopolitical: "지정학 & 거시경제",
  currency: "환율 & 채권",
  "asian-premarket": "아시아 프리마켓",
  technical: "기술적 분석",
  "dawn-briefing": "종합 브리핑",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

function PredictionBadge({ prediction }: { prediction: MarketPrediction }) {
  const directionConfig = {
    up: { label: "상승", color: "text-green-400", bg: "bg-green-500/15", arrow: "▲" },
    down: { label: "하락", color: "text-red-400", bg: "bg-red-500/15", arrow: "▼" },
    sideways: { label: "보합", color: "text-gray-400", bg: "bg-gray-500/15", arrow: "→" },
  };
  const confidenceConfig = {
    high: { label: "높음", color: "text-yellow-400" },
    medium: { label: "중간", color: "text-blue-400" },
    low: { label: "낮음", color: "text-gray-400" },
  };
  const d = directionConfig[prediction.direction];
  const c = confidenceConfig[prediction.confidence];

  return (
    <div className={`rounded-xl border border-white/10 ${d.bg} p-3`}>
      <div className="mb-1 flex items-center gap-2">
        <span className={`text-lg font-bold ${d.color}`}>{d.arrow}</span>
        <span className={`text-sm font-bold ${d.color}`}>{d.label} 전망</span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${c.color} bg-white/5`}>
          신뢰도: {c.label}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-[var(--color-muted)]">
        {prediction.summary}
      </p>
      {prediction.factors.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {prediction.factors.map((f, i) => (
            <span key={i} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[var(--color-muted)]">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DataPointRow({ point }: { point: DataPoint }) {
  const sentimentColor = {
    bullish: "text-green-400",
    bearish: "text-red-400",
    neutral: "text-gray-400",
  };
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-[var(--color-muted)]">{point.label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium tabular-nums">{point.value}</span>
        {point.change && (
          <span className={`text-xs tabular-nums ${point.sentiment ? sentimentColor[point.sentiment] : "text-[var(--color-muted)]"}`}>
            {point.change}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: ReportSection }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h4 className="mb-2 text-sm font-bold">{section.title}</h4>
      <p className="text-sm leading-relaxed text-[var(--color-muted)] whitespace-pre-line">
        {section.body}
      </p>
      {section.dataPoints && section.dataPoints.length > 0 && (
        <div className="mt-3 divide-y divide-white/5">
          {section.dataPoints.map((dp, i) => (
            <DataPointRow key={i} point={dp} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({
  reportNumber,
  reportType,
  content,
  generatedAt,
}: {
  reportNumber: number;
  reportType: ReportType;
  content: ReportContent;
  generatedAt: string;
}) {
  const icon = REPORT_ICONS[reportType] ?? "📄";
  const label = REPORT_LABELS[reportType] ?? reportType;

  return (
    <details className="group rounded-xl border border-white/10 bg-white/[0.02] open:bg-white/[0.04]">
      <summary className="flex cursor-pointer items-center gap-3 p-4 select-none">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium tabular-nums">
              #{reportNumber}
            </span>
            <span className="text-sm font-bold truncate">{label}</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--color-muted)] truncate">
            {content.headline}
          </p>
        </div>
        <span className="text-[var(--color-muted)] transition-transform group-open:rotate-90">
          ▸
        </span>
      </summary>

      <div className="space-y-3 px-4 pb-4">
        {/* Headline */}
        <div className="rounded-lg bg-white/5 p-3">
          <h3 className="text-base font-bold">{content.headline}</h3>
        </div>

        {/* Prediction */}
        {content.prediction && (
          <PredictionBadge prediction={content.prediction} />
        )}

        {/* Sections */}
        {content.sections?.map((section, i) => (
          <SectionCard key={i} section={section} />
        ))}

        {/* Key Takeaways */}
        {content.keyTakeaways && content.keyTakeaways.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h4 className="mb-2 text-sm font-bold">핵심 포인트</h4>
            <ul className="space-y-1.5">
              {content.keyTakeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                  <span className="mt-0.5 text-[var(--color-primary)]">•</span>
                  <span className="text-[var(--color-muted)]">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Generated time */}
        <div className="text-right text-xs text-[var(--color-muted)]">
          생성: {new Date(generatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </details>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-4xl">📋</div>
      <h2 className="mb-2 text-lg font-bold">리포트가 없습니다</h2>
      <p className="text-sm text-[var(--color-muted)]">
        아직 생성된 리포트가 없습니다.
        <br />
        파이프라인이 실행되면 여기에 표시됩니다.
      </p>
    </div>
  );
}

function ReportSetView({ reportSet }: { reportSet: ReportSet }) {
  // Separate dawn-briefing (report 7) from the rest
  const dawnBriefing = reportSet.reports.find((r) => r.reportType === "dawn-briefing");
  const otherReports = reportSet.reports.filter((r) => r.reportType !== "dawn-briefing");

  return (
    <div className="space-y-4">
      {/* Dawn Briefing at the top if available — always open */}
      {dawnBriefing && (
        <div className="rounded-xl border-2 border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-2xl">🌅</span>
            <h2 className="text-lg font-bold">새벽시장 종합 브리핑</h2>
          </div>
          <div className="rounded-lg bg-white/5 p-3 mb-3">
            <h3 className="text-base font-bold">{dawnBriefing.content.headline}</h3>
          </div>
          {dawnBriefing.content.prediction && (
            <PredictionBadge prediction={dawnBriefing.content.prediction} />
          )}
          {dawnBriefing.content.sections?.map((section, i) => (
            <div key={i} className="mt-3">
              <SectionCard section={section} />
            </div>
          ))}
          {dawnBriefing.content.keyTakeaways && dawnBriefing.content.keyTakeaways.length > 0 && (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="mb-2 text-sm font-bold">오늘의 핵심 포인트</h4>
              <ul className="space-y-1.5">
                {dawnBriefing.content.keyTakeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                    <span className="mt-0.5 text-[var(--color-primary)]">•</span>
                    <span className="text-[var(--color-muted)]">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Individual reports */}
      <div>
        <h3 className="flex items-center gap-2 mb-3 text-sm font-bold text-[var(--color-muted)]">
          <span className="h-3 w-0.5 rounded-full bg-[var(--color-primary)]" />
          상세 리포트 ({otherReports.length}건)
        </h3>
        <div className="space-y-2">
          {otherReports.map((report) => (
            <ReportCard
              key={report.reportNumber}
              reportNumber={report.reportNumber}
              reportType={report.reportType}
              content={report.content}
              generatedAt={report.generatedAt}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { date } = await searchParams;

  let reportSet: ReportSet | null = null;
  let availableDates: { date: string; reportCount: number }[] = [];

  try {
    availableDates = await getReportSetDates(14);
  } catch {
    availableDates = [];
  }

  try {
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const reports = await getReportsByDate(date);
      if (reports.length > 0) {
        reportSet = {
          date,
          dataWindowStart: reports[0].dataWindowStart,
          dataWindowEnd: reports[0].dataWindowEnd,
          reports,
          generatedAt: reports[reports.length - 1].generatedAt,
        };
      }
    } else {
      reportSet = await getLatestReportSet();
    }
  } catch {
    reportSet = null;
  }

  const currentDate = reportSet?.date ?? (typeof date === "string" ? date : null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Link
          href="/briefing"
          className="mb-2 inline-block text-xs text-[var(--color-primary)] hover:underline"
        >
          ← 브리핑으로
        </Link>
        <h1 className="text-xl font-bold">AI 리포트</h1>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          7단계 AI 분석 파이프라인으로 생성된 심층 리포트
        </p>
      </div>

      {/* Date navigation */}
      {availableDates.length > 0 && (
        <ReportDateNav dates={availableDates} currentDate={currentDate} />
      )}

      {/* Report date header */}
      {reportSet && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{formatDate(reportSet.date)}</p>
            <p className="text-xs text-[var(--color-muted)]">
              {reportSet.reports.length}/7 리포트 생성완료
            </p>
          </div>
          <div className="text-right text-xs text-[var(--color-muted)]">
            데이터 윈도우
            <br />
            {new Date(reportSet.dataWindowStart).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
            {" ~ "}
            {new Date(reportSet.dataWindowEnd).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      )}

      {/* Reports or empty state */}
      {reportSet ? <ReportSetView reportSet={reportSet} /> : <EmptyState />}

      {/* Disclaimer */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-[var(--color-muted)]">
        본 리포트는 AI가 자동 생성한 분석으로, 투자 조언이 아닙니다. 투자
        결정은 본인의 판단과 책임 하에 이루어져야 합니다.
      </div>
    </div>
  );
}
