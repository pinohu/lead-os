// ── TCPA/CAN-SPAM Unsubscribe Endpoint ──────────────────────────────
// POST /api/unsubscribe — programmatic unsubscribe (JSON body)
// GET  /api/unsubscribe?email=x&token=y — email link one-click unsubscribe

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { createHash } from "crypto";

const UnsubscribeSchema = z
  .object({
    email: z.string().email().transform((e) => e.toLowerCase().trim()).optional(),
    phone: z.string().min(10).optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Email or phone required",
  });

/** Generate a simple HMAC token for email unsubscribe links */
function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("UNSUBSCRIBE_SECRET or NEXTAUTH_SECRET must be configured");
  return createHash("sha256").update(`${email}:${secret}`).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parsed = UnsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const { email, phone } = parsed.data;

    // Check if already suppressed
    const existing = await prisma.suppression.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "You have already been unsubscribed.",
      });
    }

    await prisma.suppression.create({
      data: {
        email: email ?? null,
        phone: phone ?? null,
        reason: "unsubscribe",
      },
    });

    logger.info("unsubscribe", "Contact suppressed", {
      hasEmail: !!email,
      hasPhone: !!phone,
    });

    return NextResponse.json({
      success: true,
      message: "You have been unsubscribed. You will no longer receive communications from us.",
    });
  } catch (err) {
    logger.error("/api/unsubscribe", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// GET handler for email link clicks: /api/unsubscribe?email=x&token=y
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.toLowerCase().trim();
  const token = searchParams.get("token");

  if (!email) {
    return new NextResponse(
      "<html><body><h1>Invalid Request</h1><p>Email parameter is required.</p></body></html>",
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  if (!token) {
    return new NextResponse(
      "<html><body><h1>Invalid Request</h1><p>Unsubscribe token is required.</p></body></html>",
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  // Validate token (prevents abuse)
  const expectedToken = generateUnsubscribeToken(email);
  if (token !== expectedToken) {
    return new NextResponse(
      "<html><body><h1>Invalid Token</h1><p>The unsubscribe link is invalid or expired.</p></body></html>",
      { status: 403, headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    // Check if already suppressed
    const existing = await prisma.suppression.findFirst({
      where: { email },
    });

    if (!existing) {
      await prisma.suppression.create({
        data: {
          email,
          reason: "unsubscribe",
        },
      });

      logger.info("unsubscribe", "Email suppressed via link", { hasEmail: true });
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://erie.pro").replace(/[&<>"']/g, "");

    return new NextResponse(
      `<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title></head>
<body style="margin:0;padding:40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;text-align:center">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:40px">
    <h1 style="color:#111827;font-size:24px;margin:0 0 16px">Unsubscribed</h1>
    <p style="color:#6b7280;margin:0 0 24px">You have been successfully unsubscribed. You will no longer receive communications from us.</p>
    <a href="${siteUrl}" style="color:#2563eb;text-decoration:underline">Return to homepage</a>
  </div>
</body>
</html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    logger.error("/api/unsubscribe", "GET error:", err);
    return new NextResponse(
      "<html><body><h1>Error</h1><p>Something went wrong. Please try again later.</p></body></html>",
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
