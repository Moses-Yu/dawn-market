import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { getSectorPreferences } from "@/app/actions/preferences";
import PushToggle from "@/components/push/PushToggle";
import SectorPreferences from "@/components/settings/SectorPreferences";

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

  const sectorPrefs = await getSectorPreferences();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">설정</h2>

      {/* Sector preferences */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--color-muted)]">
          관심 섹터
        </h3>
        <SectorPreferences initialSectors={sectorPrefs} />
      </div>

      {/* Push notifications */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--color-muted)]">
          알림 설정
        </h3>
        <PushToggle />
      </div>

      <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--color-muted)]">
          내 정보
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">이메일</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">가입일</span>
            <span>
              {new Date(user.created_at).toLocaleDateString("ko-KR")}
            </span>
          </div>
        </div>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-lg border border-[var(--color-danger)]/30 px-4 py-2.5 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
