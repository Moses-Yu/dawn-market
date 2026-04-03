"use client";

import Link from "next/link";

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]})`;
}

export default function ReportDateNav({
  dates,
  currentDate,
}: {
  dates: { date: string; reportCount: number }[];
  currentDate: string | null;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
      {dates.map(({ date, reportCount }) => {
        const isActive = date === currentDate;
        return (
          <Link
            key={date}
            href={`/briefing/reports?date=${date}`}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white/5 text-[var(--color-muted)] hover:bg-white/10"
            }`}
          >
            <div>{formatShortDate(date)}</div>
            <div className="mt-0.5 text-center opacity-60">{reportCount}/10</div>
          </Link>
        );
      })}
    </div>
  );
}
