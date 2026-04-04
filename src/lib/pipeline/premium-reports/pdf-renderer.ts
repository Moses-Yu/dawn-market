import PDFDocument from "pdfkit";
import type { PremiumReportContent } from "./types";

interface RenderPDFOptions {
  title: string;
  periodLabel: string; // "주간" | "월간"
  periodStart: string;
  periodEnd: string;
  sector: string;
  content: PremiumReportContent;
}

/**
 * Render a premium report to a PDF buffer.
 *
 * Uses pdfkit with the built-in Helvetica font for structure,
 * supplemented by Unicode-compatible rendering for Korean text.
 * For production use with full Korean typography, embed a Korean
 * font file (e.g., NanumGothic.ttf) via registerFont().
 */
export async function renderPremiumReportPDF(
  opts: RenderPDFOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      info: {
        Title: opts.title,
        Author: "새벽시장 Dawn Market",
        Subject: `${opts.periodLabel} ${opts.sector} 리포트`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Try to register a Korean font if available
    let fontName = "Helvetica";
    try {
      // Common Korean font paths on various systems
      const fontPaths = [
        "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
        "/usr/share/fonts/nanum/NanumGothic.ttf",
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
      ];
      for (const fp of fontPaths) {
        try {
          doc.registerFont("Korean", fp);
          fontName = "Korean";
          break;
        } catch {
          // try next
        }
      }
    } catch {
      // fallback to Helvetica
    }

    // --- Header ---
    doc.fontSize(10).font(fontName).fillColor("#666");
    doc.text(
      `Dawn Market | ${opts.periodLabel} Report | ${opts.periodStart} ~ ${opts.periodEnd}`,
      { align: "center" }
    );
    doc.moveDown(0.5);

    // Divider
    doc
      .strokeColor("#2563EB")
      .lineWidth(2)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + pageWidth, doc.y)
      .stroke();
    doc.moveDown(1);

    // --- Headline ---
    doc.fontSize(20).font(fontName).fillColor("#1a1a1a");
    doc.text(opts.content.headline, { align: "center" });
    doc.moveDown(1);

    // --- Executive Summary ---
    doc.fontSize(12).fillColor("#2563EB").font(fontName);
    doc.text("Executive Summary");
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#333").font(fontName);
    doc.text(opts.content.executiveSummary, { lineGap: 4 });
    doc.moveDown(1);

    // --- Sections ---
    for (const section of opts.content.sections) {
      // Check if we need a new page
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      }

      doc.fontSize(14).fillColor("#1a1a1a").font(fontName);
      doc.text(section.title);
      doc.moveDown(0.3);

      doc.fontSize(10).fillColor("#444").font(fontName);
      doc.text(section.body, { lineGap: 3 });

      // Data points table
      if (section.dataPoints && section.dataPoints.length > 0) {
        doc.moveDown(0.5);
        for (const dp of section.dataPoints) {
          const changeText = dp.change ? ` (${dp.change})` : "";
          doc.fontSize(9).fillColor("#555").font(fontName);
          doc.text(`  ${dp.label}: ${dp.value}${changeText}`);
        }
      }

      doc.moveDown(0.8);
    }

    // --- Weekly Trends ---
    if (doc.y > doc.page.height - 200) doc.addPage();
    doc.fontSize(14).fillColor("#1a1a1a").font(fontName);
    doc.text("Trends");
    doc.moveDown(0.3);

    for (const trend of opts.content.weeklyTrends) {
      const arrow =
        trend.direction === "up"
          ? "[UP]"
          : trend.direction === "down"
            ? "[DOWN]"
            : "[--]";
      doc.fontSize(10).fillColor("#444").font(fontName);
      doc.text(`${arrow} ${trend.label}: ${trend.detail}`, { lineGap: 2 });
    }
    doc.moveDown(1);

    // --- Outlook ---
    if (doc.y > doc.page.height - 200) doc.addPage();
    doc.fontSize(14).fillColor("#1a1a1a").font(fontName);
    doc.text("Outlook");
    doc.moveDown(0.3);

    doc.fontSize(11).fillColor("#2563EB").font(fontName);
    doc.text("Short-term (1-2 weeks)");
    doc.fontSize(10).fillColor("#444").font(fontName);
    doc.text(opts.content.outlook.shortTerm, { lineGap: 3 });
    doc.moveDown(0.5);

    doc.fontSize(11).fillColor("#2563EB").font(fontName);
    doc.text("Medium-term (1-3 months)");
    doc.fontSize(10).fillColor("#444").font(fontName);
    doc.text(opts.content.outlook.mediumTerm, { lineGap: 3 });
    doc.moveDown(0.5);

    if (opts.content.outlook.risks.length > 0) {
      doc.fontSize(11).fillColor("#DC2626").font(fontName);
      doc.text("Risks");
      doc.fontSize(10).fillColor("#444").font(fontName);
      for (const risk of opts.content.outlook.risks) {
        doc.text(`  - ${risk}`, { lineGap: 2 });
      }
      doc.moveDown(0.3);
    }

    if (opts.content.outlook.opportunities.length > 0) {
      doc.fontSize(11).fillColor("#16A34A").font(fontName);
      doc.text("Opportunities");
      doc.fontSize(10).fillColor("#444").font(fontName);
      for (const opp of opts.content.outlook.opportunities) {
        doc.text(`  - ${opp}`, { lineGap: 2 });
      }
    }
    doc.moveDown(1);

    // --- Key Takeaways ---
    if (doc.y > doc.page.height - 150) doc.addPage();
    doc.fontSize(14).fillColor("#1a1a1a").font(fontName);
    doc.text("Key Takeaways");
    doc.moveDown(0.3);

    for (let i = 0; i < opts.content.keyTakeaways.length; i++) {
      doc.fontSize(10).fillColor("#333").font(fontName);
      doc.text(`${i + 1}. ${opts.content.keyTakeaways[i]}`, { lineGap: 3 });
    }
    doc.moveDown(1);

    // --- Footer ---
    doc
      .strokeColor("#ccc")
      .lineWidth(0.5)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + pageWidth, doc.y)
      .stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor("#999").font(fontName);
    doc.text(
      "This report is for informational purposes only. Not financial advice. Dawn Market (새벽시장)",
      { align: "center" }
    );

    doc.end();
  });
}
