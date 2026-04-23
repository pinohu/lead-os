// src/app/api/cron/discovery/route.ts
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireCronAuthOrFail, requireDeployTenantIdOrFail } from "@/lib/api/cron-public-guards";
import { CronDiscoveryBodySchema } from "@/lib/api/cron-mutation-schemas";
import { readJsonBody, validateWithSchema } from "@/lib/api/validated-json";
import { logApiMutationAudit } from "@/lib/api/api-mutation-audit";
import { runMultiNichePipeline } from "@/lib/prospect-pipeline";
import { nicheCatalog } from "@/lib/catalog";
import { tenantConfig } from "@/lib/tenant";

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const authFail = requireCronAuthOrFail(request);
  if (authFail) return authFail;

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const validated = validateWithSchema(raw.data, CronDiscoveryBodySchema);
  if (!validated.ok) {
    await logApiMutationAudit({
      route: "/api/cron/discovery",
      method: "POST",
      actorHint: "cron@system",
      outcome: "failure",
      detail: { reason: "validation" },
    });
    const res = validated.response;
    for (const [k, v] of headers.entries()) {
      res.headers.set(k, v);
    }
    return res;
  }

  const body = validated.data;
  const tenantId = body.tenantId ?? tenantConfig.tenantId;
  const tenantFail = requireDeployTenantIdOrFail(tenantId, "cron_discovery");
  if (tenantFail) {
    for (const [k, v] of headers.entries()) {
      tenantFail.headers.set(k, v);
    }
    return tenantFail;
  }

  const geo = body.geo ?? "United States";
  const niches: Array<{ niche: string; geo: string }> = [];

  if (Array.isArray(body.niches) && body.niches.length > 0) {
    for (const n of body.niches) {
      if (typeof n === "string") {
        niches.push({ niche: n, geo });
      } else if (n && typeof n === "object" && "niche" in n && typeof n.niche === "string") {
        niches.push({ niche: n.niche, geo: typeof n.geo === "string" ? n.geo : geo });
      }
    }
  } else {
    for (const slug of Object.keys(nicheCatalog)) {
      if (slug === "general") continue;
      niches.push({ niche: nicheCatalog[slug].label, geo });
    }
  }

  try {
    const result = await runMultiNichePipeline(tenantId, niches, {
      autoIngestToLeadPipeline: body.autoIngest === true,
      minConfidence: body.minConfidence ?? 30,
      analyzeWebsites: body.analyzeWebsites === true,
      maxResults: body.maxPerNiche !== undefined ? Math.min(body.maxPerNiche, 50) : 10,
    });

    await logApiMutationAudit({
      route: "/api/cron/discovery",
      method: "POST",
      actorHint: "cron@system",
      tenantId,
      outcome: "success",
      detail: { niches: niches.length },
    });

    return NextResponse.json(
      {
        data: {
          totalProspects: result.totalProspects,
          totalLeads: result.totalLeads,
          totalEstimatedValue: result.totalEstimatedValue,
          totalErrors: result.totalErrors,
          nichesScanned: result.results.length,
          results: result.results.map((r) => ({
            niche: r.scoutResult.config.niche,
            geo: r.scoutResult.config.geo,
            businessesFound: r.summary.businessesFound,
            prospectsCreated: r.summary.prospectsCreated,
            hotProspects: r.summary.hotProspects,
            warmProspects: r.summary.warmProspects,
            estimatedValue: r.summary.totalEstimatedValue,
            leadsIngested: r.summary.leadsIngested,
          })),
        },
        error: null,
        meta: { tenantId },
      },
      { headers },
    );
  } catch {
    await logApiMutationAudit({
      route: "/api/cron/discovery",
      method: "POST",
      actorHint: "cron@system",
      tenantId,
      outcome: "failure",
      detail: { reason: "pipeline_error" },
    });
    return NextResponse.json(
      { data: null, error: { code: "DISCOVERY_FAILED", message: "Failed to run discovery pipeline" }, meta: null },
      { status: 500, headers },
    );
  }
}
