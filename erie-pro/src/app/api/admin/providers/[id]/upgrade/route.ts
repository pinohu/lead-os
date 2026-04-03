// ── Admin: Upgrade Provider Tier ──────────────────────────────────────
// POST /api/admin/providers/[id]/upgrade
// Body: { tier: "standard" | "premium" | "elite" }
// Updates the territory tier and logs audit.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";

const UpgradeSchema = z.object({
  tier: z.enum(["primary", "backup", "overflow"], {
    error: "Tier must be 'primary', 'backup', or 'overflow'",
  }),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = UpgradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid tier" },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    const { tier } = parsed.data;

    // Update the provider's tier
    await prisma.provider.update({
      where: { id },
      data: { tier },
    });

    // Update all active territories to the new tier
    await prisma.territory.updateMany({
      where: { providerId: id, deactivatedAt: null },
      data: { tier },
    });

    // Audit log
    await audit({
      action: "subscription.status_changed",
      entityType: "provider",
      entityId: id,
      metadata: {
        previousTier: provider.tier,
        newTier: tier,
        reason: "admin_upgrade",
      },
    });

    logger.info("admin/upgrade", `Provider ${id} (${provider.businessName}) tier changed to ${tier}`);

    return NextResponse.json({
      success: true,
      message: `Provider ${provider.businessName} tier updated to ${tier}`,
    });
  } catch (err) {
    logger.error("admin/upgrade", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
