"use client";

import { useState } from "react";

interface ShareButtonProps {
  date: string;
  title?: string;
  summary?: string;
  compact?: boolean;
}

export default function ShareButton({
  date,
  title,
  summary,
  compact = false,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  function getUrl() {
    return `${window.location.origin}/briefing?date=${date}`;
  }

  function getShareText() {
    const url = getUrl();
    const shareTitle = title || `새벽시장 브리핑 ${date}`;
    const desc = summary
      ? `\n${summary.slice(0, 100)}${summary.length > 100 ? "..." : ""}`
      : "";
    return `${shareTitle}${desc}\n\n${url}`;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
    setShowMenu(false);
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
    setShowMenu(false);
  }

  async function handleNativeShare() {
    const url = getUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || `새벽시장 브리핑 - ${date}`,
          text: summary || "오늘의 해외 시장 브리핑을 확인하세요",
          url,
        });
        setShowMenu(false);
        return;
      } catch {
        // user cancelled
      }
    }
    handleCopyLink();
  }

  function handleTwitter() {
    const url = getUrl();
    const text = encodeURIComponent(
      title || `새벽시장 브리핑 ${date} - 오늘의 해외 시장 분석`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`,
      "_blank",
      "width=550,height=420"
    );
    setShowMenu(false);
  }

  if (compact) {
    return (
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-[var(--color-foreground)] transition-colors hover:bg-white/10"
      >
        📤 공유
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          onClick={handleNativeShare}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--color-foreground)] transition-colors hover:bg-white/10"
        >
          📤 공유하기
        </button>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--color-foreground)] transition-colors hover:bg-white/10"
        >
          {copied ? "✅ 복사됨" : "⋯ 더보기"}
        </button>
      </div>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-xl border border-white/10 bg-[#1a1a1a] p-1 shadow-lg">
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10"
            >
              🔗 링크 복사
            </button>
            <button
              onClick={handleCopyText}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10"
            >
              💬 카톡용 텍스트 복사
            </button>
            <button
              onClick={handleTwitter}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10"
            >
              🐦 X(트위터) 공유
            </button>
          </div>
        </>
      )}
    </div>
  );
}
