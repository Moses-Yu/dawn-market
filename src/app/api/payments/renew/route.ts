import { NextResponse } from "next/server";
import { chargeBillingKey } from "@/lib/toss";
import {
  getExpiringSubscriptions,
  upsertSubscription,
} from "@/lib/subscription";
import { createClient } from "@supabase/supabase-js";

const PRO_PRICE = 9900;
const PRO_PERIOD_DAYS = 30;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PIPELINE_API_KEY;
  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiring = await getExpiringSubscriptions(24);

    const results = await Promise.allSettled(
      expiring.map(async (sub) => {
        if (!sub.toss_billing_key || !sub.toss_customer_key) {
          throw new Error(`No billing key for user ${sub.user_id}`);
        }

        const now = new Date();
        const periodEnd = new Date(
          now.getTime() + PRO_PERIOD_DAYS * 24 * 60 * 60 * 1000
        );
        const orderId = `renew-${sub.user_id.slice(0, 8)}-${Date.now()}`;

        const payment = await chargeBillingKey(sub.toss_billing_key, {
          customerKey: sub.toss_customer_key,
          amount: PRO_PRICE,
          orderId,
          orderName: "새벽시장 Pro 월간 자동갱신",
        });

        await upsertSubscription(sub.user_id, {
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          status: "active",
        });

        const serviceClient = getServiceClient();
        await serviceClient.from("payment_history").insert({
          user_id: sub.user_id,
          subscription_id: sub.id,
          toss_payment_key: payment.paymentKey,
          amount: PRO_PRICE,
          currency: "KRW",
          status: "paid",
          paid_at: payment.approvedAt,
        });

        return { userId: sub.user_id, status: "renewed" };
      })
    );

    const renewed = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected");

    for (const f of failed) {
      if (f.status === "rejected") {
        console.error("Renewal failed:", f.reason);
      }
    }

    return NextResponse.json({
      processed: expiring.length,
      renewed,
      failed: failed.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Renew cron error:", error);
    return NextResponse.json(
      { error: "Renewal cron failed" },
      { status: 500 }
    );
  }
}
