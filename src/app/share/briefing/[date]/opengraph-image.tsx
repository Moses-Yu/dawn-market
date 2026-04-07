import { ImageResponse } from "next/og";
import { getReportsByDate } from "@/lib/pipeline/reports";

export const alt = "새벽시장 시장 브리핑";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  // Fetch report data for the specific date
  let headline = "밤사이 해외 시장 뉴스 · AI 인사이트";
  let keyTakeaways: string[] = [];
  let prediction: { direction: string; summary: string } | null = null;

  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const reports = await getReportsByDate(date);
      const dawnBriefing = reports.find((r) => r.reportType === "dawn-briefing");
      const primary = dawnBriefing || reports[0];

      if (primary) {
        headline = primary.content.headline || headline;
        keyTakeaways = primary.content.keyTakeaways?.slice(0, 3) || [];
        if (primary.content.prediction) {
          prediction = {
            direction: primary.content.prediction.direction,
            summary: primary.content.prediction.summary,
          };
        }
      }
    }
  } catch {
    // Fall back to static content
  }

  const d = new Date(date + "T00:00:00");
  const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일`;

  const directionEmoji =
    prediction?.direction === "up"
      ? "📈"
      : prediction?.direction === "down"
        ? "📉"
        : "➡️";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          fontFamily: "sans-serif",
          padding: "48px 56px",
        }}
      >
        {/* Top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background:
              "linear-gradient(90deg, #f59e0b, #eab308, #f59e0b)",
            display: "flex",
          }}
        />

        {/* Header row: badge + date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 20,
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
            }}
          >
            <span style={{ fontSize: 16, display: "flex" }}>🌅</span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#f59e0b",
                display: "flex",
              }}
            >
              DAWN MARKET
            </span>
          </div>
          <span
            style={{
              fontSize: 18,
              color: "#a0aec0",
              display: "flex",
            }}
          >
            {dateLabel} 브리핑
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
            marginBottom: 28,
            display: "flex",
            maxWidth: "95%",
          }}
        >
          {headline.length > 80 ? headline.slice(0, 80) + "..." : headline}
        </div>

        {/* Key takeaways */}
        {keyTakeaways.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {keyTakeaways.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 18,
                  color: "#cbd5e1",
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: "#f59e0b", display: "flex" }}>•</span>
                <span style={{ display: "flex" }}>
                  {item.length > 60 ? item.slice(0, 60) + "..." : item}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, display: "flex" }} />

        {/* Prediction + CTA footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {prediction && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 20,
                color: "#e2e8f0",
              }}
            >
              <span style={{ display: "flex" }}>{directionEmoji}</span>
              <span style={{ display: "flex" }}>
                {prediction.summary.length > 40
                  ? prediction.summary.slice(0, 40) + "..."
                  : prediction.summary}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 16,
              color: "#a0aec0",
            }}
          >
            <span style={{ display: "flex" }}>dawn-market.vercel.app</span>
          </div>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background:
              "linear-gradient(90deg, #f59e0b, #eab308, #f59e0b)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
