import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateOffer, ALL_NICHES, type Niche, type OfferContext } from "@/lib/offer-engine";
import { z } from "zod";

const MAX_STRING_LENGTH = 500;

const OfferGenerateSchema = z.object({
  niche: z.string().min(1).max(100),
  service: z.string().min(1).max(MAX_STRING_LENGTH),
  brandName: z.string().max(MAX_STRING_LENGTH).optional(),
  averageProjectValue: z.number().positive().optional(),
  competitorPrice: z.number().positive().optional(),
  seasonalEvent: z.string().max(MAX_STRING_LENGTH).optional(),
  urgencyType: z.enum(["countdown", "limited-spots", "seasonal"]).optional(),
  scarcityType: z.enum(["capacity", "waitlist", "exclusivity"]).optional(),
});

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

    const raw = await request.json();

    const validation = OfferGenerateSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }
    const body = validation.data;

    if (!ALL_NICHES.includes(body.niche as Niche)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `niche must be one of: ${ALL_NICHES.join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    const context: OfferContext = {};
    if (body.brandName) context.brandName = body.brandName;
    if (body.averageProjectValue) context.averageProjectValue = body.averageProjectValue;
    if (body.competitorPrice) context.competitorPrice = body.competitorPrice;
    if (body.seasonalEvent) context.seasonalEvent = body.seasonalEvent;
    if (body.urgencyType) context.urgencyType = body.urgencyType;
    if (body.scarcityType) context.scarcityType = body.scarcityType;

    const offer = generateOffer(body.niche as Niche, body.service, context);

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
