import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import {
  loadNicheConfig,
  updateNicheConfig,
  deleteNicheConfig,
} from "@/lib/niche-adapter";
import { getClientIp } from "@/lib/request-utils";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { slug } = await params;

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`niche-get:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      { status: 429, headers: { ...headers, "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) } },
    );
  }

  const config = loadNicheConfig(slug);
  if (!config) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Niche config "${slug}" not found` }, meta: null },
      { status: 404, headers },
    );
  }

  return NextResponse.json(
    { data: config, error: null, meta: null },
    { headers },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { slug } = await params;

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`niche-update:${ip}`);
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

    const updated = updateNicheConfig(slug, body as Record<string, unknown>);
    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Niche config "${slug}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[niche-config-slug]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to update niche config" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { slug } = await params;

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`niche-delete:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      { status: 429, headers: { ...headers, "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) } },
    );
  }

  const deleted = deleteNicheConfig(slug);
  if (!deleted) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Niche config "${slug}" not found` }, meta: null },
      { status: 404, headers },
    );
  }

  return new NextResponse(null, { status: 204, headers });
}
