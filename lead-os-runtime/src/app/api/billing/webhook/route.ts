import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { data: null, error: { code: "MISSING_SIGNATURE", message: "stripe-signature header is required" }, meta: null },
        { status: 400 },
      );
    }

    const payload = await request.text();

    const result = await handleStripeWebhook(payload, signature);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json(
      { data: null, error: { code: "WEBHOOK_ERROR", message }, meta: null },
      { status: 400 },
    );
  }
}
