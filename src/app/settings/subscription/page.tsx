import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/subscription";
import CancelButton from "./CancelButton";

export const metadata: Metadata = {
  title: "구독 관리",
};

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">구독 관리</h2>
        <p className="text-sm text-[var(--color-muted)]">로그인이 필요합니다.</p>
      </div>
    );
  }

  const { tier, isPro, subscription } = await getUserSubscription();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">구독 관리</h1>

      {/* Current plan */}
      <div className="rounded-2xl border border-[var(--color-border)] p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--color-muted)]">현재 플랜</div>
            <div className="text-lg font-bold">
              {isPro ? (
                <span className="text-[var(--color-primary)]">Pro</span>
              ) : (
                "무료"
              )}
            </div>
          </div>
          {isPro && subscription?.current_period_end && (
            <div className="text-right">
              <div className="text-sm text-[var(--color-muted)]">다음 결제일</div>
              <div className="text-sm font-medium">
                {new Date(subscription.current_period_end).toLocaleDateString(
                  "ko-KR", { timeZone: "Asia/Seoul" }
                )}
              </div>
            </div>
          )}
        </div>

        {subscription?.status === "cancelled" && (
          <div className="mt-3 rounded-lg bg-yellow-500/10 px-3 py-2 text-sm text-yellow-500">
            해지 예약됨 — {subscription.current_period_end
              ? new Date(subscription.current_period_end).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
              : ""}까지 이용 가능
          </div>
        )}
      </div>

      {/* Actions */}
      {isPro ? (
        <div className="space-y-3">
          <CancelButton />
          <Link
            href="/pricing"
            className="block text-center text-sm text-[var(--color-muted)] hover:underline"
          >
            요금제 비교
          </Link>
        </div>
      ) : (
        <Link
          href="/pricing"
          className="block rounded-lg bg-[var(--color-primary)] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-primary)]/90"
        >
          Pro 구독하기
        </Link>
      )}
    </div>
  );
}
