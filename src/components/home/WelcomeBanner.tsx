"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sunrise, X } from "lucide-react";

const STORAGE_KEY = "welcome_banner_dismissed";

export default function WelcomeBanner({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (isLoggedIn || dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  return (
    <section className="relative rounded-xl bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/20 p-4">
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
        aria-label="배너 닫기"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/15">
          <Sunrise className="h-5 w-5 text-[var(--color-primary)]" />
        </div>
        <div className="min-w-0 flex-1 pr-4">
          <h3 className="text-sm font-bold">
            <span className="text-[var(--color-primary)]">새벽</span>시장에
            오신 것을 환영합니다
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
            밤사이 해외 시장 뉴스를 AI가 매일 새벽 정리해드립니다.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Link
          href="/onboarding"
          className="flex-1 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-center text-sm font-medium text-white min-h-[36px] flex items-center justify-center"
        >
          무료로 시작하기
        </Link>
        <Link
          href="/login"
          className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-center text-sm font-medium text-[var(--color-foreground)] min-h-[36px] flex items-center justify-center"
        >
          로그인
        </Link>
      </div>
    </section>
  );
}
