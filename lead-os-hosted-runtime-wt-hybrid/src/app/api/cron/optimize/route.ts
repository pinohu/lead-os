// src/app/api/cron/optimize/route.ts
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireCronAuthOrFail, requireDeployTenantIdOrFail } from "@/lib/api/cron-public-guards";
import { CronOptimizeBodySchema } from "@/lib/api/cron-mutation-schemas";
import { readJsonBody, validateWithSchema } from "@/lib/api/validated-json";
import { logApiMutationAudit } from "@/lib/api/api-mutation-audit";
import { runCronsBySchedule } from "@/lib/optimization-crons";
import { tenantConfig } from "@/lib/tenant";

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const authFail = requireCronAuthOrFail(request);
  if (authFail) return authFail;

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const validated = validateWithSchema(raw.data, CronOptimizeBodySchema);
  if (!validated.ok) {
    const res = validated.response;
    for (const [k, v] of Object.entries(headers)) {
      res.headers.set(k, v);
    }
    return res;
  }

  const body = validated.data;
  const tenantId = body.tenantId ?? tenantConfig.tenantId;
  const tenantFail = requireDeployTenantIdOrFail(tenantId, "cron_optimize");
  if (tenantFail) {
    for (const [k, v] of Object.entries(headers)) {
      tenantFail.headers.set(k, v);
    }
    return tenantFail;
  }

  try {
    const results = await runCronsBySchedule(tenantId, body.schedule);
    const allOk = results.every((r) => r.ok);

    await logApiMutationAudit({
      route: "/api/cron/optimize",
      method: "POST",
      actorHint: "cron@system",
      tenantId,
      outcome: allOk ? "success" : "failure",
      detail: { schedule: body.schedule },
    });

    return NextResponse.json(
      {
        data: results,
        error: allOk ? null : { code: "PARTIAL_FAILURE", message: "Some cron jobs failed" },
        meta: { schedule: body.schedule, total: results.length, succeeded: results.filter((r) => r.ok).length },
      },
      { status: allOk ? 200 : 207, headers },
    );
  } catch {
    await logApiMutationAudit({
      route: "/api/cron/optimize",
      method: "POST",
      actorHint: "cron@system",
      tenantId,
      outcome: "failure",
      detail: { reason: "exception" },
    });
    return NextResponse.json(
      { data: null, error: { code: "CRON_FAILED", message: "Failed to run optimization crons" }, meta: null },
      { status: 500, headers },
    );
  }
}
