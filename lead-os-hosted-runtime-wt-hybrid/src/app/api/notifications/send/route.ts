import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { sendNotification, sendBulk, type NotificationChannel } from "@/lib/integrations/notification-hub";

const CHANNELS: [NotificationChannel, ...NotificationChannel[]] = [
  "email", "sms", "push", "slack", "discord", "telegram", "webhook", "in-app",
];

const NotificationSchema = z.object({
  tenantId: z.string().min(1),
  recipientId: z.string().min(1),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  channel: z.enum(CHANNELS),
  template: z.string().min(1),
  data: z.record(z.string()).default({}),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

const SendSchema = z.union([
  NotificationSchema,
  z.object({ notifications: z.array(NotificationSchema).min(1).max(100) }),
]);

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const parsed = SendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid request body", details: parsed.error.issues },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    if ("notifications" in parsed.data) {
      const results = await sendBulk(parsed.data.notifications);
      return NextResponse.json(
        { data: { results, total: results.length }, error: null, meta: null },
        { status: 200, headers },
      );
    }

    const result = await sendNotification(parsed.data);
    const statusCode = result.status === "failed" ? 422 : 200;

    return NextResponse.json(
      {
        data: result,
        error: result.status === "failed"
          ? { code: "NOTIFICATION_FAILED", message: "Notification delivery failed" }
          : null,
        meta: null,
      },
      { status: statusCode, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "NOTIFICATION_ERROR", message: "Failed to send notification" }, meta: null },
      { status: 500, headers },
    );
  }
}
