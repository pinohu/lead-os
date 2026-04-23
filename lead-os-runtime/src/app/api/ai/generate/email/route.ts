import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateColdEmail, generateFollowUpEmail, type LeadContext } from "@/lib/integrations/langchain-adapter";

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body.lead || typeof body.lead !== "object") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "lead object is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const lead = body.lead as LeadContext;
    if (!lead.name || !lead.company || !lead.title || !lead.industry) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "lead must include name, company, title, and industry" }, meta: null },
        { status: 400, headers },
      );
    }

    const isFollowUp = body.type === "follow-up";

    if (isFollowUp) {
      const previousEmails = Array.isArray(body.previousEmails) ? body.previousEmails as string[] : [];
      const stage = typeof body.stage === "number" ? body.stage : 1;
      const email = await generateFollowUpEmail(lead, previousEmails, stage);
      return NextResponse.json(
        { data: email, error: null, meta: { type: "follow-up", stage } },
        { status: 200, headers },
      );
    }

    const template = typeof body.template === "string" ? body.template : undefined;
    const email = await generateColdEmail(lead, template);
    return NextResponse.json(
      { data: email, error: null, meta: { type: "cold-email" } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate email" }, meta: null },
      { status: 500, headers },
    );
  }
}
