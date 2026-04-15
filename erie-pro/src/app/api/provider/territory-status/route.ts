// ── Territory Pause/Resume API ────────────────────────────────────────
// PATCH /api/provider/territory-status — Pause or resume lead delivery
// for a specific territory owned by the authenticated provider.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getClientIp } from "@/lib/client-ip";

const TerritoryStatusSchema = z.object({
  territoryId: z.string().min(1),
  action: z.enum(["pause", "resume"]),
});

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
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parsed = TerritoryStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user?.providerId) {
      return NextResponse.json(
        { success: false, error: "No provider linked to this account" },
        { status: 403 }
      );
    }

    // Verify the territory belongs to this provider
    const territory = await prisma.territory.findUnique({
      where: { id: parsed.data.territoryId },
    });

    if (!territory || territory.providerId !== user.providerId) {
      return NextResponse.json(
        { success: false, error: "Territory not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isPause = parsed.data.action === "pause";

    // Toggle the USER-INITIATED pause field only. Do NOT touch
    // `deactivatedAt` — that field tracks subscription-level lifecycle
    // (cancellation, grace-period expiry, admin suspension). Previously
    // this endpoint wrote `deactivatedAt: null` on "resume", which let
    // a provider whose subscription had been cancelled silently revive
    // their territory without paying: cancellation → deactivatedAt set
    // by Stripe webhook → provider hits "resume" → deactivatedAt cleared
    // → territory active again. `isPaused` / `pausedAt` is the correct
    // surface for self-serve pausing; lead-routing already gates on
    // both `isPaused: false` AND `deactivatedAt: null` so either flag
    // being set is enough to stop lead delivery.
    await prisma.territory.update({
      where: { id: territory.id },
      data: {
        isPaused: isPause,
        pausedAt: isPause ? now : null,
      },
    });

    await audit({
      action: "admin.action",
      entityType: "territory",
      entityId: territory.id,
      providerId: user.providerId,
      metadata: {
        type: isPause ? "territory_paused" : "territory_resumed",
        niche: territory.niche,
        city: territory.city,
      },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      territory: {
        id: territory.id,
        isPaused: isPause,
        pausedAt: isPause ? now.toISOString() : null,
      },
    });
  } catch (err) {
    logger.error("/api/provider/territory-status", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
