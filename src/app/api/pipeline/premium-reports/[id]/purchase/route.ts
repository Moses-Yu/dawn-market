import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/subscription";
import {
  getPremiumReportById,
  hasUserPurchased,
  createPurchase,
} from "@/lib/pipeline/premium-reports";

/**
 * POST /api/pipeline/premium-reports/[id]/purchase
 * Purchase a single premium report. Skips if user already has premium or already purchased.
 *
 * Body: { tossPaymentKey?: string }
 *
 * In production, this should be called after Toss Payments confirms the payment.
 * For now it records the purchase directly (integrate with Toss webhook later).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await getPremiumReportById(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // If user is already premium, no need to purchase
    const subInfo = await getUserSubscription();
    if (
      subInfo.isActive &&
      (subInfo.tier === "pro" || subInfo.tier === "premium")
    ) {
      return NextResponse.json({
        message: "이미 프리미엄 구독 중이므로 추가 구매가 필요 없습니다.",
        access: true,
      });
    }

    // Check if already purchased
    const alreadyPurchased = await hasUserPurchased(user.id, id);
    if (alreadyPurchased) {
      return NextResponse.json({
        message: "이미 구매한 리포���입니다.",
        access: true,
      });
    }

    if (report.priceKrw <= 0) {
      return NextResponse.json(
        { error: "This report is not available for individual purchase" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const purchaseId = await createPurchase({
      userId: user.id,
      premiumReportId: id,
      amountKrw: report.priceKrw,
      tossPaymentKey: body.tossPaymentKey,
    });

    return NextResponse.json({
      message: "리포트 구매가 완료되었습니다.",
      purchaseId,
      amountKrw: report.priceKrw,
      access: true,
    });
  } catch (error) {
    console.error("Report purchase error:", error);
    return NextResponse.json(
      {
        error: "Failed to process purchase",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
