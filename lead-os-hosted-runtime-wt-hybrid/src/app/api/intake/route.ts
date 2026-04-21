import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { persistLead } from "@/lib/intake";
import { IntakePayloadSchema, validateSafe } from "@/lib/canonical-schema";
import { createRateLimiter } from "@/lib/rate-limiter";
import { enforcePlanLimits } from "@/lib/plan-enforcer";
import { resolveTenantFromRequest } from "@/lib/tenant-context";
import { getClientIp } from "@/lib/request-utils";
import { logger } from "@/lib/logger";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const tenantConfig = await resolveTenantFromRequest(request);

    const ip = getClientIp(request);
    const rateResult = rateLimiter.check(`intake:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "rate limited" }, { status: 429, headers });
    }

    const body = await request.json();

    const validation = validateSafe(IntakePayloadSchema, body);
    if (!validation.valid) {
      return NextResponse.json({ error: "validation failed" }, { status: 422, headers });
    }

    const result = await persistLead(body);

    // 🔥 OpenClaw Integration
    const { orchestrate } = await import("@/lib/openclaw/orchestrator");
    const { runAgent } = await import("@/lib/openclaw/agent-runner");

    const event = {
      eventType: "lead.captured",
      metadata: {
        score: result?.score || 60,
      },
    };

    const actions = await orchestrate(event);

    const agentResults = [];
    for (const agent of actions) {
      const res = await runAgent(agent, event);
      agentResults.push(res);
    }

    return NextResponse.json({
      ...result,
      openclaw: {
        actions,
        results: agentResults,
      },
    }, { headers });

  } catch (error) {
    logger.error("POST /api/intake failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: "intake failed" }, { status: 400, headers });
  }
}
