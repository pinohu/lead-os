import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { scoutNiche } from "@/lib/discovery-scout";
import { classifyAll } from "@/lib/opportunity-classifier";
import { tenantConfig } from "@/lib/tenant";

export async function POST(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Request body must be valid JSON", details: [] }, meta: null },
      { status: 400 },
    );
  }

  const input = body as { niche?: unknown; geo?: unknown; tenantId?: unknown; maxResults?: unknown; analyzeWebsites?: unknown };

  if (typeof input.niche !== "string" || !input.niche.trim()) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_FAILED", message: "niche is required", details: [{ field: "niche", issue: "Must be a non-empty string" }] }, meta: null },
      { status: 400 },
    );
  }

  if (typeof input.geo !== "string" || !input.geo.trim()) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_FAILED", message: "geo is required", details: [{ field: "geo", issue: "Must be a non-empty string" }] }, meta: null },
      { status: 400 },
    );
  }

  const tenantId = typeof input.tenantId === "string" ? input.tenantId : tenantConfig.tenantId;
  const maxResults = typeof input.maxResults === "number" ? Math.min(input.maxResults, 50) : 10;
  const analyzeWebsites = input.analyzeWebsites === true;

  const scoutResult = await scoutNiche({
    niche: input.niche.trim(),
    geo: input.geo.trim(),
    tenantId,
    maxResults,
    analyzeWebsites,
  });

  const classifications = classifyAll(scoutResult.businesses);

  return NextResponse.json({
    data: {
      scout: {
        businessesFound: scoutResult.businessesFound,
        businessesScored: scoutResult.businessesScored,
        topProspects: scoutResult.topProspects.length,
        topAffiliates: scoutResult.topAffiliates.length,
        topPartners: scoutResult.topPartners.length,
      },
      businesses: scoutResult.businesses.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        website: b.website,
        phone: b.phone,
        rating: b.rating,
        opportunityScore: b.opportunityScore,
        digitalGapScore: b.digitalGapScore,
        affiliatePotential: b.affiliatePotential,
        partnerPotential: b.partnerPotential,
        qualitySignals: b.qualitySignals,
      })),
      classifications: classifications.map((c) => ({
        businessId: c.business.id,
        businessName: c.business.name,
        primaryType: c.primaryOpportunity.type,
        primaryPriority: c.primaryOpportunity.priority,
        confidence: c.primaryOpportunity.confidence,
        estimatedValue: c.totalEstimatedValue,
        suggestedAction: c.primaryOpportunity.suggestedAction,
        opportunityCount: c.opportunities.length,
      })),
    },
    error: null,
    meta: { tenantId, niche: input.niche.trim(), geo: input.geo.trim() },
  });
}
