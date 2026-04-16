// ── Provider Notification Preferences API ──────────────────────────────
// GET  /api/provider/notifications — Fetch current notification prefs
// PATCH /api/provider/notifications — Update notification prefs
// Requires authenticated provider session.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { MAX_BODY_SIZE } from "@/lib/validation";

const VALID_KEYS = [
  "new_leads",
  "sla_warnings",
  "payment_alerts",
  "weekly_digest",
  "marketing",
] as const;

const PrefsSchema = z.object({
  prefs: z.record(z.enum(VALID_KEYS), z.boolean()),
});

// Resolve the authenticated session to the Provider row the user
// actually owns. Previously both handlers did `provider.findFirst` by
// `session.user.email`, which was doubly wrong: (a) Provider.email is
// not unique, so users sharing an email (admin impersonation, shared
// inbox, data-entry collision) could end up editing another provider's
// prefs, and (b) the canonical link from user → provider is the
// `user.providerId` column set at claim/signup, which the email lookup
// bypasses entirely. Use the FK like every other authed provider
// endpoint so tenant isolation is airtight.
async function resolveOwnProviderId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { providerId: true },
  });
  return user?.providerId ?? null;
}

export async function GET(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const providerId = await resolveOwnProviderId(session.user.id);
    if (!providerId) {
      return NextResponse.json(
        { success: false, error: "No provider linked to this account" },
        { status: 403 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { notificationPrefs: true },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    const prefs =
      typeof provider.notificationPrefs === "object" && provider.notificationPrefs !== null
        ? provider.notificationPrefs
        : {};

    return NextResponse.json({ success: true, prefs });
  } catch (err) {
    logger.error("Failed to fetch notification prefs", { error: err });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: "Request body too large" },
        { status: 413 }
      );
    }

    const body = await req.json();
    const parsed = PrefsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid preferences format" },
        { status: 400 }
      );
    }

    const providerId = await resolveOwnProviderId(session.user.id);
    if (!providerId) {
      return NextResponse.json(
        { success: false, error: "No provider linked to this account" },
        { status: 403 }
      );
    }

    await prisma.provider.update({
      where: { id: providerId },
      data: { notificationPrefs: parsed.data.prefs },
    });

    logger.info("Provider notification prefs updated", {
      providerId,
      prefs: parsed.data.prefs,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Failed to update notification prefs", { error: err });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
