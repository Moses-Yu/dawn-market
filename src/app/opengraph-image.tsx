import { ImageResponse } from "next/og";

export const alt = "새벽시장 - 초보 투자자를 위한 AI 시장 브리핑";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Decorative top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #f59e0b, #eab308, #f59e0b)",
            display: "flex",
          }}
        />

        {/* Dawn icon */}
        <div
          style={{
            fontSize: 72,
            marginBottom: 20,
            display: "flex",
          }}
        >
          🌅
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            display: "flex",
          }}
        >
          새벽시장
        </div>

        {/* English subtitle */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#f59e0b",
            marginTop: 8,
            letterSpacing: "0.1em",
            display: "flex",
          }}
        >
          DAWN MARKET
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "#a0aec0",
            marginTop: 24,
            display: "flex",
          }}
        >
          밤사이 해외 시장 뉴스를 AI가 매일 새벽 정리해드립니다
        </div>

        {/* Sector pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 32,
          }}
        >
          {["반도체", "방산", "AI", "2차전지", "환율"].map((sector) => (
            <div
              key={sector}
              style={{
                padding: "8px 20px",
                borderRadius: 20,
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                color: "#f59e0b",
                fontSize: 18,
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
            background: "linear-gradient(90deg, #f59e0b, #eab308, #f59e0b)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
