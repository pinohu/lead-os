import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { findDecisionMakers } from "@/lib/integrations/firecrawl-mcp-connector";
import { z } from "zod";

const DecisionMakersSchema = z.object({
  companyDomain: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = DecisionMakersSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const makers = await findDecisionMakers(validation.data.companyDomain);

    return NextResponse.json(
      { data: makers, error: null, meta: { count: makers.length } },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "DECISION_MAKERS_FAILED", message: err instanceof Error ? err.message : "Decision maker discovery failed" }, meta: null },
      { status: 500, headers },
    );
  }
}
