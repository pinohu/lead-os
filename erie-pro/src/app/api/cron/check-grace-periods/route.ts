// ── Grace Period Checker Cron ──────────────────────────────────────────
// Runs daily at 9 AM. Deactivates providers whose grace period has expired
// and sends reminder emails to providers approaching their deadline.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deactivatePerks } from "@/lib/perk-manager";
import { audit } from "@/lib/audit-log";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { requireCronAuth } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://erie.pro";

  try {
    // ── 1. Deactivate expired grace periods ───────────────────────
    const expiredProviders = await prisma.provider.findMany({
      where: {
        gracePeriodEndsAt: { lt: now },
        subscriptionStatus: "past_due",
      },
      include: { territories: { where: { deactivatedAt: null } } },
    });

    let deactivatedCount = 0;
    for (const provider of expiredProviders) {
      // Deactivate all active territories
      for (const territory of provider.territories) {
        await deactivatePerks(territory.niche, territory.city);
      }

      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          subscriptionStatus: "cancelled",
          gracePeriodEndsAt: null,
          churnedAt: now,
        },
      });

      await audit({
        action: "subscription.cancelled",
        entityType: "subscription",
        providerId: provider.id,
        metadata: { reason: "grace_period_expired" },
      });

      // Send final deactivation email
      sendEmail({
        to: provider.email,
        subject: "Territory deactivated \u2014 payment not received",
        html: `
          <p>Hi ${provider.businessName},</p>
          <p>Your Erie Pro territory has been deactivated because your payment was not received within the 7-day grace period.</p>
          <p>If you'd like to reactivate, you can update your payment information and re-subscribe:</p>
          <p><a href="${siteUrl}/for-business/claim">Reactivate Territory</a></p>
        `,
      }).catch((err) => { logger.error("cron/grace-periods", "Deactivation email failed", err) });

      deactivatedCount++;
    }

    // ── 2. Send reminder emails for upcoming expirations ──────────
    let remindersSent = 0;
    for (const daysOut of [3, 5]) {
      const targetDate = new Date(now.getTime() + daysOut * 24 * 60 * 60 * 1000);
      const windowStart = new Date(targetDate.getTime() - 12 * 60 * 60 * 1000);
      const windowEnd = new Date(targetDate.getTime() + 12 * 60 * 60 * 1000);

      const upcomingProviders = await prisma.provider.findMany({
        where: {
          gracePeriodEndsAt: { gte: windowStart, lte: windowEnd },
          subscriptionStatus: "past_due",
        },
      });

      for (const provider of upcomingProviders) {
        sendEmail({
          to: provider.email,
          subject: `Reminder: ${daysOut} days left to update payment`,
          html: `
            <p>Hi ${provider.businessName},</p>
            <p>You have <strong>${daysOut} days</strong> remaining to update your payment information before your Erie Pro territory is deactivated.</p>
            <p><a href="${siteUrl}/dashboard/billing">Update Payment Info</a></p>
          `,
        }).catch((err) => { logger.error("cron/grace-periods", "Reminder email failed", err) });

        remindersSent++;
      }
    }

    logger.info("cron/grace-periods", `Deactivated: ${deactivatedCount}, Reminders sent: ${remindersSent}`);

    return NextResponse.json({
      success: true,
      deactivated: deactivatedCount,
      remindersSent,
    });
  } catch (err) {
    logger.error("cron/grace-periods", "Error:", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
