import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  generatePriceTiers,
  calculateBundlePrice,
  ALL_NICHES,
  type Niche,
} from "@/lib/offer-engine";
import { z } from "zod";

const MAX_STRING_LENGTH = 500;
const MAX_BUNDLE_ITEMS = 10;

const PricingTiersSchema = z.object({
  mode: z.literal("tiers"),
  niche: z.string().min(1).max(100),
  service: z.string().min(1).max(MAX_STRING_LENGTH),
});

const PricingBundleSchema = z.object({
  mode: z.literal("bundle"),
  items: z.array(z.object({
    name: z.string().min(1).max(MAX_STRING_LENGTH),
    price: z.number().positive().finite(),
  })).min(1).max(MAX_BUNDLE_ITEMS),
  discountStrategy: z.enum(["percentage", "fixed", "tiered"]).optional(),
});

const PricingSchema = z.discriminatedUnion("mode", [PricingTiersSchema, PricingBundleSchema]);

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

    const validation = PricingSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }
    const body = validation.data;

    if (body.mode === "tiers") {
      if (!ALL_NICHES.includes(body.niche as Niche)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `niche must be one of: ${ALL_NICHES.join(", ")}` }, meta: null },
          { status: 400, headers },
        );
      }

      const tiers = generatePriceTiers(body.service, body.niche as Niche);
      return NextResponse.json(
        { data: { tiers }, error: null, meta: { generatedAt: new Date().toISOString() } },
        { headers },
      );
    }

    // mode === "bundle"
    const discountStrategy = body.discountStrategy ?? "tiered";
    const bundle = calculateBundlePrice(body.items, discountStrategy);
    return NextResponse.json(
      { data: { bundle }, error: null, meta: { generatedAt: new Date().toISOString() } },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "PRICING_FAILED", message: err instanceof Error ? err.message : "Pricing generation failed" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
