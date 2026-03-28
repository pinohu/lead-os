import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createSalesHandoff, routeToSalesRep } from "@/lib/escalation-engine";
import type { LeadForEscalation, SalesRep } from "@/lib/escalation-engine";
import { z } from "zod";

const SalesRepSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().max(200),
  email: z.string().max(254),
  phone: z.string().max(30).optional().default(""),
  niches: z.array(z.string().max(100)).optional().default([]),
  timezone: z.string().max(50).optional().default("UTC"),
  maxDailyCapacity: z.number().min(0).optional().default(10),
  currentDailyLoad: z.number().min(0).optional().default(0),
  isAvailable: z.boolean().optional().default(true),
  closingRate: z.number().min(0).max(1).optional().default(0.5),
});

const HandoffSchema = z.object({
  leadId: z.string().min(1).max(200),
  tenantId: z.string().max(100).optional(),
  niche: z.string().max(200).optional(),
  name: z.string().max(200).optional(),
  email: z.string().max(254).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  companySize: z.string().max(50).optional(),
  estimatedDealValue: z.number().min(0).optional(),
  team: z.array(SalesRepSchema).min(1).max(100),
  scoringBreakdown: z.array(z.object({
    category: z.string(),
    score: z.number(),
    factors: z.array(z.string()),
  })).optional(),
  conversationHighlights: z.array(z.string().max(500)).optional(),
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

    const validation = HandoffSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }
    const body = validation.data;

    const tenantId = body.tenantId ?? "default";

    const lead: LeadForEscalation = {
      id: body.leadId,
      tenantId,
      niche: body.niche,
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      companySize: body.companySize,
      estimatedDealValue: body.estimatedDealValue,
    };

    const team: SalesRep[] = body.team.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone ?? "",
      niches: r.niches ?? [],
      timezone: r.timezone ?? "UTC",
      maxDailyCapacity: r.maxDailyCapacity ?? 10,
      currentDailyLoad: r.currentDailyLoad ?? 0,
      isAvailable: r.isAvailable ?? true,
      closingRate: r.closingRate ?? 0.5,
    }));

    const rep = routeToSalesRep(lead, team);
    if (!rep) {
      return NextResponse.json(
        { data: null, error: { code: "NO_AVAILABLE_REP", message: "No available sales rep matches the lead criteria" }, meta: null },
        { status: 422, headers },
      );
    }

    const context = {
      scoringBreakdown: body.scoringBreakdown ?? [],
      conversationHighlights: body.conversationHighlights ?? [],
      estimatedValue: body.estimatedDealValue,
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
