"use client";

import { Bell, BellOff } from "lucide-react";
import { usePush } from "@/lib/push/use-push";

export default function PushToggle() {
  const { state, isProcessing, subscribe, unsubscribe } = usePush();

  if (state === "loading") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-[var(--color-muted)]" />
          <div>
            <div className="text-sm font-medium">푸시 알림</div>
            <div className="text-xs text-[var(--color-muted)]">확인 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-[var(--color-muted)]" />
          <div>
            <div className="text-sm font-medium">푸시 알림</div>
            <div className="text-xs text-[var(--color-muted)]">
              이 브라우저에서는 지원되지 않습니다
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-red-400" />
          <div>
            <div className="text-sm font-medium">푸시 알림</div>
            <div className="text-xs text-[var(--color-muted)]">
              알림이 차단되었습니다. 브라우저 설정에서 변경해주세요.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSubscribed = state === "subscribed";

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <Bell
          className={`h-5 w-5 ${isSubscribed ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"}`}
        />
        <div>
          <div className="text-sm font-medium">푸시 알림</div>
          <div className="text-xs text-[var(--color-muted)]">
            {isSubscribed
              ? "시장 알림을 받고 있습니다"
              : "중요한 시장 변동 시 알림을 받으세요"}
          </div>
        </div>
      </div>
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isProcessing}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          isSubscribed
            ? "bg-white/5 text-[var(--color-muted)] hover:bg-white/10"
            : "bg-[var(--color-primary)] text-white hover:opacity-90"
        }`}
      >
        {isProcessing
          ? "처리 중..."
          : isSubscribed
            ? "알림 끄기"
            : "알림 받기"}
      </button>
    </div>
  );
}
