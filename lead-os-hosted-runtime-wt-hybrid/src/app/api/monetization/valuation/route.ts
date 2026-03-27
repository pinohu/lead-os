import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { calculateLeadValue } from "@/lib/monetization-engine";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json() as Record<string, unknown>;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be a JSON object" }, meta: null },
        { status: 400, headers },
      );
    }

    const leadId = body.leadId;
    if (typeof leadId !== "string" || leadId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const niche = body.niche;
    if (typeof niche !== "string" || niche.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const qualityScore = typeof body.qualityScore === "number" ? body.qualityScore : 50;
    const exclusivity = body.exclusivity === true;

    const valuation = calculateLeadValue(
      { id: leadId, exclusivity, location: typeof body.location === "string" ? body.location : undefined },
      niche,
      qualityScore,
    );

    return NextResponse.json(
      { data: valuation, error: null, meta: null },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to calculate lead valuation" }, meta: null },
      { status: 500, headers },
    );
  }
}
