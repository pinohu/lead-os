import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import {
  getContext,
  updateContext,
  deleteContext,
  type LeadContextUpdate,
} from "@/lib/context-engine";
import { getClientIp } from "@/lib/request-utils";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leadKey: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { leadKey } = await params;

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`context-get:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      { status: 429, headers: { ...headers, "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const ctx = await getContext(leadKey);
    if (!ctx) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Lead context "${leadKey}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: ctx, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[context-leadKey]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to retrieve context" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leadKey: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { leadKey } = await params;

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`context-update:${ip}`);
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

    const updated = updateContext(leadKey, body as LeadContextUpdate);
    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Lead context "${leadKey}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: updated, error: null, meta: { updatedAt: updated.updatedAt } },
      { headers },
    );
  } catch (err) {
    console.error("[context-leadKey]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to update context" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ leadKey: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { leadKey } = await params;

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`context-delete:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      { status: 429, headers: { ...headers, "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) } },
    );
  }

  const deleted = deleteContext(leadKey);
  if (!deleted) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Lead context "${leadKey}" not found` }, meta: null },
      { status: 404, headers },
    );
  }

  return new NextResponse(null, { status: 204, headers });
}
