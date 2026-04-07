import Link from "next/link";
import { Sparkles } from "lucide-react";

interface LandingHeroProps {
  briefingHeadline?: string;
  briefingDate?: string;
}

export default function LandingHero({
  briefingHeadline,
  briefingDate,
}: LandingHeroProps) {
  return (
    <section className="rounded-2xl border border-[var(--color-primary)]/20 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent p-5 space-y-4">
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--color-primary)]">
        새벽시장
      </p>
      <h1 className="text-2xl font-bold leading-tight">
        밤사이 해외 이슈,
        <br />
        오늘 한국장 영향 분석
      </h1>
      <p className="text-sm text-[var(--color-muted)] leading-relaxed">
        매일 아침 8시, AI가 해외 시장을 정리해드립니다. 반도체·방산·AI — 초보
        투자자를 위한 한국어 브리핑.
      </p>

      {briefingHeadline && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            <span className="text-xs font-medium text-[var(--color-primary)]">
              오늘 브리핑 미리보기
            </span>
            {briefingDate && (
              <span className="ml-auto text-[10px] text-[var(--color-muted)]">
                {briefingDate}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed line-clamp-2">
            {briefingHeadline}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href="/onboarding"
          className="flex-1 rounded-xl bg-[var(--color-primary)] py-3 text-center text-sm font-semibold text-white"
        >
          무료로 시작하기
        </Link>
        <Link
          href="/login"
          className="flex-1 rounded-xl border border-[var(--color-border)] py-3 text-center text-sm font-medium text-[var(--color-foreground)]"
        >
          로그인
        </Link>
      </div>
    </section>
  );
}
