"use client";

import { useState, useEffect } from "react";
import { trackClick } from "@/lib/analytics";

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (params: KakaoShareParams) => void;
      };
    };
  }
}

interface KakaoShareParams {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: { mobileWebUrl: string; webUrl: string };
  };
  buttons: Array<{
    title: string;
    link: { mobileWebUrl: string; webUrl: string };
  }>;
}

interface ShareButtonProps {
  date: string;
  title?: string;
  summary?: string;
  compact?: boolean;
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

export default function ShareButton({
  date,
  title,
  summary,
  compact = false,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);

  // Load Kakao SDK
  useEffect(() => {
    if (!KAKAO_JS_KEY) return;
    if (window.Kakao?.isInitialized()) {
      setKakaoReady(true);
      return;
    }

    const existing = document.querySelector(
      'script[src*="developers.kakao.com/sdk"]'
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_JS_KEY);
        }
        setKakaoReady(true);
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
    script.integrity =
      "sha384-DKYJZ8NLiK8MN4/C5P2ezmFnkrysYfmT2gQnKRIFL/MmEJ5Y5oVIWx1N2VJGp0";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY);
      }
      setKakaoReady(true);
    };
    document.head.appendChild(script);
  }, []);

  function getShareUrl() {
    return `${window.location.origin}/share/briefing/${date}`;
  }

  function getShareText() {
    const url = getShareUrl();
    const shareTitle = title || `새벽시장 브리핑 ${date}`;
    const desc = summary
      ? `\n${summary.slice(0, 100)}${summary.length > 100 ? "..." : ""}`
      : "";
    return `${shareTitle}${desc}\n\n${url}`;
  }

  async function handleCopyLink() {
    trackClick("share_copy_link", { date });
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
    setShowMenu(false);
  }

  async function handleCopyText() {
    trackClick("share_copy_text", { date });
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
    trackClick("share_native", { date });
    const url = getShareUrl();
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

  function handleKakao() {
    trackClick("share_kakao", { date });
    const url = getShareUrl();
    const shareTitle = title || `새벽시장 브리핑 ${date}`;
    const desc =
      summary?.slice(0, 120) || "오늘의 해외 시장 브리핑을 확인하세요";
    const imageUrl = `${window.location.origin}/share/briefing/${date}/opengraph-image`;

    if (kakaoReady && window.Kakao) {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: shareTitle,
          description: desc,
          imageUrl,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [
          {
            title: "브리핑 보기",
            link: { mobileWebUrl: url, webUrl: url },
          },
        ],
      });
    } else {
      // Fallback: copy kakao-friendly text
      handleCopyText();
    }
    setShowMenu(false);
  }

  function handleTwitter() {
    trackClick("share_twitter", { date });
    const url = getShareUrl();
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
              onClick={handleKakao}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10"
            >
              💬 카카오톡 공유
            </button>
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10"
            >
              🔗 링크 복사
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
