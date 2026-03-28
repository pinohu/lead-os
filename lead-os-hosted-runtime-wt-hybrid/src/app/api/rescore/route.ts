import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import { rescoreLead } from "@/lib/rescore-engine";
import { z } from "zod";
import { getClientIp } from "@/lib/request-utils";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

const RescoreSchema = z.object({
  leadKey: z.string().min(1).max(200),
  eventType: z.enum([
    "email-open",
    "email-click",
    "page-view",
    "return-visit",
    "form-submit",
    "chat-message",
    "assessment-complete",
    "booking-request",
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`rescore:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      { status: 429, headers },
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const raw = await request.json();

    const validation = RescoreSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }
    const { leadKey, eventType, metadata } = validation.data;

    const result = await rescoreLead(leadKey, { type: eventType, metadata });

    if (!result) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Lead context not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: result, error: null, meta: { rescoredAt: new Date().toISOString() } },
      { headers },
    );
  } catch (err) {
    console.error("[rescore]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "RESCORE_FAILED", message: "Failed to rescore lead" }, meta: null },
      { status: 500, headers },
    );
  }
}
