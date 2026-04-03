"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import Link from "next/link";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            새벽시장에 가입하여 매일 브리핑을 받아보세요
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[var(--color-muted)]/30 bg-transparent px-3 py-3 text-base min-h-[44px] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="이메일 주소를 입력하세요"
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
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-[var(--color-muted)]/30 bg-transparent px-3 py-3 text-base min-h-[44px] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-[var(--color-success)]">
              {state.success}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-3 text-base font-medium min-h-[44px] text-white disabled:opacity-50"
          >
            {pending ? "가입 중..." : "가입하기"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-muted)]">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/auth/login"
            className="text-[var(--color-primary)] hover:underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
