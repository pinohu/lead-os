import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getContextsByTenant } from "@/lib/context-engine";
import { identifyEarlyInterventionLeads } from "@/lib/human-amplification";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const valueThreshold = url.searchParams.get("valueThreshold");
    const scoreThreshold = url.searchParams.get("scoreThreshold");

    const config = {
      ...(valueThreshold != null ? { valueThreshold: Number(valueThreshold) } : {}),
      ...(scoreThreshold != null ? { scoreThreshold: Number(scoreThreshold) } : {}),
    };

    const leads = await getContextsByTenant(tenantId, { limit: 100 });

    const earlyInterventionLeads = leads.map((lead) => {
      const daysSinceFirstContact = Math.floor(
        (Date.now() - new Date(lead.firstSeen).getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        leadKey: lead.leadKey,
        compositeScore: lead.scores.composite,
        predictedValue: estimateValue(lead.scores.composite, lead.scores.fit, lead.company),
        interactionCount: lead.interactions.length,
        daysSinceFirstContact,
        hasPhoneNumber: Boolean(lead.phone),
      };
    });

    const results = identifyEarlyInterventionLeads(earlyInterventionLeads, config);

    return NextResponse.json(
      { data: results, error: null, meta: { count: results.length, tenantId } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SCAN_FAILED", message: "Failed to identify early intervention leads" }, meta: null },
      { status: 500, headers },
    );
  }
}

function estimateValue(composite: number, fit: number, company?: string): number {
  const baseValue = 5000;
  let multiplier = 1;

  if (company) multiplier += 0.5;
  if (composite > 75) multiplier += 1;
  if (fit > 70) multiplier += 0.5;

  return Math.round(baseValue * multiplier);
}
