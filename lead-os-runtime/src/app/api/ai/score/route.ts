import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { aiScoreLead } from "@/lib/ai-scoring";
import { getLeadRecord } from "@/lib/runtime-store";

const MAX_LEAD_KEY_LENGTH = 128;

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

    const leadKey = body.leadKey;
    if (typeof leadKey !== "string" || leadKey.trim().length === 0 || leadKey.length > MAX_LEAD_KEY_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey is required" }, meta: null },
        { status: 400, headers },
      );
    }

    let leadData: Record<string, unknown> = { leadKey };

    try {
      const storedLead = await getLeadRecord(leadKey);
      if (storedLead) {
        leadData = { ...storedLead } as unknown as Record<string, unknown>;
      }
    } catch {
      // Proceed with minimal lead data
    }

    const chatHistory = Array.isArray(body.chatHistory)
      ? body.chatHistory.filter((m: unknown) => {
          if (typeof m !== "object" || m === null) return false;
          const msg = m as Record<string, unknown>;
          return typeof msg.role === "string" && typeof msg.content === "string";
        })
      : undefined;

    const result = await aiScoreLead(leadData, chatHistory);

    return NextResponse.json(
      {
        data: result,
        error: null,
        meta: { scoredAt: new Date().toISOString() },
      },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "AI_SCORE_FAILED", message: err instanceof Error ? err.message : "AI scoring failed" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
