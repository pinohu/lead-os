import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") ?? "Lead OS";
  const subtitle = searchParams.get("subtitle") ?? "Autonomous lead acquisition & conversion";
  const niche = searchParams.get("niche") ?? "general";
  const accent = searchParams.get("accent") ?? "#c4632d";

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "flex-start", padding: "60px 80px",
        background: "linear-gradient(135deg, #14211d 0%, #1b4332 50%, #14211d 100%)",
        fontFamily: "sans-serif",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px",
        }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "12px",
            background: accent, display: "flex", alignItems: "center",
            justifyContent: "center", color: "white", fontWeight: 800, fontSize: "20px",
          }}>
            L
          </div>
          <span style={{ color: "#a0b0a8", fontSize: "18px", fontWeight: 600 }}>
            Lead OS
          </span>
          {niche !== "general" && (
            <span style={{
              color: accent, fontSize: "14px", fontWeight: 700,
              padding: "4px 12px", borderRadius: "999px",
              border: `1px solid ${accent}40`,
              marginLeft: "8px",
            }}>
              {niche}
            </span>
          )}
        </div>
        <h1 style={{
          color: "#f4efe5", fontSize: "52px", fontWeight: 800, lineHeight: 1.15,
          margin: 0, maxWidth: "900px",
        }}>
          {title}
        </h1>
        <p style={{
          color: "#8fa89e", fontSize: "24px", fontWeight: 400, lineHeight: 1.4,
          marginTop: "16px", maxWidth: "800px",
        }}>
          {subtitle}
        </p>
        <div style={{
          display: "flex", gap: "16px", marginTop: "32px",
        }}>
          <span style={{
            padding: "10px 24px", borderRadius: "999px",
            background: accent, color: "white", fontWeight: 700, fontSize: "16px",
          }}>
            Get Started →
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
