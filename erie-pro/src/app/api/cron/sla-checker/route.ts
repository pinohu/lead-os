// ── SLA Timeout Escalation Cron ────────────────────────────────────────
// Runs every 15 minutes. Checks for leads that have exceeded their SLA
// deadline without a response, and sends warnings / escalates.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSlaWarning } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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

    for (const lead of overdueLeads) {
      if (!lead.routedTo) continue;

      const elapsedMs = now.getTime() - lead.createdAt.getTime();
      const elapsedMinutes = Math.round(elapsedMs / 60000);

      if (elapsedMs >= escalationTimeoutMs) {
        // Second offense: 8+ hours — escalate to admin
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

    logger.info("cron/sla-checker", `Checked ${overdueLeads.length} overdue leads. Warnings: ${warningsSent}, Escalations: ${escalations}`);

    return NextResponse.json({
      success: true,
      overdueLeads: overdueLeads.length,
      warningsSent,
      escalations,
    });
  } catch (err) {
    logger.error("cron/sla-checker", "Error:", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
