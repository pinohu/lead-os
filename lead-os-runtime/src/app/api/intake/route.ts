import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { query, queryPostgres } from "@/lib/db"
import { logger } from "@/lib/logger"
import { intakeSchema } from "@/lib/validate"
import {
  lookupIntakeIdempotency,
  storeIntakeIdempotency,
} from "@/lib/intake-idempotency-cache"
import { getTenantIdFromRequest, resolveTenantFromRequest } from "@/lib/tenant-context"
import { requireSafePublicExecution } from "@/lib/api/cron-public-guards"
import { detectIngressChannel, recordIngressEvent, resolveIngressDecision } from "@/lib/ingress-engine"
import { appendEvents, getProviderExecutions, getWorkflowRuns, recordProviderExecution, recordWorkflowRun } from "@/lib/runtime-store"
import { createCanonicalEvent, ensureTraceContext } from "@/lib/trace"

function hashPayload(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body ?? {})).digest("hex")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const requestedTenantId = getTenantIdFromRequest(request)
    const tenant = await resolveTenantFromRequest(request)
    if (requestedTenantId && requestedTenantId !== tenant.tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: "tenant_mismatch",
        },
        { status: 403 },
      )
    }
    const publicGuard = requireSafePublicExecution({
      resolvedTenantId: tenant.tenantId,
      pathname: "/api/intake",
      method: "POST",
    })
    if (publicGuard) return publicGuard
    const idempotencyKey =
      request.headers.get("idempotency-key")?.trim() ||
      request.headers.get("Idempotency-Key")?.trim() ||
      ""

    const payloadHash = hashPayload(body)
    const scopedIdempotencyKey = idempotencyKey
      ? `${tenant.tenantId}:${idempotencyKey}`
      : ""
    if (scopedIdempotencyKey) {
      const existing = lookupIntakeIdempotency(scopedIdempotencyKey, payloadHash)
      if (existing.kind === "mismatch") {
        return NextResponse.json(
          {
            success: false,
            error: "idempotency_key_reuse_with_different_body",
          },
          { status: 409 },
        )
      }
      if (existing.kind === "hit") {
        return new NextResponse(existing.responseJson, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Replayed": "true",
          },
        })
      }
    }

    const parsed = intakeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { email, firstName, message } = parsed.data

    const channel = detectIngressChannel(
      parsed.data.firstName ? "contact_form" : "manual",
      request.headers.get("referer") ?? undefined,
      undefined,
      undefined,
    )
    const ingress = resolveIngressDecision(channel, tenant.tenantId)
    const result = await query<{ id: number }>(
      "INSERT INTO leads (email, name, message, tenant_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [email, firstName ?? null, message, tenant.tenantId],
    )

    const id = result.rows[0]?.id
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Failed to create lead" },
        { status: 500 },
      )
    }

    const leadKey = `email:${email.toLowerCase()}`
    const trace = ensureTraceContext({
      leadKey,
      tenant: tenant.tenantId,
      source: "contact_form",
      service: tenant.defaultService,
      niche: tenant.defaultNiche,
      email,
      blueprintId: "intake",
      stepId: "captured",
    })

    await appendEvents([
      createCanonicalEvent(trace, "lead_captured", "web", "CAPTURED", {
        leadId: id,
        source: "contact_form",
        ingressChannel: ingress.channel,
        ingressIntent: ingress.intentLevel,
      }),
      createCanonicalEvent(trace, "lead_routed", "internal", "ROUTED", {
        funnelType: ingress.funnelType,
        scoreBoost: ingress.scoreBoost,
      }),
    ])

    await Promise.all([
      recordProviderExecution({
        leadKey,
        provider: "internal-runtime",
        kind: "delivery",
        ok: true,
        mode: "prepared",
        detail: "delivery_logs recorded",
        payload: {
          ingress,
        },
      }),
      recordWorkflowRun({
        leadKey,
        eventName: "lead.assignment.created",
        provider: "internal-runtime",
        ok: true,
        mode: "prepared",
        detail: "lead_assignments recorded",
        payload: {
          routing: ingress,
        },
      }),
      recordIngressEvent(tenant.tenantId, ingress.channel, leadKey, ingress.scoreBoost, false, 0),
    ])

    const assignments = await getWorkflowRuns(leadKey)
    const deliveryLogs = await getProviderExecutions(leadKey)
    const responseBody = {
      success: true,
      id,
      leadKey,
      tenantId: tenant.tenantId,
      routing: {
        channel: ingress.channel,
        intentLevel: ingress.intentLevel,
        funnelType: ingress.funnelType,
        scoreBoost: ingress.scoreBoost,
      },
      assignment: assignments[0] ?? null,
      deliveryLog: deliveryLogs[0] ?? null,
    }
    if (scopedIdempotencyKey) {
      storeIntakeIdempotency(
        scopedIdempotencyKey,
        payloadHash,
        JSON.stringify(responseBody),
      )
    }

    logger.info("intake.created", {
      leadId: id,
      leadKey,
      tenantId: tenant.tenantId,
      email,
      idempotent: Boolean(idempotencyKey),
      routing: ingress,
    })
    return NextResponse.json(responseBody)
  } catch (error) {
    logger.error("intake.error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { success: false, error: "Failed to process intake" },
      { status: 500 },
    )
  }
}
