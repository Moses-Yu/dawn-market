import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface SignupCTAProps {
  message?: string;
  buttonText?: string;
}

export default async function SignupCTA({
  message = "무료 가입하고 매일 시장 브리핑을 받아보세요",
  buttonText = "무료로 시작하기",
}: SignupCTAProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return null;

  return (
    <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-5 text-center space-y-3">
      <p className="text-sm font-medium">{message}</p>
      <Link
        href="/auth/signup"
        className="inline-block rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary)]/90"
      >
        {buttonText}
      </Link>
      <p className="text-xs text-[var(--color-muted)]">
        이미 계정이 있으신가요?{" "}
        <Link href="/auth/login" className="text-[var(--color-primary)] hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
