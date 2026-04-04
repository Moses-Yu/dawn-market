import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/subscription";
import { getPremiumReportById, hasUserPurchased } from "@/lib/pipeline/premium-reports";
import { renderPremiumReportPDF } from "@/lib/pipeline/premium-reports/pdf-renderer";
import { SECTOR_TITLES } from "@/lib/pipeline/premium-reports/types";

/**
 * GET /api/pipeline/premium-reports/[id]/pdf
 * Download a premium report as PDF. Requires Premium subscription or purchase.
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

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subInfo = await getUserSubscription();
    const isPremium =
      subInfo.isActive &&
      (subInfo.tier === "pro" || subInfo.tier === "premium");

    const purchased =
      report.priceKrw > 0
        ? await hasUserPurchased(user.id, report.id)
        : false;

    if (!isPremium && !purchased) {
      return NextResponse.json(
        {
          error: "Premium subscription or report purchase required",
          priceKrw: report.priceKrw,
        },
        { status: 403 }
      );
    }

    // Generate PDF
    const periodLabel = report.reportPeriod === "weekly" ? "주간" : "월간";
    const pdfBuffer = await renderPremiumReportPDF({
      title: report.title,
      periodLabel,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      sector: SECTOR_TITLES[report.sector] || report.sector,
      content: report.content,
    });

    const filename = `dawn-market-${report.reportPeriod}-${report.sector}-${report.periodStart}.pdf`;

    const uint8 = new Uint8Array(pdfBuffer);
    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
