import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionByUserId, upsertSubscription } from "@/lib/subscription";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await getSubscriptionByUserId(user.id);

    if (!sub || sub.tier === "free") {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    await upsertSubscription(user.id, {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled. Access continues until period end.",
      periodEnd: sub.current_period_end,
    });
  } catch (error) {
    console.error("Cancel error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
