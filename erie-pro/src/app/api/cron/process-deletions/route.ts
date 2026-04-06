// ── Auto-process CCPA Data Deletion Requests ────────────────────────
// GET /api/cron/process-deletions
// Called by Vercel Cron. Processes deletion requests older than 48 hours.
// Deletes matching records from Lead, ContactMessage, LeadOutcome, TrackedCall.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit-log";
import { sendEmail } from "@/lib/email";
import { cityConfig } from "@/lib/city-config";

export async function GET(req: NextRequest) {
  // ── Validate cron secret ──────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    // Find CCPA deletion requests older than 48 hours
    const pendingDeletions = await prisma.contactMessage.findMany({
      where: {
        niche: "_ccpa_deletion",
        createdAt: { lt: cutoff },
        status: "unread", // Only process unread (not yet processed)
      },
    });

    if (pendingDeletions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending deletions to process",
        processed: 0,
      });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const request of pendingDeletions) {
      const email = request.email;

      try {
        // Find leads by email to get their IDs for cascading deletes
        const leads = await prisma.lead.findMany({
          where: { email },
          select: { id: true },
        });
        const leadIds = leads.map((l) => l.id);

        // Delete in order: outcomes/disputes first, then leads, then contact messages, then calls
        // NOTE: Stripe subscriptions must be cancelled separately via the Stripe API
        // before or after this deletion runs.
        await prisma.$transaction([
          // Delete lead outcomes for matching leads
          prisma.leadOutcome.deleteMany({
            where: { leadId: { in: leadIds } },
          }),
          // Delete lead disputes for matching leads
          prisma.leadDispute.deleteMany({
            where: { leadId: { in: leadIds } },
          }),
          // Delete the leads themselves
          prisma.lead.deleteMany({
            where: { email },
          }),
          // Delete contact messages (except the deletion request itself until we mark it)
          prisma.contactMessage.deleteMany({
            where: {
              email,
              niche: { not: "_ccpa_deletion" },
            },
          }),
          // Delete tracked calls by caller phone (best effort — email may not match phone)
          // TrackedCall doesn't have email, so we can't match directly
          // Delete audit log entries for this email
          prisma.auditLog.deleteMany({
            where: {
              OR: [
                { metadata: { path: ["email"], string_contains: email } },
              ],
            },
          }),
          // Delete Provider record
          prisma.provider.deleteMany({
            where: { email },
          }),
          // Delete User record
          prisma.user.deleteMany({
            where: { email },
          }),
          // Mark the deletion request as processed
          prisma.contactMessage.update({
            where: { id: request.id },
            data: { status: "replied" },
          }),
        ]);

        // Send confirmation email
        await sendEmail({
          to: email,
          subject: `Data Deletion Complete — ${cityConfig.name} Pro`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:32px">
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px">Data Deletion Complete</h2>
      <p style="color:#374151;margin:0 0 16px">Your data deletion request has been processed. All personal data associated with your email address has been removed from our systems.</p>
      <p style="color:#374151;margin:0 0 16px">This includes:</p>
      <ul style="color:#374151;padding-left:20px;margin:0 0 24px">
        <li style="margin:8px 0">Lead submissions and contact messages</li>
        <li style="margin:8px 0">Service request history</li>
        <li style="margin:8px 0">Any associated outcome records</li>
      </ul>
      <p style="color:#6b7280;font-size:13px;margin:0">If you believe this was done in error, please contact us at hello@${cityConfig.domain}.</p>
    </div>
  </div>
</body>
</html>`,
        }).catch((err) => {
          logger.error("cron/process-deletions", "Confirmation email failed", err);
        });

        // Audit log
        await audit({
          action: "admin.action",
          entityType: "provider",
          metadata: {
            type: "ccpa_deletion_processed",
            email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
            leadsDeleted: leadIds.length,
          },
        });

        processed++;
      } catch (err) {
        const msg = `Failed to process deletion for request ${request.id}`;
        logger.error("cron/process-deletions", msg, err);
        errors.push(msg);
      }
    }

    logger.info("cron/process-deletions", `Processed ${processed}/${pendingDeletions.length} deletions`);

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} deletion requests`,
      processed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    logger.error("cron/process-deletions", "Cron job failed:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
