"use client";

import { useActionState } from "react";
import { login, loginWithMagicLink } from "@/app/actions/auth";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [loginState, loginAction, loginPending] = useActionState(
    login,
    undefined
  );
  const [magicState, magicAction, magicPending] = useActionState(
    loginWithMagicLink,
    undefined
  );

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">새벽시장</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            로그인하여 브리핑을 확인하세요
          </p>
        </div>

        {mode === "password" ? (
          <form action={loginAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium"
              >
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-[var(--color-muted)]/30 bg-transparent px-3 py-3 text-base min-h-[44px] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-[var(--color-muted)]/30 bg-transparent px-3 py-3 text-base min-h-[44px] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="••••••••"
              />
            </div>

            {loginState?.error && (
              <p className="text-sm text-[var(--color-danger)]">
                {loginState.error}
              </p>
            )}

            <button
              type="submit"
              disabled={loginPending}
              className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-3 text-base font-medium min-h-[44px] text-white disabled:opacity-50"
            >
              {loginPending ? "로그인 중..." : "로그인"}
            </button>
          </form>
        ) : (
          <form action={magicAction} className="space-y-4">
            <div>
              <label
                htmlFor="magic-email"
                className="mb-1 block text-sm font-medium"
              >
                이메일
              </label>
              <input
                id="magic-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-[var(--color-muted)]/30 bg-transparent px-3 py-3 text-base min-h-[44px] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="you@example.com"
              />
            </div>

            {magicState?.error && (
              <p className="text-sm text-[var(--color-danger)]">
                {magicState.error}
              </p>
            )}
            {magicState?.success && (
              <p className="text-sm text-[var(--color-success)]">
                {magicState.success}
              </p>
            )}

            <button
              type="submit"
              disabled={magicPending}
              className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-3 text-base font-medium min-h-[44px] text-white disabled:opacity-50"
            >
              {magicPending ? "전송 중..." : "매직 링크 전송"}
            </button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-muted)]/30" />
          </div>
          <div className="relative flex justify-center text-xs">
            <button
              type="button"
              onClick={() =>
                setMode(mode === "password" ? "magic" : "password")
              }
              className="bg-[var(--color-background)] px-2 text-[var(--color-muted)]"
            >
              {mode === "password"
                ? "비밀번호 없이 로그인"
                : "비밀번호로 로그인"}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-[var(--color-muted)]">
          계정이 없으신가요?{" "}
          <Link
            href="/auth/signup"
            className="text-[var(--color-primary)] hover:underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
