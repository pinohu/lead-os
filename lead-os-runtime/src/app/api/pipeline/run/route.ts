import { NextResponse } from "next/server";
import { runRevenuePipeline } from "@/lib/revenue-pipeline";
import { createRateLimiter } from "@/lib/rate-limiter";
import { z } from "zod";
import { getClientIp } from "@/lib/request-utils";

const PipelineRunSchema = z.object({
  leadData: z.record(z.string(), z.unknown()),
  tenantId: z.string().min(1).max(100),
  nicheSlug: z.string().min(1).max(100),
});

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

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

    const validation = PipelineRunSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422 },
      );
    }
    const validated = validation.data;

    const result = await runRevenuePipeline(validated.leadData, validated.tenantId, validated.nicheSlug);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: { code: "PIPELINE_ERROR", message } },
      { status: 500 },
    );
  }
}
