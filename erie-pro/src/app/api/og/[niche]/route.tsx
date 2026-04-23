// ── OG Image Generation ───────────────────────────────────────────
// Generates 1200x630 social sharing images per niche landing page.
// GET /api/og/{niche}

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getNicheBySlug } from "@/lib/niches";
import { cityConfig } from "@/lib/city-config";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ niche: string }> }
) {
  const { niche: nicheSlug } = await params;
  const niche = getNicheBySlug(nicheSlug);

  const nicheLabel = niche?.label ?? nicheSlug;
  const nicheIcon = niche?.icon ?? "🏠";

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
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top: badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "9999px",
              padding: "8px 20px",
              fontSize: "24px",
            }}
          >
            {nicheIcon} {nicheLabel}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "9999px",
              padding: "8px 20px",
              fontSize: "20px",
            }}
          >
            📍 {cityConfig.name}, {cityConfig.stateCode}
          </div>
        </div>

        {/* Center: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: "1000px",
            }}
          >
            Find the best {nicheLabel.toLowerCase()} in {cityConfig.name},{" "}
            {cityConfig.state}
          </div>
          <div style={{ fontSize: "26px", opacity: 0.8 }}>
            Compare top-rated providers, read reviews &amp; get free quotes
          </div>
        </div>

        {/* Bottom: branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: 700, opacity: 0.9 }}>
            {cityConfig.domain}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "12px",
              padding: "10px 24px",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            Get a Free Quote →
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
