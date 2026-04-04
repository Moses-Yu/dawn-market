import Link from "next/link";
import { Star } from "lucide-react";

export default function WatchlistUpsellBanner() {
  return (
    <div className="rounded-xl border border-[var(--color-primary)]/20 bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15">
          <Star className="h-4 w-4 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold">
            내 종목 맞춤 브리핑은 Pro에서
          </h4>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            관심 종목의 실시간 분석과 맞춤 인사이트
          </p>
          <Link
            href="/pricing"
            className="mt-2.5 inline-block rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary)]/90"
          >
            Pro 시작하기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
