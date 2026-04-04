import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/subscription";
import { getPremiumReportById, hasUserPurchased } from "@/lib/pipeline/premium-reports";

/**
 * GET /api/pipeline/premium-reports/[id]
 * Get a specific premium report. Full content requires Premium subscription or purchase.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await getPremiumReportById(id);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check user auth and access
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const subInfo = await getUserSubscription();
    const isPremium =
      subInfo.isActive &&
      (subInfo.tier === "pro" || subInfo.tier === "premium");

    // Check if user has purchased this specific report
    const purchased =
      user && report.priceKrw > 0
        ? await hasUserPurchased(user.id, report.id)
        : false;

    const hasAccess = isPremium || purchased;

    if (!hasAccess) {
      // Return metadata + summary only
      return NextResponse.json({
        report: {
          id: report.id,
          reportPeriod: report.reportPeriod,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          sector: report.sector,
          title: report.title,
          summary: report.summary,
          priceKrw: report.priceKrw,
          createdAt: report.createdAt,
          // Content preview only
          headline: report.content.headline,
          keyTakeaways: report.content.keyTakeaways.slice(0, 2),
        },
        access: false,
        reason: "premium_required",
      });
    }

    // Full access
    return NextResponse.json({
      report,
      access: true,
    });
  } catch (error) {
    console.error("Premium report fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch report",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
