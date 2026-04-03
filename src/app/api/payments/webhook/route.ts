import { NextResponse } from "next/server";
import { verifyWebhookSignature, getPayment } from "@/lib/toss";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("toss-signature") ?? "";

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const { paymentKey, status, orderId } = event.data ?? event;

    if (!paymentKey) {
      return NextResponse.json({ error: "Missing paymentKey" }, { status: 400 });
    }

    const payment = await getPayment(paymentKey);
    const supabase = getServiceClient();

    if (status === "DONE" || payment.status === "DONE") {
      await supabase
        .from("payment_history")
        .update({ status: "paid", paid_at: payment.approvedAt })
        .eq("toss_payment_key", paymentKey);
    } else if (status === "CANCELED" || payment.status === "CANCELED") {
      await supabase
        .from("payment_history")
        .update({ status: "cancelled" })
        .eq("toss_payment_key", paymentKey);
    } else if (status === "ABORTED" || payment.status === "ABORTED") {
      await supabase
        .from("payment_history")
        .update({ status: "failed" })
        .eq("toss_payment_key", paymentKey);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
