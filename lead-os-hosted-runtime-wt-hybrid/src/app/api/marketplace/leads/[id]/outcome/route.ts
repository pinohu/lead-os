import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { reportLeadOutcome } from "@/lib/marketplace";
import type { LeadOutcome } from "@/lib/marketplace-store";

const VALID_OUTCOMES = new Set<string>(["contacted", "booked", "converted", "no-response"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.buyerId || typeof body.buyerId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "buyerId is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (!body.outcome || !VALID_OUTCOMES.has(body.outcome)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "outcome must be contacted, booked, converted, or no-response" }, meta: null },
        { status: 400, headers },
      );
    }

    const lead = await reportLeadOutcome(id, body.buyerId, body.outcome as LeadOutcome);

    return NextResponse.json({ data: lead, error: null, meta: null }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to report outcome";
    const isClientError = message.includes("not found") ||
      message.includes("Only the claiming") ||
      message.includes("already been reported");
    return NextResponse.json(
      { data: null, error: { code: isClientError ? "OUTCOME_FAILED" : "INTERNAL_ERROR", message }, meta: null },
      { status: isClientError ? 400 : 500, headers },
    );
  }
}
