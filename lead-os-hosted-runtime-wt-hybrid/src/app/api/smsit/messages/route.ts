import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { sendMessage, listMessages } from "@/lib/integrations/smsit-adapter";

const ChannelSchema = z.enum(["sms", "mms", "rcs", "whatsapp", "voice"]);

const SendMessageSchema = z.object({
  to: z.string().min(1),
  body: z.string(),
  channel: ChannelSchema.optional(),
  mediaUrl: z.string().url().optional(),
  tenantId: z.string().optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const channel = url.searchParams.get("channel") ?? undefined;
    const validChannel = channel && ChannelSchema.safeParse(channel).success
      ? (channel as z.infer<typeof ChannelSchema>)
      : undefined;

    const messages = await listMessages(tenantId, validChannel);

    return NextResponse.json(
      { data: messages, error: null, meta: { count: messages.length } },
      { headers },
    );
  } catch (err) {
    console.error("[smsit/messages GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list messages" }, meta: null },
      { status: 500, headers },
    );
  }
}

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

    const message = await sendMessage(validation.data);

    return NextResponse.json(
      { data: message, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[smsit/messages POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "SEND_FAILED", message: "Failed to send message" }, meta: null },
      { status: 500, headers },
    );
  }
}
