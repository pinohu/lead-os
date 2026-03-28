import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  startChatSession,
  processMessage,
  getChatSession,
} from "@/lib/ai-chat-agent";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_SESSION_ID_LENGTH = 64;
const MAX_VISITOR_ID_LENGTH = 128;
const MAX_TENANT_ID_LENGTH = 128;
const MAX_NICHE_LENGTH = 200;
const MAX_BRAND_NAME_LENGTH = 200;

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

    const message = body.message;
    if (typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "message is required and must be a non-empty string" }, meta: null },
        { status: 400, headers },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `message must be under ${MAX_MESSAGE_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    const visitorId = typeof body.visitorId === "string" && body.visitorId.length <= MAX_VISITOR_ID_LENGTH
      ? body.visitorId
      : `visitor-${Date.now()}`;

    const tenantId = typeof body.tenantId === "string" && body.tenantId.length <= MAX_TENANT_ID_LENGTH
      ? body.tenantId
      : "default";

    const niche = typeof body.niche === "string" && body.niche.length <= MAX_NICHE_LENGTH
      ? body.niche
      : undefined;

    const brandName = typeof body.brandName === "string" && body.brandName.length <= MAX_BRAND_NAME_LENGTH
      ? body.brandName
      : undefined;

    let sessionId = typeof body.sessionId === "string" && body.sessionId.length <= MAX_SESSION_ID_LENGTH
      ? body.sessionId
      : undefined;

    if (sessionId) {
      const existing = getChatSession(sessionId);
      if (!existing) {
        sessionId = undefined;
      }
    }

    if (!sessionId) {
      const newSession = startChatSession(tenantId, visitorId, niche, brandName);
      sessionId = newSession.id;
    }

    const { session, response } = await processMessage(sessionId, message.trim());

    return NextResponse.json(
      {
        data: {
          sessionId: session.id,
          response,
          extractedData: session.extractedData,
          score: session.score,
          leadCaptured: session.leadCaptured,
        },
        error: null,
        meta: { processedAt: new Date().toISOString() },
      },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "CHAT_FAILED", message: err instanceof Error ? err.message : "Chat processing failed" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
