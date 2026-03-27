import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateOffer, ALL_NICHES, type Niche, type OfferContext } from "@/lib/offer-engine";

const MAX_STRING_LENGTH = 500;

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

    if (typeof body.niche !== "string" || !ALL_NICHES.includes(body.niche as Niche)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `niche must be one of: ${ALL_NICHES.join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof body.service !== "string" || body.service.length === 0 || body.service.length > MAX_STRING_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "service is required and must be a non-empty string" }, meta: null },
        { status: 400, headers },
      );
    }

    const context: OfferContext = {};
    if (typeof body.brandName === "string" && body.brandName.length > 0) {
      context.brandName = body.brandName.slice(0, MAX_STRING_LENGTH);
    }
    if (typeof body.averageProjectValue === "number" && isFinite(body.averageProjectValue) && body.averageProjectValue > 0) {
      context.averageProjectValue = body.averageProjectValue;
    }
    if (typeof body.competitorPrice === "number" && isFinite(body.competitorPrice) && body.competitorPrice > 0) {
      context.competitorPrice = body.competitorPrice;
    }
    if (typeof body.seasonalEvent === "string") {
      context.seasonalEvent = body.seasonalEvent.slice(0, MAX_STRING_LENGTH);
    }
    if (typeof body.urgencyType === "string" && ["countdown", "limited-spots", "seasonal"].includes(body.urgencyType)) {
      context.urgencyType = body.urgencyType as OfferContext["urgencyType"];
    }
    if (typeof body.scarcityType === "string" && ["capacity", "waitlist", "exclusivity"].includes(body.scarcityType)) {
      context.scarcityType = body.scarcityType as OfferContext["scarcityType"];
    }

    const offer = generateOffer(body.niche as Niche, body.service as string, context);

    return NextResponse.json(
      {
        data: offer,
        error: null,
        meta: { generatedAt: new Date().toISOString(), niche: body.niche, service: body.service },
      },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "OFFER_GENERATION_FAILED", message: err instanceof Error ? err.message : "Offer generation failed" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
