"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">비밀번호 재설정</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            가입한 이메일 주소를 입력하면 재설정 링크를 보내드립니다
          </p>
        </div>

        <form action={action} className="space-y-4">
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
              className="w-full rounded-xl border border-[var(--color-muted)]/30 bg-transparent px-3 py-3 text-base min-h-[44px] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="이메일 주소를 입력하세요"
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
            className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-base font-medium min-h-[44px] text-white disabled:opacity-50"
          >
            {pending ? "전송 중..." : "재설정 링크 전송"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-muted)]">
          <Link
            href="/auth/login"
            className="text-[var(--color-primary)] hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
