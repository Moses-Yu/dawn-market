import Link from "next/link";
import { getUserSubscription } from "@/lib/subscription";

export default async function Header() {
  const { isPro } = await getUserSubscription();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--color-background)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-[var(--color-primary)]">새벽</span>시장
        </h1>
        <div className="flex items-center gap-2">
          {isPro ? (
            <span className="rounded-full bg-[var(--color-primary)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
              Pro
            </span>
          ) : (
            <Link
              href="/pricing"
              className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20"
            >
              Pro 업그레이드
            </Link>
          )}
          <span className="text-xs text-[var(--color-muted)]">Dawn Market</span>
        </div>
      </div>
    </header>
  );
}
