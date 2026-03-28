import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import { validateSafe } from "@/lib/canonical-schema";
import { storeCredential, listCredentials } from "@/lib/credentials-vault";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

const StoreCredentialSchema = z.object({
  tenantId: z.string().min(1).max(100),
  provider: z.string().min(1).max(100),
  credentialType: z.enum(["api-key", "oauth-token", "webhook-url", "login"]),
  credentials: z.record(z.string(), z.string()),
});

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`credentials:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateResult.resetAt),
        },
      },
    );
  }

  try {
    const body = await request.json();
    const validation = validateSafe(StoreCredentialSchema, body);
    if (!validation.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: validation.errors }, meta: null },
        { status: 422, headers },
      );
    }

    const { tenantId, provider, credentialType, credentials } = validation.data!;
    const result = storeCredential(tenantId, provider, credentialType, credentials);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const status = err instanceof Error && err.message.includes("Unknown provider") ? 400 : 500;
    return NextResponse.json(
      { data: null, error: { code: "STORE_FAILED", message: err instanceof Error ? err.message : "Failed to store credential" }, meta: null },
      { status, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
      { status: 400, headers },
    );
  }

  const credentials = listCredentials(tenantId);
  return NextResponse.json(
    { data: credentials, error: null, meta: { total: credentials.length } },
    { headers },
  );
}
