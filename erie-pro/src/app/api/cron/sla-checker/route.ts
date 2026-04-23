// ── SLA Timeout Escalation Cron ────────────────────────────────────────
// Runs every 15 minutes. Checks for leads that have exceeded their SLA
// deadline without a response, and sends warnings / escalates.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSlaWarning } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { reassignLead } from "@/lib/lead-routing";
import { audit } from "@/lib/audit-log";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const slaTimeoutMs = 30 * 60 * 1000; // 30 minutes default
  const escalationTimeoutMs = 8 * 60 * 60 * 1000; // 8 hours for escalation

  try {
    // Find leads that were routed directly but have no outcome yet
    const overdueLeads = await prisma.lead.findMany({
      where: {
        routeType: { in: ["primary", "failover"] },
        routedToId: { not: null },
        slaDeadline: { lt: now },
        outcomes: { none: {} },
      },
      include: {
        routedTo: { select: { id: true, email: true, businessName: true } },
      },
      take: 100, // process in batches
    });

    let warningsSent = 0;
    let escalations = 0;
    let reassignments = 0;
    let suspensions = 0;

    for (const lead of overdueLeads) {
      if (!lead.routedTo) continue;

      const elapsedMs = now.getTime() - lead.createdAt.getTime();
      const elapsedMinutes = Math.round(elapsedMs / 60000);

      if (elapsedMs >= escalationTimeoutMs) {
        // 8+ hours with no outcome — apply consequences
        const providerId = lead.routedTo.id;

        // Check if we already sent a warning for this lead (avoid double-processing)
        const alreadyWarned = await prisma.notification.findFirst({
          where: {
            providerId,
            type: "sla_warning",
            message: { contains: lead.id },
          },
        });

        if (alreadyWarned) {
          // Increment SLA violation count on the provider
          const updatedProvider = await prisma.provider.update({
            where: { id: providerId },
            data: { slaViolationCount: { increment: 1 } },
          });

          const violationCount = updatedProvider.slaViolationCount;

          // Try to reassign to a backup provider
          const reassigned = await reassignLead(lead.id);
          if (reassigned.success) {
            await audit({
              action: "lead.routed",
              entityType: "lead",
              entityId: lead.id,
              providerId: reassigned.newProviderId,
              metadata: {
                reason: "sla_reassigned",
                originalProviderId: providerId,
                violationCount,
              },
            });
            reassignments++;
            logger.warn("cron/sla-checker", `REASSIGNED: Lead ${lead.id} from ${providerId} to ${reassigned.newProviderId}`);
          }

          // If 3+ violations, alert admin
          if (violationCount >= 3) {
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
              sendEmail({
                to: adminEmail,
                subject: `SLA Alert: ${lead.routedTo.businessName} has ${violationCount} violations`,
                html: `
                  <p><strong>SLA Violation Alert</strong></p>
                  <p>Provider <strong>${lead.routedTo.businessName}</strong> (${lead.routedTo.email}) now has <strong>${violationCount} SLA violations</strong>.</p>
                  <p>${violationCount >= 5 ? "Territory has been auto-paused." : "Consider reviewing this provider."}</p>
                  <p>Latest: Lead <code>${lead.id}</code> waited ${elapsedMinutes} minutes (${Math.round(elapsedMinutes / 60)} hours).</p>
                `,
              }).catch((err) => { logger.error("cron/sla-checker", "Admin alert email failed", err) });
            }
          }

          // If 5+ violations, auto-pause all territories
          if (violationCount >= 5) {
            await prisma.territory.updateMany({
              where: { providerId, isPaused: false },
              data: { isPaused: true, pausedAt: now },
            });

            await audit({
              action: "territory.paused",
              entityType: "provider",
              entityId: providerId,
              metadata: {
                reason: "provider.sla_suspended",
                violationCount,
                autoSuspended: true,
              },
            });

            suspensions++;
            logger.warn("cron/sla-checker", `SUSPENDED: Provider ${providerId} — ${violationCount} SLA violations, territories paused`);
          }
        }

        // Always send escalation email to admin
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          sendEmail({
            to: adminEmail,
            subject: `SLA Escalation: Lead ${lead.id} waiting ${elapsedMinutes} minutes`,
            html: `
              <p><strong>SLA Escalation Alert</strong></p>
              <p>Lead <code>${lead.id}</code> has been waiting <strong>${elapsedMinutes} minutes</strong> (${Math.round(elapsedMinutes / 60)} hours) without a response.</p>
              <p>Provider: ${lead.routedTo.businessName} (${lead.routedTo.email})</p>
              <p>Niche: ${lead.niche} | City: ${lead.city}</p>
            `,
          }).catch((err) => { logger.error("cron/sla-checker", "Escalation email failed", err) });
        }

        logger.warn("cron/sla-checker", `ESCALATION: Lead ${lead.id} — ${elapsedMinutes}min without response from ${lead.routedTo.id}`);
        escalations++;
      } else if (elapsedMs >= slaTimeoutMs) {
        // First offense: past SLA — send warning to provider
        const secondsRemaining = Math.max(0, Math.round((escalationTimeoutMs - elapsedMs) / 1000));
        await sendSlaWarning(lead.routedTo.id, lead.id, secondsRemaining);
        warningsSent++;
      }
    }

    logger.info("cron/sla-checker", `Checked ${overdueLeads.length} overdue leads. Warnings: ${warningsSent}, Escalations: ${escalations}, Reassignments: ${reassignments}, Suspensions: ${suspensions}`);

    return NextResponse.json({
      success: true,
      overdueLeads: overdueLeads.length,
      warningsSent,
      escalations,
      reassignments,
      suspensions,
    });
  } catch (err) {
    logger.error("cron/sla-checker", "Error:", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
