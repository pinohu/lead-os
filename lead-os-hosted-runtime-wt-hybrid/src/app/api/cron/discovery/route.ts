import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { runMultiNichePipeline } from "@/lib/prospect-pipeline";
import { nicheCatalog } from "@/lib/catalog";
import { tenantConfig } from "@/lib/tenant";

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();
    const tenantId = typeof body.tenantId === "string" ? body.tenantId : tenantConfig.tenantId;
    const geo = typeof body.geo === "string" ? body.geo : "United States";

    const niches: Array<{ niche: string; geo: string }> = [];

    if (Array.isArray(body.niches)) {
      for (const n of body.niches) {
        if (typeof n === "string") {
          niches.push({ niche: n, geo });
        } else if (n && typeof n.niche === "string") {
          niches.push({ niche: n.niche, geo: typeof n.geo === "string" ? n.geo : geo });
        }
      }
    } else {
      for (const slug of Object.keys(nicheCatalog)) {
        if (slug === "general") continue;
        niches.push({ niche: nicheCatalog[slug].label, geo });
      }
    }

    const result = await runMultiNichePipeline(tenantId, niches, {
      autoIngestToLeadPipeline: body.autoIngest === true,
      minConfidence: typeof body.minConfidence === "number" ? body.minConfidence : 30,
      analyzeWebsites: body.analyzeWebsites === true,
      maxResults: typeof body.maxPerNiche === "number" ? Math.min(body.maxPerNiche, 50) : 10,
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
    return NextResponse.json(
      { data: null, error: { code: "DISCOVERY_FAILED", message: "Failed to run discovery pipeline" }, meta: null },
      { status: 500, headers },
    );
  }
}
