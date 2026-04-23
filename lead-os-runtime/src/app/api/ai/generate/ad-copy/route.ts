import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateAdCopy } from "@/lib/integrations/langchain-adapter";

const VALID_PLATFORMS = new Set(["google", "facebook", "linkedin"]);

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.niche !== "string" || body.niche.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof body.platform !== "string" || !VALID_PLATFORMS.has(body.platform)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "platform must be one of: google, facebook, linkedin" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof body.objective !== "string" || body.objective.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "objective is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const ads = await generateAdCopy(
      body.niche,
      body.platform as "google" | "facebook" | "linkedin",
      body.objective,
    );
    return NextResponse.json(
      { data: ads, error: null, meta: { platform: body.platform, count: ads.length } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate ad copy" }, meta: null },
      { status: 500, headers },
    );
  }
}
