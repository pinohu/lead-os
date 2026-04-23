import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import {
  createContext,
  getContextsByTenant,
  type CreateContextInput,
  type ContextListFilters,
} from "@/lib/context-engine";
import { z } from "zod";
import { getClientIp } from "@/lib/request-utils";

const ContextCreateSchema = z.object({
  leadKey: z.string().min(1).max(200),
  tenantId: z.string().min(1).max(100),
  niche: z.string().max(200).optional(),
  email: z.string().max(254).optional(),
  phone: z.string().max(30).optional(),
  name: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
  designSpecId: z.string().max(200).optional(),
});

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

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
  } catch (err) {
    logger.error("context failed", { error: err instanceof Error ? err.message : String(err) });
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

    const raw = await request.json();

    const validation = ContextCreateSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }
    const { leadKey, tenantId, ...initialData } = validation.data;

    const ctx = createContext(leadKey, tenantId, initialData);

    return NextResponse.json(
      { data: ctx, error: null, meta: { createdAt: ctx.firstSeen } },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("context failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to create context" }, meta: null },
      { status: 500, headers },
    );
  }
}
