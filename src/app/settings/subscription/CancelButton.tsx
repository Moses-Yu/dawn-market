"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackSubscriptionAction } from "@/lib/analytics";

export default function CancelButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    trackSubscriptionAction("cancel_confirm", "pro");
    try {
      const res = await fetch("/api/payments/cancel", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "해지에 실패했습니다.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-lg border border-[var(--color-danger)]/30 px-4 py-2.5 text-sm text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/10"
      >
        구독 해지
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-danger)]/30 p-4">
      <p className="mb-3 text-sm">
        정말 해지하시겠어요? 결제 기간이 끝날 때까지 Pro 기능을 계속 사용할 수
        있습니다.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          취소
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 rounded-lg bg-[var(--color-danger)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "처리 중..." : "해지 확인"}
        </button>
      </div>
    </div>
  );
}
