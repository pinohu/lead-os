import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { persistLead } from "@/lib/intake";
import { IntakePayloadSchema, validateSafe } from "@/lib/canonical-schema";
import { createRateLimiter } from "@/lib/rate-limiter";
import { resolveTenantFromRequest } from "@/lib/tenant-context";
import { getClientIp } from "@/lib/request-utils";
import { logger } from "@/lib/logger";
import { resolveEffectiveOwner } from "@/lib/ownership/ownership-enforcement";
import { sendEmailLead, sendSmsLead } from "@/lib/delivery/channels";
import { pushToSuiteDash } from "@/lib/crm/suitedash";
import { storeLead } from "@/lib/dashboard/lead-store";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    await resolveTenantFromRequest(request);

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

    const nodeId = `${body.metadata?.county}-${body.metadata?.city}-${body.niche}`;
    const owner = resolveEffectiveOwner(nodeId);

    let delivery = { delivered: false };

    if (owner) {
      const payload = { ownerId: owner.ownerId, nodeId, lead: result };

      const email = await sendEmailLead(payload);
      const sms = await sendSmsLead(payload);
      const crm = await pushToSuiteDash(payload);

      delivery = {
        delivered: true,
        channels: [email, sms, crm],
      };
    }

    const stored = storeLead({
      id: result.id || Math.random().toString(36).slice(2),
      nodeId,
      ownerId: owner?.ownerId || null,
      createdAt: new Date().toISOString(),
      payload: result,
      delivery,
    });

    return NextResponse.json({
      ...result,
      routedTo: owner?.ownerId || null,
      delivery,
      stored,
    }, { headers });

  } catch (error) {
    logger.error("POST /api/intake failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: "intake failed" }, { status: 400, headers });
  }
}
