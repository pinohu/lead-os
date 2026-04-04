import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { deliverWebhook, getWebhook } from "@/lib/webhook-registry";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const webhook = await getWebhook(id);

    if (!webhook) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Webhook not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "This is a test webhook delivery from CX React",
      webhookId: id,
    };

    const delivery = await deliverWebhook(id, "test.ping", testPayload);

    return NextResponse.json(
      { data: delivery, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send test webhook";
    return NextResponse.json(
      { data: null, error: { code: "TEST_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}
