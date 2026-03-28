import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { calculateLeadValue } from "@/lib/monetization-engine";
import { z } from "zod";

const ValuationSchema = z.object({
  leadId: z.string().min(1).max(200),
  niche: z.string().min(1).max(200),
  qualityScore: z.number().min(0).max(100).optional(),
  exclusivity: z.boolean().optional(),
  location: z.string().max(200).optional(),
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

    const validation = ValuationSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }
    const body = validation.data;

    const qualityScore = body.qualityScore ?? 50;
    const exclusivity = body.exclusivity ?? false;

    const valuation = calculateLeadValue(
      { id: body.leadId, exclusivity, location: body.location },
      body.niche,
      qualityScore,
    );

    return NextResponse.json(
      { data: valuation, error: null, meta: null },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to calculate lead valuation" }, meta: null },
      { status: 500, headers },
    );
  }
}
