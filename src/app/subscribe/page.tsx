"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { trackSubscriptionAction } from "@/lib/analytics";

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"card" | "confirm">("card");

  useEffect(() => {
    trackSubscriptionAction("page_view", "pro");

    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.async = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  async function handleCardRegister() {
    setLoading(true);
    setError(null);
    trackSubscriptionAction("card_register_start", "pro");

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) throw new Error("결제 설정이 완료되지 않았습니다.");

      // @ts-expect-error -- Toss SDK loaded via script tag
      const tossPayments = window.TossPayments(clientKey);
      const billing = tossPayments.billing();

      const result = await billing.requestBillingAuth({
        method: "CARD",
        successUrl: `${window.location.origin}/subscribe?step=confirm`,
        failUrl: `${window.location.origin}/subscribe?error=card_failed`,
      });

      if (result?.authKey) {
        const res = await fetch("/api/payments/billing-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authKey: result.authKey,
            customerKey: result.customerKey,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "카드 등록 실패");
        }

        setStep("confirm");
        trackSubscriptionAction("card_register_success", "pro");
      }
    } catch (err) {
      trackSubscriptionAction("card_register_fail", "pro");
      setError(err instanceof Error ? err.message : "카드 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    trackSubscriptionAction("subscribe_start", "pro");

    try {
      const res = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "구독 실패");
      }

      trackSubscriptionAction("subscribe_success", "pro");
      router.push("/settings/subscription?subscribed=true");
    } catch (err) {
      trackSubscriptionAction("subscribe_fail", "pro");
      setError(err instanceof Error ? err.message : "구독에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Pro 구독</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          월 ₩9,900 · 언제든 해지 가능
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {step === "card" ? (
        <div className="rounded-2xl border border-[var(--color-border)] p-5 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
            <CreditCard className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <h2 className="mb-1 text-lg font-bold">카드 등록</h2>
          <p className="mb-5 text-sm text-[var(--color-muted)]">
            Toss Payments를 통해 안전하게 결제됩니다
          </p>
          <button
            onClick={handleCardRegister}
            disabled={loading}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary)]/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              "카드 등록하기"
            )}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] p-5 text-center">
          <h2 className="mb-1 text-lg font-bold">결제 확인</h2>
          <p className="mb-2 text-sm text-[var(--color-muted)]">
            카드가 등록되었습니다
          </p>
          <div className="mb-5 rounded-lg bg-[var(--color-surface)] p-4">
            <div className="text-sm text-[var(--color-muted)]">월간 구독료</div>
            <div className="text-2xl font-bold">₩9,900</div>
          </div>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary)]/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              "Pro 구독 시작"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
