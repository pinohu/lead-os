import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { z } from "zod";
import { generateStrategicPlan, getStrategicDecisions } from "@/lib/strategy-engine";

const GeneratePlanSchema = z.object({
  tenantId: z.string().min(1).max(200),
  nicheRevenues: z.record(z.string(), z.number()),
  nicheConversions: z.record(z.string(), z.number()),
  channelData: z.array(z.object({
    channel: z.string().min(1),
    roi: z.number(),
    trend: z.string(),
    volume: z.number().min(0),
    cost: z.number().min(0),
  })),
  offerData: z.array(z.object({
    offer: z.string().min(1),
    revenue: z.number().min(0),
    views: z.number().min(0),
    conversions: z.number().min(0),
    cost: z.number().min(0),
  })),
  metrics: z.object({
    leadVolume: z.number().min(0),
    avgDealValue: z.number().min(0),
    buyerCount: z.number().min(0),
  }),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const decisions = getStrategicDecisions(tenantId);

    return NextResponse.json(
      {
        data: { decisions },
        error: null,
        meta: { count: decisions.length, tenantId },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch strategic plans" }, meta: null },
      { status: 500, headers },
    );
  }
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

    const body = await request.json();
    const parsed = GeneratePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const { tenantId, nicheRevenues, nicheConversions, channelData, offerData, metrics } = parsed.data;

    const plan = await generateStrategicPlan(
      tenantId,
      nicheRevenues,
      nicheConversions,
      channelData,
      offerData,
      metrics,
    );

    return NextResponse.json(
      {
        data: { plan },
        error: null,
        meta: { decisionCount: plan.decisions.length },
      },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate strategic plan" }, meta: null },
      { status: 500, headers },
    );
  }
}
