import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { issueBillingKey } from "@/lib/toss";
import { upsertSubscription } from "@/lib/subscription";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { authKey, customerKey } = await request.json();
    if (!authKey || !customerKey) {
      return NextResponse.json(
        { error: "authKey and customerKey required" },
        { status: 400 }
      );
    }

    const billing = await issueBillingKey(authKey, customerKey);

    await upsertSubscription(user.id, {
      toss_customer_key: customerKey,
      toss_billing_key: billing.billingKey,
    });

    return NextResponse.json({
      success: true,
      card: billing.card
        ? {
            number: billing.card.number,
            cardType: billing.card.cardType,
          }
        : null,
    });
  } catch (error) {
    console.error("Billing key error:", error);
    return NextResponse.json(
      {
        error: "Failed to issue billing key",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
