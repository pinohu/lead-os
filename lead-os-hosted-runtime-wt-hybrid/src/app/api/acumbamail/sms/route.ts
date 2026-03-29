import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  sendSms,
  listSmsSent,
} from "@/lib/integrations/acumbamail-adapter";

const SendSmsSchema = z.object({
  to: z.string().min(1).max(50),
  body: z.string().min(1).max(1600),
  tenantId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const smsList = await listSmsSent(tenantId);

    return NextResponse.json(
      { data: smsList, error: null, meta: { count: smsList.length } },
      { headers },
    );
  } catch (err) {
    console.error("[acumbamail/sms GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch SMS" }, meta: null },
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
    const validation = SendSmsSchema.safeParse(raw);

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

    const { to, body, tenantId } = validation.data;
    const sms = await sendSms(to, body, tenantId);

    return NextResponse.json(
      { data: sms, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[acumbamail/sms POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "SEND_FAILED", message: "Failed to send SMS" }, meta: null },
      { status: 500, headers },
    );
  }
}
