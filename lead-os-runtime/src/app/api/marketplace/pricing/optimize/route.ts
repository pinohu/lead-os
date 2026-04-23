import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { z } from "zod";
import { optimizeDynamicPricing } from "@/lib/marketplace-growth";

const OptimizePricingSchema = z.object({
  niche: z.string().min(1).max(100),
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

    const body = await request.json();
    const parsed = OptimizePricingSchema.safeParse(body);

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

    const result = optimizeDynamicPricing(parsed.data.niche);

    return NextResponse.json(
      {
        data: { pricing: result },
        error: null,
        meta: null,
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "OPTIMIZATION_FAILED", message: "Failed to optimize pricing" }, meta: null },
      { status: 500, headers },
    );
  }
}
