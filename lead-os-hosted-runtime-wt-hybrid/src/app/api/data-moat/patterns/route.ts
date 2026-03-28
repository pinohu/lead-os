import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { queryPatterns, recordBehaviorPattern } from "@/lib/data-moat";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const niche = url.searchParams.get("niche");
    if (!niche) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const behaviorType = url.searchParams.get("behaviorType") ?? undefined;
    const funnelStage = url.searchParams.get("funnelStage") ?? undefined;
    const minConfidenceRaw = url.searchParams.get("minConfidence");
    const minConfidence = minConfidenceRaw ? parseFloat(minConfidenceRaw) : undefined;

    const patterns = queryPatterns(niche, { behaviorType, funnelStage, minConfidence });
    return NextResponse.json({ data: patterns, error: null, meta: { count: patterns.length } }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PATTERNS_QUERY_FAILED", message: "Failed to query patterns" }, meta: null },
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
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be a JSON object" }, meta: null },
        { status: 400, headers },
      );
    }

    const { tenantId, niche, behaviorType, funnelStage, pattern, sampleSize, confidence, liftMultiplier } = body;

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (!niche || typeof niche !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (!behaviorType || typeof behaviorType !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "behaviorType is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const result = await recordBehaviorPattern(tenantId, niche, {
      behaviorType,
      funnelStage: funnelStage ?? "unknown",
      pattern: pattern ?? "",
      sampleSize: typeof sampleSize === "number" ? sampleSize : 0,
      confidence: typeof confidence === "number" ? confidence : 0,
      liftMultiplier: typeof liftMultiplier === "number" ? liftMultiplier : 1,
    });

    return NextResponse.json(
      { data: result, error: null, meta: { recordedAt: new Date().toISOString() } },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PATTERN_RECORD_FAILED", message: "Failed to record pattern" }, meta: null },
      { status: 500, headers },
    );
  }
}
