"use client";

import { useState } from "react";

export default function ShareButton({ date }: { date: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    const url = `${window.location.origin}/briefing?date=${date}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/briefing?date=${date}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `새벽시장 브리핑 - ${date}`,
          text: "오늘의 해외 시장 브리핑을 확인하세요",
          url,
        });
        return;
      } catch {
        // user cancelled or not supported
      }
    }
    handleCopyLink();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--color-foreground)] transition-colors hover:bg-white/10"
      >
        📤 공유하기
      </button>
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--color-foreground)] transition-colors hover:bg-white/10"
      >
        {copied ? "✅ 복사됨" : "🔗 링크 복사"}
      </button>
    </div>
  );
}
