"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";

export default function UpdatePasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">새 비밀번호 설정</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            새로운 비밀번호를 입력해주세요
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              새 비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full rounded-xl border border-[var(--color-muted)]/30 bg-transparent px-3 py-3 text-base min-h-[44px] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="6자 이상 입력하세요"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium"
            >
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full rounded-xl border border-[var(--color-muted)]/30 bg-transparent px-3 py-3 text-base min-h-[44px] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="비밀번호를 다시 입력하세요"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-base font-medium min-h-[44px] text-white disabled:opacity-50"
          >
            {pending ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>
    </div>
  );
}
