import Link from "next/link";
import {
  getLatestBriefing,
  getBriefingByDate,
} from "@/lib/pipeline/storage";
import type { MorningBriefing, BriefingStory } from "@/lib/pipeline/types";
import SeverityBadge from "@/components/briefing/SeverityBadge";
import SentimentBadge from "@/components/briefing/SentimentBadge";
import CategoryBadge from "@/components/briefing/CategoryBadge";
import ShareButton from "@/components/briefing/ShareButton";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

function MarketIndexCard({
  symbol,
  name,
  price,
  change,
  changePercent,
}: {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}) {
  const isPositive = change >= 0;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-1 text-xs text-[var(--color-muted)]">{symbol}</div>
      <div className="text-sm font-semibold">{name}</div>
      <div className="mt-1 text-lg font-bold tabular-nums">
        {price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      <div
        className={`mt-0.5 text-xs font-medium ${isPositive ? "text-red-400" : "text-blue-400"}`}
      >
        {isPositive ? "▲" : "▼"}{" "}
        {Math.abs(change).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        ({isPositive ? "+" : ""}
        {changePercent.toFixed(2)}%)
      </div>
    </div>
  );
}

function StoryCard({ story }: { story: BriefingStory }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <SeverityBadge severity={story.severity} />
        <CategoryBadge category={story.category} />
        <SentimentBadge sentiment={story.sentiment} />
      </div>
      <h3 className="mb-2 text-base font-bold leading-snug">{story.title}</h3>
      <p className="text-sm leading-relaxed text-[var(--color-muted)]">
        {story.summary}
      </p>
      {story.sources.length > 0 && (
        <div className="mt-2 text-xs text-[var(--color-muted)]">
          출처: {story.sources.join(", ")}
        </div>
      )}
    </div>
  );
}

function SectorCard({
  sector,
  outlook,
  sentiment,
}: {
  sector: string;
  outlook: string;
  sentiment: "bullish" | "bearish" | "neutral";
}) {
  const sentimentColors = {
    bullish: "border-l-green-500",
    bearish: "border-l-red-500",
    neutral: "border-l-gray-500",
  };
  return (
    <div
      className={`rounded-r-xl border border-white/10 border-l-2 ${sentimentColors[sentiment]} bg-white/5 p-3`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-bold">{sector}</span>
        <SentimentBadge sentiment={sentiment} />
      </div>
      <p className="text-sm leading-relaxed text-[var(--color-muted)]">
        {outlook}
      </p>
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

function BriefingContent({ briefing }: { briefing: MorningBriefing }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-1 text-xs text-[var(--color-muted)]">
          🌅 아침 시장 브리핑
        </div>
        <h2 className="text-xl font-bold">{formatDate(briefing.date)}</h2>
        <div className="mt-1 text-xs text-[var(--color-muted)]">
          생성:{" "}
          {new Date(briefing.generatedAt).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Share */}
      <ShareButton date={briefing.date} />

      {/* Market Overview */}
      <section>
        <h3 className="mb-3 text-base font-bold">📊 시장 개요</h3>
        <p className="mb-4 text-sm leading-relaxed text-[var(--color-muted)]">
          {briefing.marketOverview.summary}
        </p>
        {briefing.marketOverview.keyIndices.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {briefing.marketOverview.keyIndices.map((idx) => (
              <MarketIndexCard
                key={idx.symbol}
                symbol={idx.symbol}
                name={idx.name}
                price={idx.price}
                change={idx.change}
                changePercent={idx.changePercent}
              />
            ))}
          </div>
        )}
      </section>

      {/* Top Stories */}
      {briefing.topStories.length > 0 && (
        <section>
          <h3 className="mb-3 text-base font-bold">📰 주요 뉴스</h3>
          <div className="space-y-3">
            {briefing.topStories.map((story, i) => (
              <StoryCard key={i} story={story} />
            ))}
          </div>
        </section>
      )}

      {/* Sector Analysis */}
      {briefing.sectorAnalysis.length > 0 && (
        <section>
          <h3 className="mb-3 text-base font-bold">🔬 섹터 분석</h3>
          <div className="space-y-2">
            {briefing.sectorAnalysis.map((sa, i) => (
              <SectorCard
                key={i}
                sector={sa.sector}
                outlook={sa.outlook}
                sentiment={sa.sentiment}
              />
            ))}
          </div>
        </section>
      )}

      {/* Action Items */}
      {briefing.actionItems.length > 0 && (
        <section>
          <h3 className="mb-3 text-base font-bold">✅ 오늘의 체크포인트</h3>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <ul className="space-y-2">
              {briefing.actionItems.map((item, i) => (
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
      )}

      {/* Disclaimer */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-[var(--color-muted)]">
        ⚠️ 본 브리핑은 AI가 자동 생성한 정보로, 투자 조언이 아닙니다. 투자
        결정은 본인의 판단과 책임 하에 이루어져야 합니다.
      </div>

      {/* Archive link */}
      <div className="text-center">
        <Link
          href="/briefing/archive"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          📁 지난 브리핑 보기
        </Link>
      </div>
    </div>
  );
}

export default async function BriefingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { date } = await searchParams;

  let briefing: MorningBriefing | null = null;

  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    briefing = await getBriefingByDate(date);
  } else {
    briefing = await getLatestBriefing();
  }

  if (!briefing) {
    return <EmptyState />;
  }

  return <BriefingContent briefing={briefing} />;
}
