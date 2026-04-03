import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { sendPushToAll } from "@/lib/push/server";
import type { ArticleSummary, Severity, Category, Sentiment } from "./types";

const anthropic = new Anthropic();

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

export interface Alert {
  id?: string;
  title: string;
  body: string;
  severity: Severity;
  category: Category;
  sentiment: Sentiment;
  sourceArticleIds: string[];
  pushed: boolean;
  pushedAt?: string;
  createdAt?: string;
}

const MAX_ALERTS_PER_NIGHT = 3;

const ALERT_PROMPT = `당신은 한국 초보 개인투자자를 위한 긴급 알림 작성자입니다.
중요한 시장 이벤트가 발생했을 때, 초보 투자자가 이해할 수 있는 쉬운 한국어로 알림을 작성해주세요.

다음 규칙을 따르세요:
1. 제목은 15자 이내, 핵심만 담으세요
2. 본문은 1문단(3-4문장)으로, "이것이 나에게 무슨 의미인지"를 설명하세요
3. 공포를 조장하지 말고 차분하게 설명하세요
4. "~할 수 있습니다" 등 비단정적 표현을 사용하세요
5. 매수/매도 추천은 절대 하지 마세요

반드시 JSON으로만 응답하세요:
{
  "title": "알림 제목 (15자 이내)",
  "body": "초보 투자자를 위한 설명 (3-4문장)"
}`;

/**
 * Check if we're in the overnight monitoring window (10 PM - 6 AM KST)
 */
export function isOvernightWindow(now: Date = new Date()): boolean {
  const kstHour = (now.getUTCHours() + 9) % 24;
  return kstHour >= 22 || kstHour < 6;
}

/**
 * Get tonight's date key for rate limiting (YYYY-MM-DD of the night start)
 */
function getNightDate(now: Date = new Date()): string {
  const kstOffset = 9 * 60 * 60 * 1000;
  const kst = new Date(now.getTime() + kstOffset);
  const kstHour = kst.getUTCHours();
  // If before 6 AM KST, the night started yesterday
  if (kstHour < 6) {
    kst.setUTCDate(kst.getUTCDate() - 1);
  }
  return kst.toISOString().split("T")[0];
}

/**
 * Check rate limit for tonight
 */
async function checkRateLimit(): Promise<{
  allowed: boolean;
  alertsSentTonight: number;
}> {
  const supabase = getServiceClient();
  const nightDate = getNightDate();

  const { data } = await supabase
    .from("alert_rate_limits")
    .select("alert_count")
    .eq("night_date", nightDate)
    .single();

  const count = data?.alert_count ?? 0;
  return { allowed: count < MAX_ALERTS_PER_NIGHT, alertsSentTonight: count };
}

/**
 * Increment rate limit counter
 */
async function incrementRateLimit(): Promise<void> {
  const supabase = getServiceClient();
  const nightDate = getNightDate();

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
}

/**
 * Determine if summaries warrant an alert based on severity thresholds.
 * Returns the highest-priority group of summaries to alert on.
 */
function findAlertWorthy(
  summaries: ArticleSummary[]
): ArticleSummary[] | null {
  // 긴급 events always trigger an alert
  const critical = summaries.filter((s) => s.severity === "긴급");
  if (critical.length > 0) return critical;

  // Multiple 주의 events in the same category suggest a significant trend
  const warnings = summaries.filter((s) => s.severity === "주의");
  const categoryGroups = new Map<string, ArticleSummary[]>();
  for (const w of warnings) {
    const group = categoryGroups.get(w.category) ?? [];
    group.push(w);
    categoryGroups.set(w.category, group);
  }
  for (const [, group] of categoryGroups) {
    if (group.length >= 2) return group;
  }

  return null;
}

/**
 * Compose an alert using Claude from a group of related summaries.
 */
async function composeAlert(
  summaries: ArticleSummary[]
): Promise<{ title: string; body: string }> {
  const summariesText = summaries
    .map(
      (s) =>
        `[${s.severity}] [${s.category}] ${s.title}\n요약: ${s.summaryKo}\n핵심: ${s.keyTakeaway}`
    )
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `${ALERT_PROMPT}\n\n--- 관련 뉴스 ---\n${summariesText}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse alert response");

  return JSON.parse(jsonMatch[0]);
}

/**
 * Store alert in the database
 */
async function storeAlert(alert: Alert): Promise<string> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      title: alert.title,
      body: alert.body,
      severity: alert.severity,
      category: alert.category,
      sentiment: alert.sentiment,
      source_article_ids: alert.sourceArticleIds,
      pushed: alert.pushed,
      pushed_at: alert.pushedAt,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to store alert: ${error.message}`);
  return data.id;
}

/**
 * Get recent alerts
 */
export async function getRecentAlerts(
  limit: number = 20
): Promise<Alert[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch alerts: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    severity: row.severity,
    category: row.category,
    sentiment: row.sentiment,
    sourceArticleIds: row.source_article_ids ?? [],
    pushed: row.pushed,
    pushedAt: row.pushed_at,
    createdAt: row.created_at,
  }));
}

export interface AlertScanResult {
  scanned: number;
  alertGenerated: boolean;
  alert?: Alert;
  pushResult?: { sent: number; failed: number };
  rateLimited: boolean;
  alertsSentTonight: number;
  skippedReason?: string;
}

/**
 * Main alert scan: analyze recent summaries, generate alert if warranted,
 * push notification, and store.
 */
export async function runAlertScan(
  summaries: ArticleSummary[]
): Promise<AlertScanResult> {
  // Check overnight window
  if (!isOvernightWindow()) {
    return {
      scanned: summaries.length,
      alertGenerated: false,
      rateLimited: false,
      alertsSentTonight: 0,
      skippedReason: "Outside overnight window (10 PM - 6 AM KST)",
    };
  }

  // Check rate limit
  const { allowed, alertsSentTonight } = await checkRateLimit();
  if (!allowed) {
    return {
      scanned: summaries.length,
      alertGenerated: false,
      rateLimited: true,
      alertsSentTonight,
      skippedReason: `Rate limit reached (${MAX_ALERTS_PER_NIGHT} alerts per night)`,
    };
  }

  // Find alert-worthy events
  const alertGroup = findAlertWorthy(summaries);
  if (!alertGroup) {
    return {
      scanned: summaries.length,
      alertGenerated: false,
      rateLimited: false,
      alertsSentTonight,
      skippedReason: "No events met alert threshold",
    };
  }

  // Compose alert via Claude
  const composed = await composeAlert(alertGroup);

  // Determine alert metadata from the trigger group
  const primarySummary = alertGroup[0];
  const alert: Alert = {
    title: composed.title,
    body: composed.body,
    severity: primarySummary.severity,
    category: primarySummary.category,
    sentiment: primarySummary.sentiment,
    sourceArticleIds: alertGroup.map((s) => s.articleSourceId),
    pushed: false,
  };

  // Store alert
  const alertId = await storeAlert(alert);
  alert.id = alertId;

  // Push notification
  let pushResult: { sent: number; failed: number } | undefined;
  try {
    const severityEmoji =
      alert.severity === "긴급"
        ? "🔴"
        : alert.severity === "주의"
          ? "🟡"
          : "🟢";
    const result = await sendPushToAll({
      title: `${severityEmoji} ${alert.title}`,
      body: alert.body,
      url: "/alerts",
      tag: `alert-${alertId}`,
    });
    pushResult = { sent: result.sent, failed: result.failed };
    alert.pushed = true;
    alert.pushedAt = new Date().toISOString();

    // Update pushed status in DB
    const supabase = getServiceClient();
    await supabase
      .from("alerts")
      .update({ pushed: true, pushed_at: alert.pushedAt })
      .eq("id", alertId);
  } catch (err) {
    console.error("Push notification failed:", err);
  }

  // Increment rate limit
  await incrementRateLimit();

  return {
    scanned: summaries.length,
    alertGenerated: true,
    alert,
    pushResult,
    rateLimited: false,
    alertsSentTonight: alertsSentTonight + 1,
  };
}
