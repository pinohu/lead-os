import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { shouldEscalate, classifyEscalationType } from "@/lib/escalation-engine";
import type { LeadForEscalation, EscalationSignals } from "@/lib/escalation-engine";

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
    const score = typeof body.score === "number" ? body.score : 0;

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

    const signals: EscalationSignals = {
      compositeScore: score,
      estimatedDealValue: typeof body.estimatedDealValue === "number" ? body.estimatedDealValue : undefined,
      hasPhoneRequest: body.hasPhoneRequest === true,
      competitorMentioned: body.competitorMentioned === true,
      urgencyLevel: typeof body.urgencyLevel === "string" ? body.urgencyLevel as EscalationSignals["urgencyLevel"] : undefined,
      companySize: lead.companySize,
      explicitCallRequest: body.explicitCallRequest === true,
    };

    const result = shouldEscalate(lead, score, signals);
    const escalationType = result.escalate ? classifyEscalationType(lead) : null;

    return NextResponse.json(
      {
        data: {
          shouldEscalate: result.escalate,
          reasons: result.reasons,
          escalationType,
          leadId,
        },
        error: null,
        meta: null,
      },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to evaluate escalation" }, meta: null },
      { status: 500, headers },
    );
  }
}
