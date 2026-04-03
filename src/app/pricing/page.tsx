import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { getUserSubscription } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "요금제",
  description: "새벽시장 Pro 구독으로 심층 리포트와 실시간 알림을 받아보세요.",
};

const FEATURES = [
  { name: "매일 아침 종합 브리핑", free: true, pro: true },
  { name: "새벽 종합 브리핑 리포트", free: true, pro: true },
  { name: "용어집", free: true, pro: true },
  { name: "10개 심층 섹터 리포트", free: false, pro: true },
  { name: "아카이브 무제한 열람", free: false, pro: true },
  { name: "실시간 긴급 알림", free: false, pro: true },
  { name: "섹터 리스크 대시보드 전체", free: false, pro: true },
];

export default async function PricingPage() {
  const { isPro } = await getUserSubscription();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">요금제</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          투자에 필요한 정보, 빠짐없이
        </p>
      </div>

      <div className="grid gap-4">
        {/* Free tier */}
        <div className="rounded-2xl border border-[var(--color-border)] p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold">무료</h2>
            <p className="mt-1 text-3xl font-bold">
              ₩0<span className="text-sm font-normal text-[var(--color-muted)]">/월</span>
            </p>
          </div>
          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f.name} className="flex items-center gap-2 text-sm">
                {f.free ? (
                  <Check className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
                ) : (
                  <X className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                )}
                <span className={f.free ? "" : "text-[var(--color-muted)]"}>
                  {f.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro tier */}
        <div className="rounded-2xl border-2 border-[var(--color-primary)] p-5">
          <div className="mb-1 inline-block rounded-full bg-[var(--color-primary)]/10 px-3 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
            추천
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-bold">Pro</h2>
            <p className="mt-1 text-3xl font-bold">
              ₩9,900
              <span className="text-sm font-normal text-[var(--color-muted)]">
                /월
              </span>
            </p>
          </div>
          <ul className="mb-5 space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f.name} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
                {f.name}
              </li>
            ))}
          </ul>
          {isPro ? (
            <div className="rounded-lg bg-[var(--color-success)]/10 px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-success)]">
              현재 구독 중
            </div>
          ) : (
            <Link
              href="/subscribe"
              className="block rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-primary)]/90"
            >
              Pro 시작하기
            </Link>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-[var(--color-muted)]">
        언제든 해지 가능 · 해지 후 결제 기간까지 이용 가능
      </p>
    </div>
  );
}
