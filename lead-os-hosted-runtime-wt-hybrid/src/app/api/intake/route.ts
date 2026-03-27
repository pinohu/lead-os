import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { persistLead } from "@/lib/intake";
import { IntakePayloadSchema, validateSafe } from "@/lib/canonical-schema";
import { createRateLimiter } from "@/lib/rate-limiter";
import { enforcePlanLimits } from "@/lib/plan-enforcer";
import { resolveTenantFromRequest } from "@/lib/tenant-context";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

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

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const tenantConfig = await resolveTenantFromRequest(request);

    const ip = getClientIp(request);
    const rateResult = rateLimiter.check(`intake:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
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

    const body = await request.json();

    const validation = validateSafe(IntakePayloadSchema, body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validation.errors },
        { status: 422, headers },
      );
    }

    const planCheck = await enforcePlanLimits(tenantConfig.tenantId, "leads");
    if (!planCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Plan limit reached", reason: planCheck.reason, usage: planCheck.usage },
        { status: 403, headers },
      );
    }

    const result = await persistLead(body);
    return NextResponse.json(result, { headers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Intake failed" },
      { status: 400, headers },
    );
  }
}
