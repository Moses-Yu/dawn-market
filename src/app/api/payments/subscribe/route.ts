import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chargeBillingKey } from "@/lib/toss";
import {
  getSubscriptionByUserId,
  upsertSubscription,
} from "@/lib/subscription";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const PRO_PRICE = 9900;
const PRO_PERIOD_DAYS = 30;

function getServiceRoleClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await getSubscriptionByUserId(user.id);

    if (!sub?.toss_billing_key || !sub?.toss_customer_key) {
      return NextResponse.json(
        { error: "No billing key registered. Register a card first." },
        { status: 400 }
      );
    }

    if (sub.tier === "pro" && sub.status === "active") {
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end)
        : null;
      if (periodEnd && periodEnd > new Date()) {
        return NextResponse.json(
          { error: "Already subscribed to Pro" },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + PRO_PERIOD_DAYS * 24 * 60 * 60 * 1000
    );
    const orderId = `pro-${user.id.slice(0, 8)}-${Date.now()}`;

    const payment = await chargeBillingKey(sub.toss_billing_key, {
      customerKey: sub.toss_customer_key,
      amount: PRO_PRICE,
      orderId,
      orderName: "새벽시장 Pro 월간 구독",
    });

    await upsertSubscription(user.id, {
      tier: "pro",
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancelled_at: null,
    });

    const serviceClient = getServiceRoleClient();
    await serviceClient.from("payment_history").insert({
      user_id: user.id,
      subscription_id: sub.id,
      toss_payment_key: payment.paymentKey,
      amount: PRO_PRICE,
      currency: "KRW",
      status: "paid",
      paid_at: payment.approvedAt,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        tier: "pro",
        periodStart: now.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      {
        error: "Subscription failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
