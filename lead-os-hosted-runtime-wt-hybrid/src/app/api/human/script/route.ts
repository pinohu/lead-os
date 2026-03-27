import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getContext } from "@/lib/context-engine";
import { getNiche } from "@/lib/catalog";
import { generateCallScript } from "@/lib/human-amplification";

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

    if (!body.leadKey || typeof body.leadKey !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.nicheSlug || typeof body.nicheSlug !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "nicheSlug is required" }, meta: null },
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
    const script = generateCallScript(leadContext, nicheConfig);

    return NextResponse.json(
      { data: script, error: null, meta: { leadKey: body.leadKey } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SCRIPT_FAILED", message: "Failed to generate call script" }, meta: null },
      { status: 500, headers },
    );
  }
}
