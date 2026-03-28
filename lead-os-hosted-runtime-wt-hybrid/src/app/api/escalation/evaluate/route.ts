import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { shouldEscalate, classifyEscalationType } from "@/lib/escalation-engine";
import type { LeadForEscalation, EscalationSignals } from "@/lib/escalation-engine";
import { z } from "zod";

const EscalationEvaluateSchema = z.object({
  leadId: z.string().min(1).max(200),
  tenantId: z.string().max(100).optional(),
  score: z.number().min(0).max(100).optional(),
  niche: z.string().max(200).optional(),
  name: z.string().max(200).optional(),
  email: z.string().max(254).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  companySize: z.string().max(50).optional(),
  estimatedDealValue: z.number().min(0).optional(),
  hasPhoneRequest: z.boolean().optional(),
  competitorMentioned: z.boolean().optional(),
  urgencyLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  explicitCallRequest: z.boolean().optional(),
});

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

    const raw = await request.json();

    const validation = EscalationEvaluateSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }
    const body = validation.data;

    const tenantId = body.tenantId ?? "default";
    const score = body.score ?? 0;
    const leadId = body.leadId;

    const lead: LeadForEscalation = {
      id: leadId,
      tenantId,
      niche: body.niche,
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      companySize: body.companySize,
      estimatedDealValue: body.estimatedDealValue,
    };

    const signals: EscalationSignals = {
      compositeScore: score,
      estimatedDealValue: body.estimatedDealValue,
      hasPhoneRequest: body.hasPhoneRequest ?? false,
      competitorMentioned: body.competitorMentioned ?? false,
      urgencyLevel: body.urgencyLevel,
      companySize: lead.companySize,
      explicitCallRequest: body.explicitCallRequest ?? false,
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
