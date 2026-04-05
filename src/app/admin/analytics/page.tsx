import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "분석 대시보드",
};

export const dynamic = "force-dynamic";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface KPI {
  totalUsers: number;
  activeProUsers: number;
  conversionRate: number;
  churnRate: number;
  arpu: number;
  monthlyRevenue: number;
  prevMonthRevenue: number;
}

interface Targets {
  conversionRate: { min: number; max: number };
  churnRate: { max: number };
  arpu: number;
}

async function getAnalytics(): Promise<{
  kpi: KPI;
  targets: Targets;
  recentPayments: Array<{
    id: string;
    user_id: string;
    amount: number;
    status: string;
    paid_at: string | null;
    created_at: string;
  }>;
}> {
  const supabase = getServiceClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    { count: totalUsers },
    { count: activeProUsers },
    { count: totalWithSubscription },
    { count: cancelledThisMonth },
    { count: activeAtMonthStart },
    { data: revenueData },
    { data: prevRevenueData },
    { data: recentPayments },
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("tier", ["pro", "premium"])
      .eq("status", "active")
      .gt("current_period_end", now.toISOString()),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("tier", ["pro", "premium"]),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("cancelled_at", monthStart.toISOString()),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("tier", ["pro", "premium"])
      .lte("current_period_start", monthStart.toISOString())
      .gt("current_period_end", monthStart.toISOString()),
    supabase
      .from("payment_history")
      .select("amount")
      .eq("status", "paid")
      .gte("paid_at", monthStart.toISOString()),
    supabase
      .from("payment_history")
      .select("amount")
      .eq("status", "paid")
      .gte("paid_at", prevMonthStart.toISOString())
      .lt("paid_at", monthStart.toISOString()),
    supabase
      .from("payment_history")
      .select("id, user_id, amount, status, paid_at, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const total = totalUsers ?? 0;
  const activePro = activeProUsers ?? 0;
  const monthlyRevenue = (revenueData ?? []).reduce(
    (sum, r) => sum + r.amount,
    0
  );
  const prevMonthRevenue = (prevRevenueData ?? []).reduce(
    (sum, r) => sum + r.amount,
    0
  );
  const conversionRate = total > 0 ? (totalWithSubscription ?? 0) / total : 0;
  const churnRate =
    (activeAtMonthStart ?? 0) > 0
      ? (cancelledThisMonth ?? 0) / (activeAtMonthStart ?? 0)
      : 0;
  const arpu = activePro > 0 ? Math.round(monthlyRevenue / activePro) : 0;

  return {
    kpi: {
      totalUsers: total,
      activeProUsers: activePro,
      conversionRate: Math.round(conversionRate * 10000) / 100,
      churnRate: Math.round(churnRate * 10000) / 100,
      arpu,
      monthlyRevenue,
      prevMonthRevenue,
    },
    targets: {
      conversionRate: { min: 5, max: 8 },
      churnRate: { max: 5 },
      arpu: 12000,
    },
    recentPayments: recentPayments ?? [],
  };
}

interface EngagementData {
  engagement: {
    dauSessions: number;
    pageViewsToday: number;
    eventsThisWeek: number;
    notifClickRate: number | null;
    topPages: Array<{ path: string; count: number }>;
  };
  feedback: {
    newCount: number;
    recent: Array<{
      id: string;
      feedback_type: string;
      rating: number | null;
      message: string;
      page_path: string | null;
      created_at: string;
    }>;
  };
}

async function getEngagement(): Promise<EngagementData | null> {
  const supabase = getServiceClient();
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();
  const weekAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    const [
      { data: dauData },
      { count: pageViewsToday },
      { count: eventsThisWeek },
      { data: topPagesRaw },
      { count: notifSent },
      { count: notifClicked },
      { data: recentFeedback },
      { count: newFeedbackCount },
    ] = await Promise.all([
      supabase
        .from("analytics_events")
        .select("session_id")
        .gte("created_at", todayStart)
        .not("session_id", "is", null),
      supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "page_view")
        .gte("created_at", todayStart),
      supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabase
        .from("analytics_events")
        .select("page_path")
        .eq("event_name", "page_view")
        .gte("created_at", weekAgo),
      supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .like("event_name", "notification_%")
        .gte("created_at", weekAgo),
      supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "notification_click")
        .gte("created_at", weekAgo),
      supabase
        .from("user_feedback")
        .select("id, feedback_type, rating, message, page_path, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("user_feedback")
        .select("*", { count: "exact", head: true })
        .eq("status", "new"),
    ]);

    const uniqueSessions = new Set(
      (dauData ?? []).map((r) => r.session_id)
    ).size;

    const pageCounts: Record<string, number> = {};
    for (const row of topPagesRaw ?? []) {
      if (row.page_path) {
        pageCounts[row.page_path] = (pageCounts[row.page_path] || 0) + 1;
      }
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, count]) => ({ path, count }));

    const notifClickRate =
      (notifSent ?? 0) > 0
        ? Math.round(((notifClicked ?? 0) / (notifSent ?? 0)) * 10000) / 100
        : null;

    return {
      engagement: {
        dauSessions: uniqueSessions,
        pageViewsToday: pageViewsToday ?? 0,
        eventsThisWeek: eventsThisWeek ?? 0,
        notifClickRate,
        topPages,
      },
      feedback: {
        newCount: newFeedbackCount ?? 0,
        recent: recentFeedback ?? [],
      },
    };
  } catch {
    return null;
  }
}

function StatusBadge({
  value,
  target,
  mode,
}: {
  value: number;
  target: { min?: number; max?: number } | number;
  mode: "range" | "below" | "above";
}) {
  let isGood = false;
  if (mode === "range" && typeof target === "object" && "min" in target) {
    isGood =
      value >= (target.min ?? 0) && value <= (target.max ?? Infinity);
  } else if (mode === "below" && typeof target === "object" && "max" in target) {
    isGood = value <= (target.max ?? Infinity);
  } else if (mode === "above" && typeof target === "number") {
    isGood = value >= target;
  }

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        isGood
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-amber-500/20 text-amber-400"
      }`}
    >
      {isGood ? "목표 달성" : "목표 미달"}
    </span>
  );
}

function formatKRW(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminAnalyticsPage() {
  const [{ kpi, targets, recentPayments }, engagementData] = await Promise.all([
    getAnalytics(),
    getEngagement(),
  ]);

  const revenueTrend =
    kpi.prevMonthRevenue > 0
      ? Math.round(
          ((kpi.monthlyRevenue - kpi.prevMonthRevenue) /
            kpi.prevMonthRevenue) *
            100
        )
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">분석 대시보드</h2>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          수익 KPI + 사용자 참여도 모니터링 (내부용)
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Conversion Rate */}
        <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-2">
          <p className="text-xs text-[var(--color-muted)]">전환율 (Free→Pro)</p>
          <p className="text-2xl font-bold">{kpi.conversionRate}%</p>
          <StatusBadge
            value={kpi.conversionRate}
            target={targets.conversionRate}
            mode="range"
          />
          <p className="text-xs text-[var(--color-muted)]">
            목표: {targets.conversionRate.min}–{targets.conversionRate.max}%
          </p>
        </div>

        {/* Churn Rate */}
        <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-2">
          <p className="text-xs text-[var(--color-muted)]">월간 이탈율</p>
          <p className="text-2xl font-bold">{kpi.churnRate}%</p>
          <StatusBadge
            value={kpi.churnRate}
            target={targets.churnRate}
            mode="below"
          />
          <p className="text-xs text-[var(--color-muted)]">
            목표: &lt;{targets.churnRate.max}%
          </p>
        </div>

        {/* ARPU */}
        <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-2">
          <p className="text-xs text-[var(--color-muted)]">ARPU</p>
          <p className="text-2xl font-bold">{formatKRW(kpi.arpu)}</p>
          <StatusBadge
            value={kpi.arpu}
            target={targets.arpu}
            mode="above"
          />
          <p className="text-xs text-[var(--color-muted)]">
            목표: {formatKRW(targets.arpu)}
          </p>
        </div>

        {/* Monthly Revenue */}
        <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-2">
          <p className="text-xs text-[var(--color-muted)]">이번 달 매출</p>
          <p className="text-2xl font-bold">{formatKRW(kpi.monthlyRevenue)}</p>
          {revenueTrend !== null && (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                revenueTrend >= 0
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {revenueTrend >= 0 ? "+" : ""}
              {revenueTrend}% vs 전월
            </span>
          )}
          <p className="text-xs text-[var(--color-muted)]">
            전월: {formatKRW(kpi.prevMonthRevenue)}
          </p>
        </div>
      </div>

      {/* User Summary */}
      <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-3">
        <h3 className="text-sm font-semibold">사용자 현황</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--color-muted)]">전체 가입자</p>
            <p className="text-lg font-bold">
              {kpi.totalUsers.toLocaleString("ko-KR")}명
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted)]">Pro 구독자</p>
            <p className="text-lg font-bold">
              {kpi.activeProUsers.toLocaleString("ko-KR")}명
            </p>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-3">
        <h3 className="text-sm font-semibold">최근 결제 내역</h3>
        {recentPayments.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)]">
            결제 내역이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {recentPayments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-mono text-[var(--color-muted)]">
                    {p.user_id.slice(0, 8)}...
                  </p>
                  <p className="text-[var(--color-muted)]">
                    {p.paid_at
                      ? new Date(p.paid_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
                      : "—"}
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="font-medium">{formatKRW(p.amount)}</p>
                  <p
                    className={
                      p.status === "paid"
                        ? "text-emerald-400"
                        : p.status === "failed"
                          ? "text-red-400"
                          : "text-[var(--color-muted)]"
                    }
                  >
                    {p.status === "paid"
                      ? "결제 완료"
                      : p.status === "failed"
                        ? "실패"
                        : p.status === "refunded"
                          ? "환불"
                          : "취소"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Engagement Metrics */}
      {engagementData && (
        <>
          <div>
            <h2 className="text-lg font-bold">사용자 참여도</h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              오늘 및 최근 7일 사용 현황
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-1">
              <p className="text-xs text-[var(--color-muted)]">DAU (오늘 세션)</p>
              <p className="text-2xl font-bold">
                {engagementData.engagement.dauSessions}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-1">
              <p className="text-xs text-[var(--color-muted)]">오늘 페이지뷰</p>
              <p className="text-2xl font-bold">
                {engagementData.engagement.pageViewsToday.toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-1">
              <p className="text-xs text-[var(--color-muted)]">주간 이벤트 수</p>
              <p className="text-2xl font-bold">
                {engagementData.engagement.eventsThisWeek.toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-1">
              <p className="text-xs text-[var(--color-muted)]">알림 클릭률</p>
              <p className="text-2xl font-bold">
                {engagementData.engagement.notifClickRate !== null
                  ? `${engagementData.engagement.notifClickRate}%`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Top Pages */}
          {engagementData.engagement.topPages.length > 0 && (
            <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-3">
              <h3 className="text-sm font-semibold">인기 페이지 (7일)</h3>
              <div className="space-y-2">
                {engagementData.engagement.topPages.map((page, i) => (
                  <div
                    key={page.path}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-[var(--color-muted)]">
                      {i + 1}. {page.path}
                    </span>
                    <span className="font-medium">
                      {page.count.toLocaleString("ko-KR")}회
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Feedback */}
          <div className="rounded-xl border border-[var(--color-muted)]/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">사용자 피드백</h3>
              {engagementData.feedback.newCount > 0 && (
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                  신규 {engagementData.feedback.newCount}건
                </span>
              )}
            </div>
            {engagementData.feedback.recent.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">
                아직 피드백이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {engagementData.feedback.recent.map((fb) => (
                  <div
                    key={fb.id}
                    className="space-y-1 border-b border-[var(--color-muted)]/10 pb-2 last:border-0"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          fb.feedback_type === "bug"
                            ? "bg-red-500/20 text-red-400"
                            : fb.feedback_type === "feature"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-white/10 text-[var(--color-muted)]"
                        }`}
                      >
                        {fb.feedback_type === "bug"
                          ? "버그"
                          : fb.feedback_type === "feature"
                            ? "기능요청"
                            : "일반"}
                      </span>
                      {fb.rating && (
                        <span className="text-yellow-400">
                          {"★".repeat(fb.rating)}
                          {"☆".repeat(5 - fb.rating)}
                        </span>
                      )}
                      <span className="text-[var(--color-muted)]">
                        {new Date(fb.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{fb.message}</p>
                    {fb.page_path && (
                      <p className="text-xs text-[var(--color-muted)]">
                        페이지: {fb.page_path}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
