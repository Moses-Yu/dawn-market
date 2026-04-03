import type { Metadata } from "next";
import Link from "next/link";
import { getBriefingsList } from "@/lib/pipeline/storage";

export const metadata: Metadata = {
  title: "브리핑 아카이브",
  description:
    "새벽시장 AI 시장 브리핑 아카이브. 날짜별로 과거 브리핑을 확인하고 시장 흐름을 파악하세요.",
  openGraph: {
    title: "새벽시장 브리핑 아카이브",
    description: "날짜별 AI 시장 브리핑 모아보기",
  },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

export default async function ArchivePage() {
  let briefings: Awaited<ReturnType<typeof getBriefingsList>> = [];
  try {
    briefings = await getBriefingsList(30);
  } catch {
    briefings = [];
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/briefing"
          className="mb-2 inline-block text-xs text-[var(--color-primary)] hover:underline"
        >
          ← 최신 브리핑으로
        </Link>
        <h2 className="text-xl font-bold">📁 브리핑 아카이브</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          지난 브리핑을 날짜별로 확인하세요
        </p>
      </div>

      {briefings.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-3 text-3xl">📭</div>
          <p className="text-sm text-[var(--color-muted)]">
            아직 저장된 브리핑이 없습니다
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {briefings.map((b) => (
            <Link
              key={b.id}
              href={`/briefing?date=${b.date}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              <div>
                <div className="text-sm font-semibold">
                  {formatDate(b.date)}
                </div>
                <div className="mt-0.5 text-xs text-[var(--color-muted)]">
                  뉴스 {b.storyCount}건
                </div>
              </div>
              <span className="text-[var(--color-muted)]">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
