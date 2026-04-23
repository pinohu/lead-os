import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateLandingPageCopy } from "@/lib/integrations/langchain-adapter";

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

    if (typeof body.service !== "string" || body.service.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "service is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof body.targetAudience !== "string" || body.targetAudience.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "targetAudience is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const copy = await generateLandingPageCopy(body.niche, body.service, body.targetAudience);
    return NextResponse.json(
      { data: copy, error: null, meta: { niche: body.niche } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate landing page copy" }, meta: null },
      { status: 500, headers },
    );
  }
}
