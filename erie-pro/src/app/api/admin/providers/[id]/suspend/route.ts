// ── Admin: Suspend Provider ───────────────────────────────────────────
// POST /api/admin/providers/[id]/suspend
// Sets subscriptionStatus to "suspended", deactivates all territories, logs audit.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";

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
    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    // Update provider status
    await prisma.provider.update({
      where: { id },
      data: { subscriptionStatus: "cancelled" },
    });

    // Deactivate all territories
    const now = new Date();
    await prisma.territory.updateMany({
      where: { providerId: id, deactivatedAt: null },
      data: { deactivatedAt: now, isPaused: true, pausedAt: now },
    });

    // Audit log
    await audit({
      action: "subscription.status_changed",
      entityType: "provider",
      entityId: id,
      metadata: {
        previousStatus: provider.subscriptionStatus,
        newStatus: "cancelled",
        reason: "admin_suspended",
      },
    });

    logger.info("admin/suspend", `Provider ${id} (${provider.businessName}) suspended by admin`);

    return NextResponse.json({
      success: true,
      message: `Provider ${provider.businessName} has been suspended`,
    });
  } catch (err) {
    logger.error("admin/suspend", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
