import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getConversation } from "@/lib/integrations/chatbase-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { conversationId } = await params;
    const conversation = await getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Conversation not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: conversation, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[chatbase/[conversationId] GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to get conversation" }, meta: null },
      { status: 500, headers },
    );
  }
}
