import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getContext, createContext } from "@/lib/context-engine";
import { getNiche } from "@/lib/catalog";
import { generateAdaptiveCreative } from "@/lib/weaponized-creative";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();

    if (!body.nicheSlug || typeof body.nicheSlug !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "nicheSlug is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.leadKey || typeof body.leadKey !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const leadContext = await getContext(body.leadKey);
    if (!leadContext) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Lead ${body.leadKey} not found` }, meta: null },
        { status: 404, headers },
      );
    }

    const nicheConfig = getNiche(body.nicheSlug);
    const creative = generateAdaptiveCreative(leadContext, nicheConfig);

    return NextResponse.json(
      { data: creative, error: null, meta: { leadKey: body.leadKey, niche: body.nicheSlug } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate adaptive creative" }, meta: null },
      { status: 500, headers },
    );
  }
}
