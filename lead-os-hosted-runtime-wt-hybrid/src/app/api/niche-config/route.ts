import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import {
  listNicheConfigs,
  createNicheConfig,
  type NicheConfig,
  type NicheListFilters,
} from "@/lib/niche-adapter";
import { getClientIp } from "@/lib/request-utils";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`niche-list:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      { status: 429, headers: { ...headers, "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) } },
    );
  }

  const url = new URL(request.url);
  const filters: NicheListFilters = {};

  const industry = url.searchParams.get("industry");
  if (industry) filters.industry = industry;

  const cursor = url.searchParams.get("cursor");
  if (cursor) filters.cursor = cursor;

  const limit = url.searchParams.get("limit");
  if (limit) filters.limit = Math.min(Number(limit) || 20, 100);

  const configs = listNicheConfigs(filters);
  const nextCursor = configs.length > 0 ? configs[configs.length - 1].slug : null;

  return NextResponse.json(
    {
      data: configs,
      error: null,
      meta: { cursor: nextCursor, hasMore: configs.length === (filters.limit ?? 20), total: configs.length },
    },
    { headers },
  );
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`niche-create:${ip}`);
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

    const { config: created, errors } = createNicheConfig(body as NicheConfig);

    if (errors.length > 0) {
      const isConflict = errors.some((e) => e.includes("already exists"));
      return NextResponse.json(
        {
          data: null,
          error: {
            code: isConflict ? "CONFLICT" : "VALIDATION_ERROR",
            message: errors.join("; "),
            details: errors.map((e) => ({ issue: e })),
          },
          meta: null,
        },
        { status: isConflict ? 409 : 400, headers },
      );
    }

    return NextResponse.json(
      { data: created, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[niche-config]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to create niche config" }, meta: null },
      { status: 500, headers },
    );
  }
}
