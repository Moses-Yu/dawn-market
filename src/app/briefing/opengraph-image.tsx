import { ImageResponse } from "next/og";
import { getLatestReportSet } from "@/lib/pipeline/reports";

export const alt = "새벽시장 시장 브리핑";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  let headline = "";
  let dateLabel = "";
  let keyTakeaways: string[] = [];

  try {
    const reportSet = await getLatestReportSet();
    if (reportSet) {
      const d = new Date(reportSet.date + "T00:00:00");
      dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일`;
      const dawnBriefing = reportSet.reports.find(
        (r) => r.reportType === "dawn-briefing"
      );
      const primary = dawnBriefing || reportSet.reports[0];
      if (primary) {
        headline = primary.content.headline || "";
        keyTakeaways = primary.content.keyTakeaways?.slice(0, 3) || [];
      }
    }
  } catch {
    // Fall back to static content
  }

  if (!dateLabel) {
    const today = new Date();
    dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: headline ? "48px 56px" : "0px",
          alignItems: headline ? "flex-start" : "center",
          justifyContent: headline ? "flex-start" : "center",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          fontFamily: "sans-serif",
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

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: headline ? 16 : 8,
            marginBottom: headline ? 24 : 16,
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

        {headline ? (
          <>
            {/* Date */}
            <div
              style={{
                fontSize: 18,
                color: "#a0aec0",
                marginBottom: 12,
                display: "flex",
              }}
            >
              {dateLabel} 브리핑
            </div>

            {/* Dynamic headline */}
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
              {headline.length > 80
                ? headline.slice(0, 80) + "..."
                : headline}
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
                    <span style={{ color: "#f59e0b", display: "flex" }}>
                      •
                    </span>
                    <span style={{ display: "flex" }}>
                      {item.length > 60
                        ? item.slice(0, 60) + "..."
                        : item}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1, display: "flex" }} />

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", gap: 10 }}>
                {["반도체", "조선/방산", "AI 인프라", "2차전지"].map(
                  (sector) => (
                    <div
                      key={sector}
                      style={{
                        padding: "6px 16px",
                        borderRadius: 16,
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#e2e8f0",
                        fontSize: 14,
                        display: "flex",
                      }}
                    >
                      {sector}
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Static fallback */}
            <div
              style={{
                fontSize: 36,
                fontWeight: 300,
                color: "#a0aec0",
                marginBottom: 12,
                display: "flex",
              }}
            >
              {dateLabel}
            </div>
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                display: "flex",
              }}
            >
              시장 브리핑
            </div>
            <div
              style={{
                fontSize: 22,
                color: "#a0aec0",
                marginTop: 20,
                display: "flex",
              }}
            >
              밤사이 해외 시장 뉴스 · AI 인사이트
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              {["반도체", "조선/방산", "AI 인프라", "2차전지"].map(
                (sector) => (
                  <div
                    key={sector}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 16,
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#e2e8f0",
                      fontSize: 16,
                      display: "flex",
                    }}
                  >
                    {sector}
                  </div>
                )
              )}
            </div>
          </>
        )}

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
