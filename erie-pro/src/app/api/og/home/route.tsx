import { ImageResponse } from "next/og"
import { cityConfig } from "@/lib/city-config"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 45%, #1e1b4b 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.9 }}>{cityConfig.domain}</div>
        <div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
            One vetted {cityConfig.name} pro.
          </div>
          <div style={{ fontSize: 40, marginTop: 16, opacity: 0.95 }}>
            Free match in under 4 hours.
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.85 }}>
          Erie County - No bidding wars - No spam calls
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
