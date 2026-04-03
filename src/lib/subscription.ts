import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export type SubscriptionTier = "free" | "pro" | "premium";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "expired";

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  toss_customer_key: string | null;
  toss_billing_key: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionInfo {
  tier: SubscriptionTier;
  isActive: boolean;
  isPro: boolean;
  subscription: Subscription | null;
}

const FREE_INFO: UserSubscriptionInfo = {
  tier: "free",
  isActive: false,
  isPro: false,
  subscription: null,
};

/**
 * Get the current user's subscription info (server component / route handler).
 * Uses the SSR Supabase client scoped to the authenticated user.
 */
export async function getUserSubscription(): Promise<UserSubscriptionInfo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return FREE_INFO;

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!data) return FREE_INFO;

  const sub = data as Subscription;
  const now = new Date();
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end)
    : null;
  const isActive =
    sub.status === "active" && periodEnd !== null && periodEnd > now;
  const isPro = isActive && (sub.tier === "pro" || sub.tier === "premium");

  return { tier: sub.tier, isActive, isPro, subscription: sub };
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createServiceClient(url, key);
}

/**
 * Create or update a subscription for a user (service role, used in API routes).
 */
export async function upsertSubscription(
  userId: string,
  fields: Partial<
    Pick<
      Subscription,
      | "tier"
      | "status"
      | "toss_customer_key"
      | "toss_billing_key"
      | "current_period_start"
      | "current_period_end"
      | "cancelled_at"
    >
  >
): Promise<Subscription> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      { user_id: userId, updated_at: new Date().toISOString(), ...fields },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw new Error(`upsertSubscription failed: ${error.message}`);
  return data as Subscription;
}

/**
 * Get a subscription by user ID (service role, for API routes / cron).
 */
export async function getSubscriptionByUserId(
  userId: string
): Promise<Subscription | null> {
  const supabase = getServiceRoleClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  return (data as Subscription) ?? null;
}

/**
 * Find active subscriptions expiring within the next N hours (for auto-renewal cron).
 */
export async function getExpiringSubscriptions(
  withinHours: number = 24
): Promise<Subscription[]> {
  const supabase = getServiceRoleClient();
  const cutoff = new Date(
    Date.now() + withinHours * 60 * 60 * 1000
  ).toISOString();

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .neq("tier", "free")
    .lt("current_period_end", cutoff);

  return (data as Subscription[]) ?? [];
}
