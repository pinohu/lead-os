import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { sendBulkMessages } from "@/lib/integrations/smsit-adapter";

const BulkMessageSchema = z.object({
  recipients: z.array(z.string().min(1)).min(1),
  body: z.string(),
  channel: z.enum(["sms", "mms", "rcs", "whatsapp", "voice"]).optional(),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = BulkMessageSchema.safeParse(raw);

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

    const messages = await sendBulkMessages(validation.data);

    return NextResponse.json(
      { data: messages, error: null, meta: { count: messages.length } },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[smsit/messages/bulk POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "BULK_SEND_FAILED", message: "Failed to send bulk messages" }, meta: null },
      { status: 500, headers },
    );
  }
}
