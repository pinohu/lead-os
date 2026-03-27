import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createSalesHandoff, routeToSalesRep } from "@/lib/escalation-engine";
import type { LeadForEscalation, SalesRep } from "@/lib/escalation-engine";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

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

    const body = await request.json() as Record<string, unknown>;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be a JSON object" }, meta: null },
        { status: 400, headers },
      );
    }

    const leadId = body.leadId;
    if (typeof leadId !== "string" || leadId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const tenantId = typeof body.tenantId === "string" ? body.tenantId : "default";

    const lead: LeadForEscalation = {
      id: leadId,
      tenantId,
      niche: typeof body.niche === "string" ? body.niche : undefined,
      name: typeof body.name === "string" ? body.name : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      company: typeof body.company === "string" ? body.company : undefined,
      companySize: typeof body.companySize === "string" ? body.companySize : undefined,
      estimatedDealValue: typeof body.estimatedDealValue === "number" ? body.estimatedDealValue : undefined,
    };

    if (!Array.isArray(body.team) || body.team.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "team array is required with at least one sales rep" }, meta: null },
        { status: 400, headers },
      );
    }

    const team: SalesRep[] = (body.team as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ""),
      name: String(r.name ?? ""),
      email: String(r.email ?? ""),
      phone: String(r.phone ?? ""),
      niches: Array.isArray(r.niches) ? (r.niches as string[]) : [],
      timezone: String(r.timezone ?? "UTC"),
      maxDailyCapacity: typeof r.maxDailyCapacity === "number" ? r.maxDailyCapacity : 10,
      currentDailyLoad: typeof r.currentDailyLoad === "number" ? r.currentDailyLoad : 0,
      isAvailable: r.isAvailable !== false,
      closingRate: typeof r.closingRate === "number" ? r.closingRate : 0.5,
    }));

    const rep = routeToSalesRep(lead, team);
    if (!rep) {
      return NextResponse.json(
        { data: null, error: { code: "NO_AVAILABLE_REP", message: "No available sales rep matches the lead criteria" }, meta: null },
        { status: 422, headers },
      );
    }

    const context = {
      scoringBreakdown: Array.isArray(body.scoringBreakdown) ? body.scoringBreakdown as { category: string; score: number; factors: string[] }[] : [],
      conversationHighlights: Array.isArray(body.conversationHighlights) ? body.conversationHighlights as string[] : [],
      estimatedValue: typeof body.estimatedDealValue === "number" ? body.estimatedDealValue : undefined,
    };

    const handoff = createSalesHandoff(lead, rep, context);

    return NextResponse.json(
      { data: handoff, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to create sales handoff" }, meta: null },
      { status: 500, headers },
    );
  }
}
