import Link from "next/link";
import { Check } from "lucide-react";

const ROWS = [
  { feature: "매일 종합 브리핑", free: true },
  { feature: "섹터 리스크 대시보드", free: false },
  { feature: "실시간 긴급 알림", free: false },
  { feature: "아카이브 무제한", free: false },
] as const;

export default function LandingPricingTeaser() {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
      <div>
        <h2 className="text-sm font-bold">무료로 시작, 필요하면 Pro</h2>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">
          언제든 업그레이드 · 언제든 해지
        </p>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="py-2.5 text-left font-medium text-[var(--color-muted)]">
              기능
            </th>
            <th className="w-12 py-2.5 text-center font-medium text-[var(--color-muted)]">
              무료
            </th>
            <th className="w-12 py-2.5 text-center font-semibold text-[var(--color-primary)]">
              Pro
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr
              key={row.feature}
              className={
                i < ROWS.length - 1
                  ? "border-b border-[var(--color-border)]"
                  : ""
              }
            >
              <td className="py-2.5">{row.feature}</td>
              <td className="py-2.5 text-center">
                {row.free ? (
                  <Check className="inline h-3.5 w-3.5 text-[var(--color-success)]" />
                ) : (
                  <span className="text-[var(--color-muted)]">—</span>
                )}
              </td>
              <td className="py-2.5 text-center">
                <Check className="inline h-3.5 w-3.5 text-[var(--color-success)]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">
          Pro{" "}
          <span className="text-[var(--color-primary)]">₩9,900</span>/월
        </p>
        <Link
          href="/pricing"
          className="text-xs font-medium text-[var(--color-primary)] hover:underline"
        >
          요금제 자세히 보기 →
        </Link>
      </div>
    </section>
  );
}
