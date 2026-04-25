// ── SLA Timeout Escalation Cron ────────────────────────────────────────
// Runs every 15 minutes. Checks for leads that have exceeded their SLA
// deadline without a response, and sends warnings / escalates.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSlaWarning } from "@/lib/notifications";
import { sendEmail, escapeHtml } from "@/lib/email";
import { logger } from "@/lib/logger";
import { reassignLead } from "@/lib/lead-routing";
import { audit } from "@/lib/audit-log";
import { requireCronAuth } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req);
  if (unauthorized) return unauthorized;

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
        // 8+ hours with no outcome — apply consequences.
        //
        // Idempotency: every subsequent cron pass (every 15 min) used
        // to re-increment slaViolationCount, re-spam the admin, and
        // re-attempt reassignment for the same stuck lead. That meant
        // ONE stuck lead could drive a provider from 1 violation to
        // the auto-suspend threshold (>=5) in about an hour without
        // them ever missing a second lead.
        //
        // Claim the escalation slot by atomically nulling slaDeadline
        // at the TOP of this branch (previously at the bottom). The
        // end-of-branch placement handled only the SEQUENTIAL case —
        // two concurrent cron invocations (Vercel retry after timeout,
        // manual admin kick, deploy overlap) both passed the outer
        // `slaDeadline: { lt: now }` filter before either wrote, and
        // both proceeded to increment slaViolationCount, send admin
        // mail, and run audit logs. With 2-3 overlapping passes a
        // single stuck lead could bump violationCount past the
        // auto-suspend threshold in one cron window. Moving the claim
        // up makes the DB the gate: exactly one caller flips
        // slaDeadline<now → null; losers see count === 0 and skip all
        // non-idempotent side effects below.
        const claim = await prisma.lead.updateMany({
          where: { id: lead.id, slaDeadline: { lt: now } },
          data: { slaDeadline: null },
        });
        if (claim.count === 0) continue;

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
              // Escape every user-controlled field — businessName and
              // email are set by the provider at claim time, so an
              // attacker with a claimed territory could embed HTML or
              // <script> in their business name, trigger an SLA
              // violation on purpose, and have it re-rendered in the
              // admin's inbox. Modern mail clients sandbox HTML, but
              // anywhere this alert is re-displayed (ticketing tools,
              // admin dashboards, webhook dumps) inherits the risk.
              const safeBusiness = escapeHtml(lead.routedTo.businessName);
              const safeEmail = escapeHtml(lead.routedTo.email);
              const safeLeadId = escapeHtml(lead.id);
              sendEmail({
                to: adminEmail,
                subject: `SLA Alert: ${safeBusiness} has ${violationCount} violations`,
                html: `
                  <p><strong>SLA Violation Alert</strong></p>
                  <p>Provider <strong>${safeBusiness}</strong> (${safeEmail}) now has <strong>${violationCount} SLA violations</strong>.</p>
                  <p>${violationCount >= 5 ? "Territory has been auto-paused." : "Consider reviewing this provider."}</p>
                  <p>Latest: Lead <code>${safeLeadId}</code> waited ${elapsedMinutes} minutes (${Math.round(elapsedMinutes / 60)} hours).</p>
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
          // Escape provider/lead fields in the admin-bound HTML — see
          // the note on the violation alert above for why.
          const safeBusiness = escapeHtml(lead.routedTo.businessName);
          const safeProviderEmail = escapeHtml(lead.routedTo.email);
          const safeLeadId = escapeHtml(lead.id);
          const safeNiche = escapeHtml(lead.niche);
          const safeCity = escapeHtml(lead.city);
          sendEmail({
            to: adminEmail,
            subject: `SLA Escalation: Lead ${safeLeadId} waiting ${elapsedMinutes} minutes`,
            html: `
              <p><strong>SLA Escalation Alert</strong></p>
              <p>Lead <code>${safeLeadId}</code> has been waiting <strong>${elapsedMinutes} minutes</strong> (${Math.round(elapsedMinutes / 60)} hours) without a response.</p>
              <p>Provider: ${safeBusiness} (${safeProviderEmail})</p>
              <p>Niche: ${safeNiche} | City: ${safeCity}</p>
            `,
          }).catch((err) => { logger.error("cron/sla-checker", "Escalation email failed", err) });
        }

        logger.warn("cron/sla-checker", `ESCALATION: Lead ${lead.id} — ${elapsedMinutes}min without response from ${lead.routedTo.id}`);
        escalations++;

        // NB: the slaDeadline=null claim already happened at the top of
        // this branch. If reassignLead ran and rewrote slaDeadline to a
        // fresh future timestamp, that value now lives on the lead row
        // and the next cron pass's `slaDeadline: { lt: now }` filter
        // will correctly skip this lead until the new deadline elapses.
      } else if (elapsedMs >= slaTimeoutMs) {
        // First offense: past SLA — send warning to provider.
        //
        // Dedup against repeat cron passes. This branch fires whenever
        // 30min < elapsed < 8h, which is a ~7.5-hour window. The cron
        // runs every 15 min, so without a gate the same stuck lead
        // would trigger ~30 warning emails to the same provider —
        // email-bomb UX and it burns Emailit budget. The escalation
        // branch above already uses the same `alreadyWarned`
        // Notification lookup (line ~63); mirror it here so the
        // warning fires exactly once per (provider, lead).
        const alreadyWarned = await prisma.notification.findFirst({
          where: {
            providerId: lead.routedTo.id,
            type: "sla_warning",
            message: { contains: lead.id },
          },
          select: { id: true },
        });
        if (alreadyWarned) continue;

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
