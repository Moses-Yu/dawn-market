import Link from "next/link";
import { Lock } from "lucide-react";
import type { SubscriptionTier } from "@/lib/subscription";
import { getUserSubscription } from "@/lib/subscription";

interface PaywallGateProps {
  requiredTier?: SubscriptionTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default async function PaywallGate({
  requiredTier = "pro",
  children,
  fallback,
}: PaywallGateProps) {
  const { isPro, tier } = await getUserSubscription();

  const hasAccess =
    requiredTier === "free" ||
    (requiredTier === "pro" && isPro) ||
    (requiredTier === "premium" && tier === "premium");

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]/95 p-6 text-center backdrop-blur-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
            <Lock className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <h3 className="mb-1 text-lg font-bold">Pro 전용 콘텐츠</h3>
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            심층 리포트와 실시간 알림을 받아보세요
          </p>
          <Link
            href="/pricing"
            className="inline-block rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary)]/90"
          >
            Pro 구독하기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
