import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import type { Severity } from "@/lib/pipeline/types";
import type { SubscriptionTier } from "@/lib/subscription";

/**
 * Severity levels each subscription tier can receive push alerts for.
 * free → 긴급 only | pro → 긴급+주의 | premium → all
 */
const TIER_SEVERITY_ACCESS: Record<SubscriptionTier, Severity[]> = {
  free: ["긴급"],
  pro: ["긴급", "주의"],
  premium: ["긴급", "주의", "참고"],
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key);
}

function getWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@dawn-market.kr";

  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID keys. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function saveSubscription(
  subscription: PushSubscriptionRecord,
  userId?: string
): Promise<void> {
  const supabase = getServiceClient();

  await supabase.from("push_subscriptions").upsert(
    {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_id: userId ?? null,
    },
    { onConflict: "endpoint" }
  );
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushToAll(payload: PushPayload): Promise<{
  sent: number;
  failed: number;
  errors: string[];
}> {
  const supabase = getServiceClient();
  const push = getWebPush();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (error) throw new Error(`Failed to fetch subscriptions: ${error.message}`);
  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0, errors: [] };
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await push.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        // Remove expired/invalid subscriptions
        if (
          err instanceof webpush.WebPushError &&
          (err.statusCode === 404 || err.statusCode === 410)
        ) {
          await removeSubscription(sub.endpoint);
        }
        throw err;
      }
    })
  );

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      sent++;
    } else {
      failed++;
      errors.push(String(r.reason));
    }
  }

  return { sent, failed, errors };
}

/**
 * Send alert push notifications filtered by subscription tier.
 * Each user only receives the alert if their tier grants access to
 * the given severity level. Anonymous subscriptions (no user_id)
 * are treated as free tier.
 */
export async function sendAlertPushByTier(
  payload: PushPayload,
  severity: Severity
): Promise<{ sent: number; failed: number; skipped: number; errors: string[] }> {
  const supabase = getServiceClient();
  const push = getWebPush();

  // 1. Fetch all push subscriptions
  const { data: pushSubs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id");

  if (error) throw new Error(`Failed to fetch push subscriptions: ${error.message}`);
  if (!pushSubs || pushSubs.length === 0) {
    return { sent: 0, failed: 0, skipped: 0, errors: [] };
  }

  // 2. Batch-fetch active subscription tiers for users with push subs
  const userIds = pushSubs
    .map((s) => s.user_id)
    .filter((id): id is string => id !== null);
  const uniqueUserIds = [...new Set(userIds)];

  const tierMap = new Map<string, SubscriptionTier>();
  if (uniqueUserIds.length > 0) {
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("user_id, tier, status, current_period_end")
      .in("user_id", uniqueUserIds)
      .eq("status", "active");

    const now = new Date();
    for (const s of subs ?? []) {
      const periodEnd = s.current_period_end ? new Date(s.current_period_end) : null;
      if (periodEnd && periodEnd > now) {
        tierMap.set(s.user_id, s.tier as SubscriptionTier);
      }
    }
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  const results = await Promise.allSettled(
    pushSubs.map(async (row) => {
      const tier: SubscriptionTier = (row.user_id && tierMap.get(row.user_id)) ?? "free";

      const allowedSeverities = TIER_SEVERITY_ACCESS[tier];
      if (!allowedSeverities.includes(severity)) {
        skipped++;
        return "skipped";
      }

      try {
        await push.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        if (
          err instanceof webpush.WebPushError &&
          (err.statusCode === 404 || err.statusCode === 410)
        ) {
          await removeSubscription(row.endpoint);
        }
        throw err;
      }
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value !== "skipped") {
      sent++;
    } else if (r.status === "rejected") {
      failed++;
      errors.push(String(r.reason));
    }
  }

  return { sent, failed, skipped, errors };
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const supabase = getServiceClient();
  const push = getWebPush();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await push.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: unknown) {
      if (
        err instanceof webpush.WebPushError &&
        (err.statusCode === 404 || err.statusCode === 410)
      ) {
        await removeSubscription(sub.endpoint);
      }
      failed++;
    }
  }

  return { sent, failed };
}
