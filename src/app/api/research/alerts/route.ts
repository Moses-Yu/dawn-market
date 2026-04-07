import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToAll } from "@/lib/push/server";
import type { Severity, Category, Sentiment } from "@/lib/pipeline/types";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  return !!expectedKey && authHeader === `Bearer ${expectedKey}`;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

const MAX_ALERTS_PER_NIGHT = 3;

function getNightDate(now: Date = new Date()): string {
  const kstOffset = 9 * 60 * 60 * 1000;
  const kst = new Date(now.getTime() + kstOffset);
  const kstHour = kst.getUTCHours();
  if (kstHour < 6) {
    kst.setUTCDate(kst.getUTCDate() - 1);
  }
  return kst.toISOString().split("T")[0];
}

interface AlertRequest {
  title: string;
  body: string;
  severity: Severity;
  category: Category;
  sentiment: Sentiment;
  sourceArticleIds?: string[];
  sendPush?: boolean;
}

/**
 * POST /api/research/alerts
 * Accepts an alert from the Research Analyst agent.
 * Handles rate limiting and optional push notifications.
 *
 * Body: AlertRequest
 */
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const alert: AlertRequest = await request.json();

    if (!alert.title || !alert.body || !alert.severity) {
      return NextResponse.json(
        { error: "title, body, and severity are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    const nightDate = getNightDate();

    // Check rate limit
    const { data: rateData } = await supabase
      .from("alert_rate_limits")
      .select("alert_count")
      .eq("night_date", nightDate)
      .single();

    const alertsSentTonight = rateData?.alert_count ?? 0;
    if (alertsSentTonight >= MAX_ALERTS_PER_NIGHT) {
      return NextResponse.json({
        success: false,
        rateLimited: true,
        alertsSentTonight,
        message: `Rate limit reached (${MAX_ALERTS_PER_NIGHT} alerts per night)`,
      });
    }

    // Store alert
    const { data: alertData, error: alertError } = await supabase
      .from("alerts")
      .insert({
        title: alert.title,
        body: alert.body,
        severity: alert.severity,
        category: alert.category,
        sentiment: alert.sentiment,
        source_article_ids: alert.sourceArticleIds ?? [],
        pushed: false,
      })
      .select("id")
      .single();

    if (alertError) throw new Error(`Failed to store alert: ${alertError.message}`);
    const alertId = alertData.id;

    // Push notification (if requested, default true)
    let pushResult: { sent: number; failed: number } | undefined;
    const shouldPush = alert.sendPush !== false;
    if (shouldPush) {
      try {
        const severityEmoji =
          alert.severity === "긴급" ? "\uD83D\uDD34" :
          alert.severity === "주의" ? "\uD83D\uDFE1" : "\uD83D\uDFE2";
        const result = await sendPushToAll({
          title: `${severityEmoji} ${alert.title}`,
          body: alert.body,
          url: "/alerts",
          tag: `alert-${alertId}`,
        });
        pushResult = { sent: result.sent, failed: result.failed };

        await supabase
          .from("alerts")
          .update({ pushed: true, pushed_at: new Date().toISOString() })
          .eq("id", alertId);
      } catch (err) {
        console.error("Push notification failed:", err);
      }
    }

    // Increment rate limit
    const { data: existing } = await supabase
      .from("alert_rate_limits")
      .select("id, alert_count")
      .eq("night_date", nightDate)
      .single();

    if (existing) {
      await supabase
        .from("alert_rate_limits")
        .update({
          alert_count: existing.alert_count + 1,
          last_alert_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("alert_rate_limits").insert({
        night_date: nightDate,
        alert_count: 1,
        last_alert_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      alertId,
      pushResult,
      alertsSentTonight: alertsSentTonight + 1,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Research alert error:", error);
    return NextResponse.json(
      {
        error: "Failed to store alert",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
