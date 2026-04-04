import { ImageResponse } from "next/og";

export const alt = "새벽시장 시장 브리핑";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
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

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            padding: "8px 20px",
            borderRadius: 24,
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          <span style={{ fontSize: 20, display: "flex" }}>🌅</span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#f59e0b",
              display: "flex",
            }}
          >
            DAWN MARKET
          </span>
        </div>

        {/* Date */}
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

        {/* Title */}
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

        {/* Subtitle */}
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

        {/* Sector pills */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 28,
          }}
        >
          {["반도체", "조선/방산", "AI 인프라", "2차전지"].map((sector) => (
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
          ))}
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
