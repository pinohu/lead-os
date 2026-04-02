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

export async function GET(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const provider = await prisma.provider.findFirst({
      where: { email: session.user.email ?? "" },
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
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const parsed = PrefsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid preferences format" },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findFirst({
      where: { email: session.user.email ?? "" },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    await prisma.provider.update({
      where: { id: provider.id },
      data: { notificationPrefs: parsed.data.prefs },
    });

    logger.info("Provider notification prefs updated", {
      providerId: provider.id,
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
