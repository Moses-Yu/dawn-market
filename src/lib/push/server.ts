import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

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
