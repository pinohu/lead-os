import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  sendMessage,
  listConversations,
} from "@/lib/integrations/chatbase-adapter";

const SendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().optional(),
  botId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = SendMessageSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const { message, conversationId, botId } = validation.data;
    const response = await sendMessage(conversationId ?? null, message, botId);

    return NextResponse.json(
      { data: response, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    logger.error("chatbase POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "SEND_FAILED", message: "Failed to send message" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const botId = url.searchParams.get("botId") ?? undefined;
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const conversations = await listConversations(botId, tenantId);

    return NextResponse.json(
      { data: conversations, error: null, meta: { count: conversations.length } },
      { headers },
    );
  } catch (err) {
    logger.error("chatbase GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list conversations" }, meta: null },
      { status: 500, headers },
    );
  }
}
