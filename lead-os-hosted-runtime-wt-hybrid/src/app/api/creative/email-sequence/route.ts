import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getContext } from "@/lib/context-engine";
import { getNiche } from "@/lib/catalog";
import { generateDynamicEmailSequence } from "@/lib/weaponized-creative";

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
    const stages = Array.isArray(body.stages) ? body.stages : undefined;
    const sequence = generateDynamicEmailSequence(leadContext, nicheConfig, stages);

    return NextResponse.json(
      { data: sequence, error: null, meta: { leadKey: body.leadKey, emailCount: sequence.length } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate email sequence" }, meta: null },
      { status: 500, headers },
    );
  }
}
