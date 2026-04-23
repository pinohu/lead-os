// src/app/api/cron/pricing-tick/route.ts
import { NextResponse } from "next/server";
import { requireCronAuthOrFail, requireDeployTenantIdOrFail } from "@/lib/api/cron-public-guards";
import { logApiMutationAudit } from "@/lib/api/api-mutation-audit";
import { getDefaultTenantId, isRedisUrlConfigured, isSystemEnabled } from "@/lib/pricing/env.ts";
import { runPricingTickJob } from "@/lib/pricing/job-processor.ts";
import { enqueuePricingTickRequest } from "@/lib/pricing/queue-client.ts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authFail = requireCronAuthOrFail(request);
  if (authFail) return authFail;

  const tenantId = getDefaultTenantId();
  const tenantFail = requireDeployTenantIdOrFail(tenantId, "cron_pricing_tick");
  if (tenantFail) return tenantFail;

  if (!isSystemEnabled()) {
    return NextResponse.json({ ok: false, error: "system_disabled" }, { status: 503 });
  }

  const useQueue = isRedisUrlConfigured() && process.env.VERCEL !== "1";

  if (useQueue) {
    const jobId = await enqueuePricingTickRequest(tenantId, "cron");
    await logApiMutationAudit({
      route: "/api/cron/pricing-tick",
      method: "GET",
      actorHint: "cron@system",
      outcome: "success",
      detail: { mode: "queued", jobId },
    });
    return NextResponse.json({
      ok: true,
      mode: "queued",
      tenantId,
      jobId: jobId ?? null,
    });
  }

  const result = await runPricingTickJob(
    { kind: "tick", tenantId, source: "cron-inline" },
    undefined,
  );
  await logApiMutationAudit({
    route: "/api/cron/pricing-tick",
    method: "GET",
    actorHint: "cron@system",
    outcome: "success",
    detail: { mode: "inline" },
  });
  return NextResponse.json({
    ok: true,
    mode: "inline",
    tenantId,
    result,
  });
}
