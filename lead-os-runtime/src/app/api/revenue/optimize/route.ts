import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  estimatePriceElasticity,
  generateUpsellSequence,
  calculateLTV,
  type HistoricalPricePoint,
  type RevenueHistoryEntry,
} from "@/lib/revenue-engine";
import { z } from "zod";

const PriceElasticitySchema = z.object({
  action: z.literal("price-elasticity"),
  niche: z.string().min(1).max(100),
  currentPrice: z.number().positive(),
  conversionRate: z.number().min(0),
  historicalData: z.array(z.object({
    price: z.number().positive(),
    conversionRate: z.number().min(0),
    period: z.string(),
  })).optional().default([]),
});

const UpsellSchema = z.object({
  action: z.literal("upsell-sequence"),
  niche: z.string().min(1).max(100),
  primaryOffer: z.string().min(1),
  leadScore: z.number().min(0).max(100),
});

const LTVSchema = z.object({
  action: z.literal("ltv"),
  leadId: z.string().min(1),
  leadScore: z.number().min(0).max(100),
  niche: z.string().min(1).max(100),
  revenueHistory: z.array(z.object({
    amount: z.number(),
    type: z.enum(["initial", "upsell", "renewal", "referral"]),
    date: z.string(),
  })).optional().default([]),
});

const OptimizeRequestSchema = z.discriminatedUnion("action", [
  PriceElasticitySchema,
  UpsellSchema,
  LTVSchema,
]);

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();
    const parsed = OptimizeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const data = parsed.data;

    if (data.action === "price-elasticity") {
      const result = estimatePriceElasticity(
        data.niche,
        data.currentPrice,
        data.conversionRate,
        data.historicalData,
      );
      return NextResponse.json(
        { data: result, error: null, meta: { action: data.action } },
        { status: 200, headers },
      );
    }

    if (data.action === "upsell-sequence") {
      const result = generateUpsellSequence(data.niche, data.primaryOffer, data.leadScore);
      return NextResponse.json(
        { data: result, error: null, meta: { action: data.action } },
        { status: 200, headers },
      );
    }

    if (data.action === "ltv") {
      const result = calculateLTV(
        { leadId: data.leadId, score: data.leadScore },
        data.niche,
        data.revenueHistory,
      );
      return NextResponse.json(
        { data: result, error: null, meta: { action: data.action } },
        { status: 200, headers },
      );
    }

    return NextResponse.json(
      {
        data: null,
        error: { code: "UNKNOWN_ACTION", message: "Unknown action" },
        meta: null,
      },
      { status: 400, headers },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
