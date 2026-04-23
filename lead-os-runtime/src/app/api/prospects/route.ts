import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { listProspects, getProspectStats, type ProspectFilters, type ProspectStatus } from "@/lib/prospect-store";
import { runProspectPipeline } from "@/lib/prospect-pipeline";
import { tenantConfig } from "@/lib/tenant";
import type { OpportunityType, OpportunityPriority } from "@/lib/opportunity-classifier";

const VALID_STATUSES: ProspectStatus[] = ["new", "contacted", "engaged", "converted", "rejected", "deferred"];
const VALID_TYPES: OpportunityType[] = ["managed-service", "white-label", "implementation", "marketplace", "affiliate", "referral-partner"];
const VALID_PRIORITIES: OpportunityPriority[] = ["hot", "warm", "cool", "cold"];

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId") ?? tenantConfig.tenantId;
  const includeStats = searchParams.get("stats") === "true";

  const filters: ProspectFilters = { tenantId };

  const status = searchParams.get("status");
  if (status && VALID_STATUSES.includes(status as ProspectStatus)) {
    filters.status = status as ProspectStatus;
  }

  const type = searchParams.get("type");
  if (type && VALID_TYPES.includes(type as OpportunityType)) {
    filters.opportunityType = type as OpportunityType;
  }

  const priority = searchParams.get("priority");
  if (priority && VALID_PRIORITIES.includes(priority as OpportunityPriority)) {
    filters.priority = priority as OpportunityPriority;
  }

  const niche = searchParams.get("niche");
  if (niche) filters.niche = niche;

  const minConfidence = searchParams.get("minConfidence");
  if (minConfidence) filters.minConfidence = parseInt(minConfidence, 10);

  const limit = searchParams.get("limit");
  if (limit) filters.limit = parseInt(limit, 10);

  const prospects = await listProspects(filters);
  const stats = includeStats ? await getProspectStats(tenantId) : undefined;

  return NextResponse.json({
    data: prospects,
    error: null,
    meta: { total: prospects.length, tenantId, stats: stats ?? null },
  });
}

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

  const input = body as {
    niche?: unknown;
    geo?: unknown;
    tenantId?: unknown;
    autoIngest?: unknown;
    minConfidence?: unknown;
    analyzeWebsites?: unknown;
    maxResults?: unknown;
  };

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

  const result = await runProspectPipeline({
    tenantId,
    niche: input.niche.trim(),
    geo: input.geo.trim(),
    autoIngestToLeadPipeline: input.autoIngest === true,
    minConfidence: typeof input.minConfidence === "number" ? input.minConfidence : 30,
    analyzeWebsites: input.analyzeWebsites === true,
    maxResults: typeof input.maxResults === "number" ? Math.min(input.maxResults as number, 50) : 10,
  });

  return NextResponse.json(
    {
      data: {
        summary: result.summary,
        prospects: result.prospectsCreated,
        errors: result.errors.length > 0 ? result.errors : null,
      },
      error: null,
      meta: { tenantId },
    },
    { status: 201 },
  );
}
