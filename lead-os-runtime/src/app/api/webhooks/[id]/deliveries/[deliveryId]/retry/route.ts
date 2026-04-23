import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getDelivery, getWebhook, deliverWebhook } from "@/lib/webhook-registry";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; deliveryId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { id, deliveryId } = await params;

    const webhook = await getWebhook(id);
    if (!webhook) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Webhook not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const delivery = await getDelivery(deliveryId);
    if (!delivery) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Delivery not found" }, meta: null },
        { status: 404, headers },
      );
    }

    if (delivery.endpointId !== id) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Delivery does not belong to this webhook" }, meta: null },
        { status: 400, headers },
      );
    }

    const newDelivery = await deliverWebhook(id, delivery.event, delivery.payload);

    return NextResponse.json(
      { data: newDelivery, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retry delivery";
    return NextResponse.json(
      { data: null, error: { code: "RETRY_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}
