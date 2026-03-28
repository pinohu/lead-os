import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { extractLeadInfoFromChat } from "@/lib/integrations/langchain-adapter";

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.sessionId !== "string" || body.sessionId.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "sessionId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const info = await extractLeadInfoFromChat(body.sessionId);
    return NextResponse.json(
      { data: info, error: null, meta: { sessionId: body.sessionId } },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to extract lead info";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 404 ? "NOT_FOUND" : "EXTRACTION_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
