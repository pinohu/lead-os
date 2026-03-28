import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  generateOfferVariants,
  deployOfferTest,
  getOfferEvolutionHistory,
  runOfferEvolutionCycle,
  type OfferVariant,
} from "@/lib/offer-competition";

const MAX_NICHE_LENGTH = 100;
const MAX_HEADLINE_LENGTH = 300;
const MAX_GUARANTEE_LENGTH = 200;
const MAX_BONUS_LENGTH = 200;
const MAX_BONUSES_COUNT = 10;
const VALID_URGENCY_TYPES = new Set(["scarcity", "deadline", "seasonal", "social-proof", "none"]);

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

    const body = await request.json();
    const { tenantId, niche, baseOffer, count, action } = body;

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!niche || typeof niche !== "string" || niche.length > MAX_NICHE_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche is required and must be a string" }, meta: null },
        { status: 400, headers },
      );
    }

    if (action === "evolve") {
      const result = runOfferEvolutionCycle(tenantId, niche);
      return NextResponse.json(
        { data: result, error: null, meta: null },
        { status: 200, headers },
      );
    }

    if (!baseOffer || typeof baseOffer !== "object") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "baseOffer is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!baseOffer.headline || typeof baseOffer.headline !== "string" || baseOffer.headline.length > MAX_HEADLINE_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "baseOffer.headline is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof baseOffer.price !== "number" || !isFinite(baseOffer.price) || baseOffer.price < 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "baseOffer.price must be a non-negative number" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!baseOffer.guarantee || typeof baseOffer.guarantee !== "string" || baseOffer.guarantee.length > MAX_GUARANTEE_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "baseOffer.guarantee is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!baseOffer.urgencyType || !VALID_URGENCY_TYPES.has(baseOffer.urgencyType)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "baseOffer.urgencyType must be one of: scarcity, deadline, seasonal, social-proof, none" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!Array.isArray(baseOffer.bonuses) || baseOffer.bonuses.length > MAX_BONUSES_COUNT) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "baseOffer.bonuses must be an array" }, meta: null },
        { status: 400, headers },
      );
    }

    for (const bonus of baseOffer.bonuses) {
      if (typeof bonus !== "string" || bonus.length > MAX_BONUS_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "Each bonus must be a string" }, meta: null },
          { status: 400, headers },
        );
      }
    }

    const variantCount = typeof count === "number" && isFinite(count) ? count : 4;
    const variants: OfferVariant[] = generateOfferVariants(niche, baseOffer, variantCount);
    const test = deployOfferTest(tenantId, variants);

    return NextResponse.json(
      {
        data: { test, variants },
        error: null,
        meta: { variantCount: variants.length },
      },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create offer competition" }, meta: null },
      { status: 400, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const niche = url.searchParams.get("niche");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!niche) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const history = getOfferEvolutionHistory(tenantId, niche);

    return NextResponse.json(
      {
        data: { history },
        error: null,
        meta: { generations: history.length },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch offer competition data" }, meta: null },
      { status: 500, headers },
    );
  }
}
