// src/app/api/operator/gtm/route.ts
// Operator GTM: list merged config + status; POST/PATCH to update persisted status + notes.

import { NextResponse } from "next/server";
import { GTM_USE_CASES, resolveGtmCanonicalSlug } from "@/config/gtm-use-cases";
import { logApiMutationAudit } from "@/lib/api/api-mutation-audit";
import { requireAlignedTenant } from "@/lib/api-mutation-guard";
import { assertValidGtmConfig } from "@/lib/gtm/config-validation";
import { mergeGtmUseCasesWithStatus } from "@/lib/gtm/merge";
import { GtmStatusPatchSchema } from "@/lib/gtm/patch-schema";
import { getGtmStatusRow, listGtmStatusRows, upsertGtmStatusRow } from "@/lib/gtm/store";
import { getPool } from "@/lib/db";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { logOperatorAudit } from "@/lib/operator-audit";
import { tenantConfig } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { session, response } = await requireOperatorApiSession(request);
  if (!session?.email) {
    return response ?? NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const align = requireAlignedTenant(request);
  if (!align.ok) {
    return NextResponse.json({ ok: false, error: align.message }, { status: align.status });
  }

  try {
    assertValidGtmConfig(GTM_USE_CASES);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "gtm_config_invalid",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  const rows = await listGtmStatusRows(tenantConfig.tenantId);
  const data = mergeGtmUseCasesWithStatus(GTM_USE_CASES, rows);
  return NextResponse.json({ ok: true as const, data });
}

async function mutateGtmStatus(request: Request, method: "POST" | "PATCH") {
  const { session, response } = await requireOperatorApiSession(request);
  if (!session?.email) {
    return response ?? NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const align = requireAlignedTenant(request);
  if (!align.ok) {
    await logApiMutationAudit({
      route: "/api/operator/gtm",
      method,
      actorHint: session.email,
      outcome: "failure",
      detail: { reason: align.message },
    });
    return NextResponse.json({ ok: false, error: align.message }, { status: align.status });
  }

  if (!getPool()) {
    await logApiMutationAudit({
      route: "/api/operator/gtm",
      method,
      actorHint: session.email,
      outcome: "failure",
      detail: { reason: "database_unavailable" },
    });
    return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    await logApiMutationAudit({
      route: "/api/operator/gtm",
      method,
      actorHint: session.email,
      outcome: "failure",
      detail: { reason: "invalid_json" },
    });
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = GtmStatusPatchSchema.safeParse(body);
  if (!parsed.success) {
    await logApiMutationAudit({
      route: "/api/operator/gtm",
      method,
      actorHint: session.email,
      outcome: "failure",
      detail: { reason: "validation_failed" },
    });
    return NextResponse.json(
      { ok: false, error: "validation_failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    assertValidGtmConfig(GTM_USE_CASES);
  } catch (err) {
    await logApiMutationAudit({
      route: "/api/operator/gtm",
      method,
      actorHint: session.email,
      outcome: "failure",
      detail: { reason: "gtm_config_invalid" },
    });
    return NextResponse.json(
      {
        ok: false,
        error: "gtm_config_invalid",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  const canonical = resolveGtmCanonicalSlug(parsed.data.slug);
  if (!canonical) {
    await logOperatorAudit({
      actorEmail: session.email,
      tenantId: tenantConfig.tenantId,
      action: "gtm.status_update",
      resourceType: "gtm_use_case",
      resourceId: parsed.data.slug,
      detail: { outcome: "unknown_slug" },
    });
    await logApiMutationAudit({
      route: "/api/operator/gtm",
      method,
      actorHint: session.email,
      outcome: "failure",
      detail: { reason: "unknown_use_case_slug", slug: parsed.data.slug },
    });
    return NextResponse.json({ ok: false, error: "unknown_use_case_slug" }, { status: 404 });
  }

  const existing = await getGtmStatusRow(tenantConfig.tenantId, canonical);
  const nextStatus = parsed.data.status ?? existing?.status ?? "not_started";
  const nextNotes = parsed.data.notes !== undefined ? parsed.data.notes : (existing?.notes ?? "");

  try {
    await upsertGtmStatusRow({
      tenantId: tenantConfig.tenantId,
      slug: canonical,
      status: nextStatus,
      notes: nextNotes,
      updatedBy: session.email,
    });
  } catch (err) {
    await logApiMutationAudit({
      route: "/api/operator/gtm",
      method,
      actorHint: session.email,
      outcome: "failure",
      detail: {
        reason: "persist_failed",
        message: err instanceof Error ? err.message : String(err),
      },
    });
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 503 });
  }

  await logOperatorAudit({
    actorEmail: session.email,
    tenantId: tenantConfig.tenantId,
    action: "gtm.status_update",
    resourceType: "gtm_use_case",
    resourceId: canonical,
    detail: { status: nextStatus, notesChanged: parsed.data.notes !== undefined },
  });

  await logApiMutationAudit({
    route: "/api/operator/gtm",
    method,
    actorHint: session.email,
    outcome: "success",
    detail: { slug: canonical, status: nextStatus },
  });

  return NextResponse.json({
    ok: true as const,
    data: { slug: canonical, status: nextStatus, notes: nextNotes },
  });
}

export async function PATCH(request: Request) {
  return mutateGtmStatus(request, "PATCH");
}

export async function POST(request: Request) {
  return mutateGtmStatus(request, "POST");
}
