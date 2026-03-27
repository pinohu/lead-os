import { NextResponse } from "next/server";
import { runRevenuePipeline } from "@/lib/revenue-pipeline";
import { createRateLimiter } from "@/lib/rate-limiter";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimiter.check(ip).allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    const { leadData, tenantId, nicheSlug } = body as {
      leadData?: Record<string, unknown>;
      tenantId?: string;
      nicheSlug?: string;
    };

    if (!leadData || typeof leadData !== "object") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "leadData is required and must be an object" } },
        { status: 400 },
      );
    }

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "tenantId is required" } },
        { status: 400 },
      );
    }

    if (!nicheSlug || typeof nicheSlug !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "nicheSlug is required" } },
        { status: 400 },
      );
    }

    const result = await runRevenuePipeline(leadData, tenantId, nicheSlug);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: { code: "PIPELINE_ERROR", message } },
      { status: 500 },
    );
  }
}
