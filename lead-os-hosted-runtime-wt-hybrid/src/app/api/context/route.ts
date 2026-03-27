import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import {
  createContext,
  getContextsByTenant,
  type CreateContextInput,
  type ContextListFilters,
} from "@/lib/context-engine";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`context-list:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      { status: 429, headers: { ...headers, "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) } },
    );
  }

  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
      { status: 400, headers },
    );
  }

  const filters: ContextListFilters = {};
  const funnelStage = url.searchParams.get("funnelStage");
  if (funnelStage) filters.funnelStage = funnelStage;

  const currentRoute = url.searchParams.get("currentRoute");
  if (currentRoute) filters.currentRoute = currentRoute;

  const temperature = url.searchParams.get("temperature");
  if (temperature && ["cold", "warm", "hot", "burning"].includes(temperature)) {
    filters.temperature = temperature as ContextListFilters["temperature"];
  }

  const escalated = url.searchParams.get("escalated");
  if (escalated === "true") filters.escalated = true;
  if (escalated === "false") filters.escalated = false;

  const minScore = url.searchParams.get("minCompositeScore");
  if (minScore) filters.minCompositeScore = Number(minScore);

  const maxScore = url.searchParams.get("maxCompositeScore");
  if (maxScore) filters.maxCompositeScore = Number(maxScore);

  const cursor = url.searchParams.get("cursor");
  if (cursor) filters.cursor = cursor;

  const limit = url.searchParams.get("limit");
  if (limit) filters.limit = Math.min(Number(limit) || 20, 100);

  try {
    const contexts = await getContextsByTenant(tenantId, filters);
    const nextCursor = contexts.length > 0 ? contexts[contexts.length - 1].leadKey : null;

    return NextResponse.json(
      {
        data: contexts,
        error: null,
        meta: { cursor: nextCursor, hasMore: contexts.length === (filters.limit ?? 20), total: contexts.length },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to list contexts" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`context-create:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      { status: 429, headers: { ...headers, "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) } },
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

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be a JSON object" }, meta: null },
        { status: 400, headers },
      );
    }

    const { leadKey, tenantId, ...initialData } = body as { leadKey?: string; tenantId?: string } & CreateContextInput;

    if (!leadKey || typeof leadKey !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey is required", details: [{ field: "leadKey", issue: "Required" }] }, meta: null },
        { status: 400, headers },
      );
    }

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required", details: [{ field: "tenantId", issue: "Required" }] }, meta: null },
        { status: 400, headers },
      );
    }

    const ctx = createContext(leadKey, tenantId, initialData);

    return NextResponse.json(
      { data: ctx, error: null, meta: { createdAt: ctx.firstSeen } },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to create context" }, meta: null },
      { status: 500, headers },
    );
  }
}
