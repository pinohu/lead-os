import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createSubscriber,
  getSubscriberByEmail,
} from "@/lib/integrations/acumbamail-adapter";

const CreateSubscriberSchema = z.object({
  email: z.string().email(),
  name: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  listId: z.string().min(1),
  customFields: z.record(z.string(), z.string()).optional(),
  tenantId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    if (email) {
      const subscriber = await getSubscriberByEmail(email);
      return NextResponse.json(
        { data: subscriber, error: null, meta: null },
        { headers },
      );
    }

    return NextResponse.json(
      { data: [], error: null, meta: { tenantId: tenantId ?? session.email } },
      { headers },
    );
  } catch (err) {
    logger.error("acumbamail/subscribers GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch subscribers" }, meta: null },
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
    const validation = CreateSubscriberSchema.safeParse(raw);

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

    const subscriber = await createSubscriber(validation.data);

    return NextResponse.json(
      { data: subscriber, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("acumbamail/subscribers POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create subscriber" }, meta: null },
      { status: 500, headers },
    );
  }
}
