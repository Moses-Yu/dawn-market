import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    // DAU — unique sessions today
    const { data: dauData } = await supabase
      .from("analytics_events")
      .select("session_id")
      .gte("created_at", todayStart)
      .not("session_id", "is", null);

    const uniqueSessionsToday = new Set(
      (dauData ?? []).map((r) => r.session_id)
    ).size;

    // Page views today
    const { count: pageViewsToday } = await supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "page_view")
      .gte("created_at", todayStart);

    // Total events this week
    const { count: eventsThisWeek } = await supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo);

    // Top pages this week
    const { data: topPagesRaw } = await supabase
      .from("analytics_events")
      .select("page_path")
      .eq("event_name", "page_view")
      .gte("created_at", weekAgo);

    const pageCounts: Record<string, number> = {};
    for (const row of topPagesRaw ?? []) {
      if (row.page_path) {
        pageCounts[row.page_path] = (pageCounts[row.page_path] || 0) + 1;
      }
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // Notification click rate (clicks / total notification events this week)
    const { count: notifSent } = await supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .like("event_name", "notification_%")
      .gte("created_at", weekAgo);

    const { count: notifClicked } = await supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "notification_click")
      .gte("created_at", weekAgo);

    const notifClickRate =
      (notifSent ?? 0) > 0
        ? Math.round(((notifClicked ?? 0) / (notifSent ?? 0)) * 10000) / 100
        : null;

    // Recent feedback
    const { data: recentFeedback } = await supabase
      .from("user_feedback")
      .select("id, feedback_type, rating, message, page_path, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    // Feedback count by status
    const { count: newFeedbackCount } = await supabase
      .from("user_feedback")
      .select("*", { count: "exact", head: true })
      .eq("status", "new");

    return NextResponse.json({
      engagement: {
        dauSessions: uniqueSessionsToday,
        pageViewsToday: pageViewsToday ?? 0,
        eventsThisWeek: eventsThisWeek ?? 0,
        notifClickRate,
        topPages,
      },
      feedback: {
        newCount: newFeedbackCount ?? 0,
        recent: recentFeedback ?? [],
      },
      period: {
        todayStart,
        weekAgo,
        now: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Engagement API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagement data" },
      { status: 500 }
    );
  }
}
