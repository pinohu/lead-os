import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  generatePriceTiers,
  calculateBundlePrice,
  ALL_NICHES,
  type Niche,
} from "@/lib/offer-engine";

const MAX_STRING_LENGTH = 500;
const MAX_BUNDLE_ITEMS = 10;

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

    const mode = body.mode;
    if (mode !== "tiers" && mode !== "bundle") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "mode must be 'tiers' or 'bundle'" }, meta: null },
        { status: 400, headers },
      );
    }

    if (mode === "tiers") {
      if (typeof body.niche !== "string" || !ALL_NICHES.includes(body.niche as Niche)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `niche must be one of: ${ALL_NICHES.join(", ")}` }, meta: null },
          { status: 400, headers },
        );
      }
      if (typeof body.service !== "string" || body.service.length === 0 || body.service.length > MAX_STRING_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "service is required" }, meta: null },
          { status: 400, headers },
        );
      }

      const tiers = generatePriceTiers(body.service as string, body.niche as Niche);
      return NextResponse.json(
        { data: { tiers }, error: null, meta: { generatedAt: new Date().toISOString() } },
        { headers },
      );
    }

    // mode === "bundle"
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_BUNDLE_ITEMS) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `items must be an array of 1-${MAX_BUNDLE_ITEMS} objects with name and price` }, meta: null },
        { status: 400, headers },
      );
    }

    const items: { name: string; price: number }[] = [];
    for (const item of body.items as unknown[]) {
      if (
        typeof item !== "object" || item === null ||
        typeof (item as Record<string, unknown>).name !== "string" ||
        typeof (item as Record<string, unknown>).price !== "number" ||
        !isFinite((item as Record<string, unknown>).price as number) ||
        ((item as Record<string, unknown>).price as number) <= 0
      ) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "Each item must have a name (string) and price (positive number)" }, meta: null },
          { status: 400, headers },
        );
      }
      items.push({
        name: ((item as Record<string, unknown>).name as string).slice(0, MAX_STRING_LENGTH),
        price: (item as Record<string, unknown>).price as number,
      });
    }

    const discountStrategy = typeof body.discountStrategy === "string" && ["percentage", "fixed", "tiered"].includes(body.discountStrategy)
      ? body.discountStrategy as "percentage" | "fixed" | "tiered"
      : "tiered";

    const bundle = calculateBundlePrice(items, discountStrategy);
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
