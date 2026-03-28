import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateLinkedInMessage, type LeadContext } from "@/lib/integrations/langchain-adapter";

const VALID_STATUSES = new Set(["none", "pending", "connected"]);

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

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

    const connectionStatus = typeof body.connectionStatus === "string" && VALID_STATUSES.has(body.connectionStatus)
      ? body.connectionStatus as "none" | "pending" | "connected"
      : "none";

    const message = await generateLinkedInMessage(lead, connectionStatus);
    return NextResponse.json(
      { data: message, error: null, meta: { connectionStatus } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate LinkedIn message" }, meta: null },
      { status: 500, headers },
    );
  }
}
