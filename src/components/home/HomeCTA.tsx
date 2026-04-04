"use client";

import Link from "next/link";
import { usePush } from "@/lib/push/use-push";
import PushPrompt from "@/components/push/PushPrompt";

/** Shows at most one CTA at the bottom of the home page. */
export default function HomeCTA({ isPro }: { isPro: boolean }) {
  const { state } = usePush();

  // Still determining push state — show nothing to avoid flash
  if (state === "loading") return null;

  const hasPush = state === "subscribed";

  // Free user without push → push prompt (higher retention value)
  if (!isPro && !hasPush) return <PushPrompt />;

  // Free user with push → pro upgrade banner
  if (!isPro && hasPush) {
    return (
      <Link
        href="/pricing"
        className="block rounded-xl border border-[var(--color-primary)]/20 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 p-4 transition-colors hover:from-[var(--color-primary)]/15 hover:to-[var(--color-primary)]/10"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <div className="flex-1">
            <p className="text-sm font-bold">Pro로 업그레이드</p>
            <p className="text-xs text-[var(--color-muted)]">
              심층 리포트 10종 + 긴급 알림 + 무제한 아카이브
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--color-primary)]">
            월 9,900원 →
          </span>
        </div>
      </Link>
    );
  }

  // Pro user without push → push prompt
  if (isPro && !hasPush) return <PushPrompt />;

  // Pro user with push → nothing
  return null;
}
