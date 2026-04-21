import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { persistLead } from "@/lib/intake";
import { IntakePayloadSchema, validateSafe } from "@/lib/canonical-schema";
import { createRateLimiter } from "@/lib/rate-limiter";
import { enforcePlanLimits } from "@/lib/plan-enforcer";
import { resolveTenantFromRequest } from "@/lib/tenant-context";
import { getClientIp } from "@/lib/request-utils";
import { logger } from "@/lib/logger";
import { orchestrate } from "@/lib/openclaw/orchestrator";
import { runAgent } from "@/lib/openclaw/agent-runner";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const tenantConfig = await resolveTenantFromRequest(request);

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

    const planCheck = await enforcePlanLimits(tenantConfig.tenantId, "leads");
    if (!planCheck.allowed) {
      return NextResponse.json(
        { data: null, error: { code: "PLAN_LIMIT", message: "Plan limit reached", reason: planCheck.reason, usage: planCheck.usage } },
        { status: 403, headers },
      );
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

    const result = await persistLead(body);

    try {
      const openClawEvent = {
        eventType: "lead.captured",
        leadKey: result.leadKey,
        trace: result.trace,
        metadata: {
          score: result.score,
          stage: result.stage,
          hot: result.hot,
          family: result.decision.family,
          source: body.source,
          email: result.record.email,
          phone: result.record.phone,
        },
      };

      const actions = await orchestrate(openClawEvent);
      const agentResults = await Promise.all(actions.map((agent) => runAgent(agent, openClawEvent)));
      return NextResponse.json({ ...result, openclaw: { actions, agentResults } }, { headers });
    } catch (err) {
      logger.warn("OpenClaw orchestration skipped", { error: err instanceof Error ? err.message : String(err) });
      return NextResponse.json(result, { headers });
    }
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
