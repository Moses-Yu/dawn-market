"use client";

import { Bell, BellOff, BellRing, X } from "lucide-react";
import { useState } from "react";
import { usePush, type PushState } from "@/lib/push/use-push";
import { trackNotificationAction } from "@/lib/analytics";

function PromptContent({
  onSubscribe,
  onDismiss,
  isProcessing,
}: {
  onSubscribe: () => void;
  onDismiss: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
          <BellRing className="h-5 w-5 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold">알림을 받으시겠어요?</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
            밤사이 중요한 시장 변동이나 긴급 뉴스가 있을 때
            <br />
            바로 알려드립니다. 언제든 끌 수 있어요.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onSubscribe}
              disabled={isProcessing}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? "설정 중..." : "알림 받기"}
            </button>
            <button
              onClick={onDismiss}
              className="rounded-lg bg-white/5 px-4 py-2 text-xs font-medium text-[var(--color-muted)] transition-colors hover:bg-white/10"
            >
              나중에
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 text-[var(--color-muted)] hover:bg-white/10"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function PushPrompt() {
  const { state, isProcessing, subscribe } = usePush();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already subscribed, denied, unsupported, loading, or dismissed
  if (state !== "prompt" || dismissed) return null;

  function handleSubscribe() {
    trackNotificationAction("prompt_subscribe");
    subscribe();
  }

  function handleDismiss() {
    trackNotificationAction("prompt_dismiss");
    setDismissed(true);
  }

  return (
    <PromptContent
      onSubscribe={handleSubscribe}
      onDismiss={handleDismiss}
      isProcessing={isProcessing}
    />
  );
}
