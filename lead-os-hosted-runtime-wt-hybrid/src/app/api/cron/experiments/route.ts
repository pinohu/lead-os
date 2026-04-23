// src/app/api/cron/experiments/route.ts
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireCronAuthOrFail, requireDeployTenantIdOrFail } from "@/lib/api/cron-public-guards";
import { CronExperimentsBodySchema } from "@/lib/api/cron-mutation-schemas";
import { readJsonBody, validateWithSchema } from "@/lib/api/validated-json";
import { logApiMutationAudit } from "@/lib/api/api-mutation-audit";
import { evaluateAllExperiments } from "@/lib/experiment-evaluator";
import { tenantConfig } from "@/lib/tenant";

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const authFail = requireCronAuthOrFail(request);
  if (authFail) return authFail;

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const validated = validateWithSchema(raw.data, CronExperimentsBodySchema);
  if (!validated.ok) {
    const res = validated.response;
    for (const [k, v] of headers.entries()) {
      res.headers.set(k, v);
    }
    return res;
  }

  const tenantId = validated.data.tenantId ?? tenantConfig.tenantId;
  const tenantFail = requireDeployTenantIdOrFail(tenantId, "cron_experiments");
  if (tenantFail) {
    for (const [k, v] of headers.entries()) {
      tenantFail.headers.set(k, v);
    }
    return tenantFail;
  }

  try {
    const summary = await evaluateAllExperiments(tenantId);
    await logApiMutationAudit({
      route: "/api/cron/experiments",
      method: "POST",
      actorHint: "cron@system",
      tenantId,
      outcome: "success",
      detail: {},
    });
    return NextResponse.json({ data: summary, error: null, meta: null }, { headers });
  } catch {
    await logApiMutationAudit({
      route: "/api/cron/experiments",
      method: "POST",
      actorHint: "cron@system",
      tenantId,
      outcome: "failure",
      detail: { reason: "exception" },
    });
    return NextResponse.json(
      { data: null, error: { code: "EVALUATION_FAILED", message: "Failed to evaluate experiments" }, meta: null },
      { status: 500, headers },
    );
  }
}
