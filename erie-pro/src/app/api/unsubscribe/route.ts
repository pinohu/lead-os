// ── TCPA/CAN-SPAM Unsubscribe Endpoint ──────────────────────────────
// POST /api/unsubscribe — programmatic unsubscribe (JSON body)
// GET  /api/unsubscribe?email=x&token=y — email link one-click unsubscribe

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeEqual } from "@/lib/timing-safe";
import { generateUnsubscribeToken } from "@/lib/unsubscribe-token";
import { auth } from "@/lib/auth";

const UnsubscribeSchema = z
  .object({
    email: z.string().email().transform((e) => e.toLowerCase().trim()).optional(),
    phone: z.string().min(10).optional(),
    token: z.string().min(1).optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Email or phone required",
  });

export async function POST(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  try {
    // Accept either JSON body (programmatic) or form-encoded body
    // (RFC 8058 email-client one-click unsubscribe). For one-click,
    // the token/email live in the query string; pull them too.
    const contentType = req.headers.get("content-type") ?? "";
    let rawEmail: string | undefined;
    let rawPhone: string | undefined;
    let rawToken: string | undefined;

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object") {
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
      rawEmail = parsed.data.email;
      rawPhone = parsed.data.phone;
      rawToken = parsed.data.token;
    }

    // Also honour ?email=...&token=... query params so RFC 8058
    // one-click POSTs (which deliver "List-Unsubscribe=One-Click" in
    // the body and identify the recipient via query) work correctly.
    const { searchParams } = new URL(req.url);
    if (!rawEmail) rawEmail = searchParams.get("email")?.toLowerCase().trim() || undefined;
    if (!rawToken) rawToken = searchParams.get("token") ?? undefined;

    if (!rawEmail && !rawPhone) {
      return NextResponse.json(
        { success: false, error: "Email or phone required" },
        { status: 400 }
      );
    }

    // ── Authorization ────────────────────────────────────────────
    // Without this gate the endpoint is a harassment / deliverability
    // DoS vector: any unauthenticated attacker could POST an email and
    // permanently suppress it — victim never receives another
    // transactional email. Require ONE of:
    //   (a) a valid per-email unsubscribe token (same mechanism as
    //       the GET email-link flow, and what RFC 8058 one-click
    //       effectively carries via the List-Unsubscribe URL), OR
    //   (b) an authenticated session owned by the target email (user
    //       unsubscribing themselves from a logged-in preferences UI).
    // The phone-only path is guarded by (b) — no per-phone tokens
    // exist today, so phone suppressions require an auth'd session.
    let authorized = false;
    if (rawEmail && rawToken) {
      const expected = generateUnsubscribeToken(rawEmail);
      if (safeEqual(rawToken, expected)) authorized = true;
    }
    if (!authorized) {
      const session = await auth();
      const sessionEmail = session?.user?.email?.toLowerCase().trim();
      if (sessionEmail && rawEmail && sessionEmail === rawEmail) {
        authorized = true;
      } else if (sessionEmail && rawPhone && !rawEmail) {
        // Authenticated user requesting to suppress a phone — only
        // allowed if that phone is registered to their provider
        // record. This avoids letting a logged-in user suppress an
        // arbitrary phone number for harassment.
        const user = await prisma.user.findUnique({ where: { email: sessionEmail } });
        if (user?.providerId) {
          const provider = await prisma.provider.findUnique({
            where: { id: user.providerId },
            select: { phone: true },
          });
          if (provider?.phone && provider.phone === rawPhone) authorized = true;
        }
      }
    }

    if (!authorized) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized. Use the unsubscribe link from your most recent email, or sign in to manage preferences.",
        },
        { status: 403 }
      );
    }

    // Check if already suppressed
    const existing = await prisma.suppression.findFirst({
      where: {
        OR: [
          ...(rawEmail ? [{ email: rawEmail }] : []),
          ...(rawPhone ? [{ phone: rawPhone }] : []),
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
        email: rawEmail ?? null,
        phone: rawPhone ?? null,
        reason: "unsubscribe",
      },
    });

    logger.info("unsubscribe", "Contact suppressed", {
      hasEmail: !!rawEmail,
      hasPhone: !!rawPhone,
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

  try {
    // Always require a valid token. Without this gate, anyone who knew/guessed
    // an email could unsubscribe legitimate users (harassment / DOS vector).
    // generateUnsubscribeToken throws if no secret is configured — we let that
    // propagate into the shared catch rather than returning a misleading 403.
    const expectedToken = generateUnsubscribeToken(email);
    if (!token || !safeEqual(token, expectedToken)) {
      return new NextResponse(
        "<html><body><h1>Invalid or Missing Token</h1><p>The unsubscribe link is invalid or expired. If you wish to unsubscribe, please use the link from your most recent email or contact support.</p></body></html>",
        { status: 403, headers: { "Content-Type": "text/html" } }
      );
    }

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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://erie.pro";

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
