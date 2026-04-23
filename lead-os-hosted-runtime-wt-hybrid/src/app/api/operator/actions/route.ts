// src/app/api/operator/actions/route.ts
import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { OperatorActionSchema, executeOperatorAction } from "@/lib/operator-actions";
import { hashPayloadJson, lookupIdempotency, storeIdempotency } from "@/lib/idempotency";
import { logApiMutationAudit } from "@/lib/api/api-mutation-audit";

export const dynamic = "force-dynamic";

const IDEM_SCOPE = "operator_actions";

export async function POST(request: Request) {
  const { session, response } = await requireOperatorApiSession(request);
  if (!session?.email) {
    return response ?? NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    await logApiMutationAudit({
      route: "/api/operator/actions",
      method: "POST",
      actorHint: session.email,
      outcome: "failure",
      detail: { reason: "invalid_json" },
    });
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsedBody = OperatorActionSchema.safeParse(body);
  if (!parsedBody.success) {
    await logApiMutationAudit({
      route: "/api/operator/actions",
      method: "POST",
      actorHint: session.email,
      outcome: "failure",
      detail: { reason: "validation_failed" },
    });
    return NextResponse.json(
      { ok: false, error: "validation_failed", details: parsedBody.error.flatten() },
      { status: 422 },
    );
  }

  const idemKey =
    request.headers.get("idempotency-key")?.trim() ||
    request.headers.get("Idempotency-Key")?.trim() ||
    "";
  const payloadHash = hashPayloadJson(body);
  const actorFp = session.email;

  if (idemKey) {
    const prior = await lookupIdempotency({
      scope: IDEM_SCOPE,
      idempotencyKey: idemKey,
      actorFingerprint: actorFp,
      payloadHash,
    });
    if (prior.kind === "mismatch") {
      return NextResponse.json(
        { ok: false, error: "idempotency_key_reuse_with_different_body" },
        { status: 409 },
      );
    }
    if (prior.kind === "hit") {
      return NextResponse.json(prior.body, { status: prior.statusCode });
    }
  }

  const result = await executeOperatorAction({ actorEmail: session.email, request }, body);
  if (!result.ok) {
    await logApiMutationAudit({
      route: "/api/operator/actions",
      method: "POST",
      actorHint: session.email,
      outcome: "failure",
      detail: { error: result.error, status: result.status },
    });
    const res = NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    if (idemKey) {
      try {
        await storeIdempotency({
          scope: IDEM_SCOPE,
          idempotencyKey: idemKey,
          actorFingerprint: actorFp,
          payloadHash,
          statusCode: result.status,
          responseBody: { ok: false, error: result.error },
        });
      } catch {
        /* idempotency table may not exist until migration 008 */
      }
    }
    return res;
  }

  await logApiMutationAudit({
    route: "/api/operator/actions",
    method: "POST",
    actorHint: session.email,
    outcome: "success",
    detail: { action: parsedBody.data.type },
  });

  const okJson = { ok: true as const, data: result.data ?? {} };
  const res = NextResponse.json(okJson);
  if (idemKey) {
    try {
      await storeIdempotency({
        scope: IDEM_SCOPE,
        idempotencyKey: idemKey,
        actorFingerprint: actorFp,
        payloadHash,
        statusCode: 200,
        responseBody: okJson,
      });
    } catch {
      /* idempotency table may not exist until migration 008 */
    }
  }
  return res;
}
