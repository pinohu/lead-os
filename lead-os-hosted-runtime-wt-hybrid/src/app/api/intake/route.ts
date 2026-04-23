// src/app/api/intake/route.ts
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { persistLead } from "@/lib/intake";
import { IntakePayloadSchema, validateSafe } from "@/lib/canonical-schema";
import { createRateLimiter } from "@/lib/rate-limiter";
import { enforcePlanLimits } from "@/lib/plan-enforcer";
import { resolveTenantFromRequest } from "@/lib/tenant-context";
import { requireSafePublicExecution } from "@/lib/api/cron-public-guards";
import { getBillingGateState } from "@/lib/billing/entitlements";
import { getIntakeIdempotentResponse, setIntakeIdempotentResponse } from "@/lib/intake-idempotency-cache";
import { runDirectoryLeadFlow, shouldRunDirectoryLeadFlow } from "@/lib/erie/directory-lead-flow";
import { getClientIp } from "@/lib/request-utils";
import { logger } from "@/lib/logger";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

function hashPayloadJson(obj: unknown): string {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const tenantConfig = await resolveTenantFromRequest(request);
    const publicBlock = requireSafePublicExecution({
      resolvedTenantId: tenantConfig.tenantId,
      pathname: "/api/intake",
      method: "POST",
    });
    if (publicBlock) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") publicBlock.headers.set(k, v);
      }
      return publicBlock;
    }

    const ip = getClientIp(request);
    const rateResult = rateLimiter.check(`intake:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { data: null, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
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
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: validation.errors } },
        { status: 422, headers },
      );
    }

    if (body.tenantId && String(body.tenantId).toLowerCase() !== tenantConfig.tenantId.toLowerCase()) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "TENANT_MISMATCH",
            message: "Body tenantId does not match resolved tenant for this request",
          },
        },
        { status: 422, headers },
      );
    }

    const idemHeader =
      request.headers.get("Idempotency-Key")?.trim() || request.headers.get("idempotency-key")?.trim() || "";
    const idempotencyFingerprint = hashPayloadJson({
      t: tenantConfig.tenantId,
      s: body.source,
      e: body.email ?? null,
      p: body.phone ?? null,
      c: body.category ?? null,
      f: body.firstName ?? null,
      l: body.lastName ?? null,
      m: body.message ?? null,
    });
    if (idemHeader) {
      const idemKey = `${tenantConfig.tenantId}:${idemHeader}:${idempotencyFingerprint}`;
      const cached = getIntakeIdempotentResponse(idemKey);
      if (cached) {
        return new NextResponse(cached, {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json", "X-Idempotency-Replayed": "true" },
        });
      }
    }

    const planCheck = await enforcePlanLimits(tenantConfig.tenantId, "leads");
    if (!planCheck.allowed) {
      return NextResponse.json(
        { data: null, error: { code: "PLAN_LIMIT", message: "Plan limit reached", reason: planCheck.reason, usage: planCheck.usage } },
        { status: 403, headers },
      );
    }

    if (process.env.LEAD_OS_BILLING_ENFORCE === "true") {
      const billing = await getBillingGateState(tenantConfig.tenantId);
      if (!billing.subscriptionActive) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: "BILLING_BLOCKED",
              message: "Subscription inactive or missing for this tenant",
              blockReason: "subscription_inactive",
            },
          },
          { status: 402, headers },
        );
      }
    }

    try {
      const { detectIngressChannel, resolveIngressDecision } = await import("@/lib/ingress-engine");
      const channel = detectIngressChannel(
        body.source || "direct",
        request.headers.get("referer") || undefined,
        body.utm_source,
        body.utm_medium,
      );
      const ingressDecision = resolveIngressDecision(channel, tenantConfig.tenantId);
      body.ingress_channel = ingressDecision.channel;
      body.ingress_intent = ingressDecision.intentLevel;
      body.ingress_funnel = ingressDecision.funnelType;
    } catch (err) {
      logger.warn("Ingress enrichment skipped", { error: err instanceof Error ? err.message : String(err) });
    }

    if (body.category && !body.niche) {
      body.niche = body.category;
    }
    const baseMeta =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {};
    body.metadata = {
      ...baseMeta,
      ...(body.category ? { directoryCategory: body.category } : {}),
    };

    const result = await persistLead(body, tenantConfig);

    let directory: Awaited<ReturnType<typeof runDirectoryLeadFlow>> | undefined;
    if (shouldRunDirectoryLeadFlow(tenantConfig.tenantId) && typeof body.category === "string" && body.category.trim()) {
      directory = await runDirectoryLeadFlow({
        tenantId: tenantConfig.tenantId,
        leadKey: result.leadKey,
        category: body.category.trim(),
        trace: result.trace,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        description: body.message,
      });
    }

    const payloadOut = { ...result, directory };
    const jsonOut = JSON.stringify(payloadOut);

    if (idemHeader) {
      const idemKey = `${tenantConfig.tenantId}:${idemHeader}:${idempotencyFingerprint}`;
      setIntakeIdempotentResponse(idemKey, jsonOut);
    }

    logger.info("intake.persisted", {
      tenantId: tenantConfig.tenantId,
      leadKey: result.leadKey,
      existing: result.existing,
      dryRun: Boolean(body.dryRun),
      source: body.source,
      directory: directory?.ran ?? false,
    });

    return NextResponse.json(payloadOut, { headers });
  } catch (error) {
    logger.error("POST /api/intake failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { data: null, error: { code: "INTAKE_FAILED", message: error instanceof Error ? error.message : "Intake failed" } },
      { status: 400, headers },
    );
  }
}
