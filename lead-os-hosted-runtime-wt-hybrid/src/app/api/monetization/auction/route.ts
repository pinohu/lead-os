import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { auctionLead } from "@/lib/monetization-engine";

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

    const niche = typeof body.niche === "string" ? body.niche : "general";
    const reservePrice = typeof body.reservePrice === "number" ? body.reservePrice : 0;

    if (!Array.isArray(body.buyers) || body.buyers.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "buyers array is required and must not be empty" }, meta: null },
        { status: 400, headers },
      );
    }

    const buyers = (body.buyers as Record<string, unknown>[]).map((b) => ({
      buyerId: typeof b.buyerId === "string" ? b.buyerId : "",
      bidAmount: typeof b.bidAmount === "number" ? b.bidAmount : 0,
    })).filter((b) => b.buyerId.length > 0);

    const result = auctionLead({ id: leadId, niche, reservePrice }, buyers);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to auction lead" }, meta: null },
      { status: 500, headers },
    );
  }
}
