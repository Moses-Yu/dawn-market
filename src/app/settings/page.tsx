import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { getSectorPreferences, getWatchlist } from "@/app/actions/preferences";
import PushToggle from "@/components/push/PushToggle";
import ThemeToggle from "@/components/settings/ThemeToggle";
import InterestsCard from "@/components/settings/InterestsCard";
import Link from "next/link";

export const metadata = {
  title: "설정",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">설정</h2>
        <p className="text-sm text-[var(--color-muted)]">
          로그인이 필요합니다.
        </p>
      </div>
    );
  }

  const [sectorPrefs, watchlist] = await Promise.all([
    getSectorPreferences(),
    getWatchlist(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">설정</h2>

      {/* 1. 나의 관심 — sector badges + stock summary + edit modal */}
      <InterestsCard
        initialSectors={sectorPrefs}
        initialWatchlist={watchlist}
      />

      {/* 2. 알림 설정 */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
        <h3 className="text-sm font-semibold">알림 설정</h3>
        <PushToggle />
      </div>

      {/* 화면 모드 */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
        <h3 className="text-sm font-semibold">화면 모드</h3>
        <ThemeToggle />
      </div>

      {/* 3. 계정 */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
        <h3 className="text-sm font-semibold">계정</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">이메일</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">가입일</span>
            <span>
              {new Date(user.created_at).toLocaleDateString("ko-KR", {
                timeZone: "Asia/Seoul",
              })}
            </span>
          </div>
        </div>
        <Link
          href="/settings/subscription"
          className="block w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-center text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)]"
        >
          구독 관리
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg border border-[var(--color-danger)]/30 px-3 py-2 text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10"
          >
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}
