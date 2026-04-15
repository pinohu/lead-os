// ── Annual Membership Renewal Cron ─────────────────────────────────
// Runs daily. For each completed annual_membership CheckoutSession:
//   • Send a 30-day reminder email if completedAt is ~335d ago and we
//     haven't sent one yet.
//   • Send a 7-day reminder email if completedAt is ~358d ago and we
//     haven't sent one yet.
//   • Mark expired + send the lapsed-membership email if completedAt
//     is more than 365d ago and we haven't expired the row yet.
//
// Idempotent: each row carries timestamp columns
// (renewalReminder30SentAt, renewalReminder7SentAt, expiredAt) so
// repeat runs won't double-send.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  sendAnnualRenewalReminder,
  sendAnnualMembershipExpired,
} from "@/lib/email";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { requireCronAuth } from "@/lib/cron-auth";

const DAY_MS = 24 * 60 * 60 * 1000;
const TERM_DAYS = 365;

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req);
  if (unauthorized) return unauthorized;

  const now = new Date();
  // The cutoff dates are *upper bounds* — we want sessions completed
  // BEFORE the cutoff (i.e. old enough to need the reminder).
  const cutoff30 = new Date(now.getTime() - (TERM_DAYS - 30) * DAY_MS);
  const cutoff7 = new Date(now.getTime() - (TERM_DAYS - 7) * DAY_MS);
  const cutoffExpired = new Date(now.getTime() - TERM_DAYS * DAY_MS);

  let reminders30 = 0;
  let reminders7 = 0;
  let expirations = 0;

  try {
    // ── 30-day reminders ────────────────────────────────────────
    const due30 = await prisma.checkoutSession.findMany({
      where: {
        sessionType: "annual_membership",
        status: "completed",
        completedAt: { lt: cutoff30 },
        renewalReminder30SentAt: null,
        expiredAt: null,
      },
      take: 200,
    });

    for (const m of due30) {
      if (!m.completedAt) continue;
      const expiresOn = new Date(m.completedAt.getTime() + TERM_DAYS * DAY_MS);
      const daysLeft = Math.max(
        1,
        Math.round((expiresOn.getTime() - now.getTime()) / DAY_MS),
      );

      // Atomic claim on the reminder slot. findMany→send→update had
      // a two-cron window: two overlapping invocations (deploy race,
      // manual admin kick, Vercel retry after a timeout) both saw
      // renewalReminder30SentAt=null, both sent emails, both then
      // wrote the marker — double email to the subscriber and a
      // doubled audit row. Mark-first-then-send guarantees exactly
      // one caller wins the race; on send failure we null the marker
      // so the next cron retries.
      const claim = await prisma.checkoutSession.updateMany({
        where: { id: m.id, renewalReminder30SentAt: null },
        data: { renewalReminder30SentAt: now },
      });
      if (claim.count === 0) continue;

      const sent = await sendAnnualRenewalReminder(m.providerEmail, {
        daysLeft,
        expiresOn,
      }).catch((err) => {
        logger.error("cron/annual-renewal", "30d reminder send failed", err);
        return false;
      });

      if (!sent) {
        // Roll back the claim so the next cron pass retries.
        await prisma.checkoutSession
          .update({
            where: { id: m.id },
            data: { renewalReminder30SentAt: null },
          })
          .catch((err) =>
            logger.error("cron/annual-renewal", "30d claim rollback failed", err),
          );
        continue;
      }

      await audit({
        action: "annual.subscribed",
        entityType: "checkout_session",
        entityId: m.id,
        metadata: { step: "reminder_30d", daysLeft },
      }).catch((err) => {
        logger.error("cron/annual-renewal", "Audit failed (30d)", err);
      });
      reminders30++;
    }

    // ── 7-day reminders ─────────────────────────────────────────
    const due7 = await prisma.checkoutSession.findMany({
      where: {
        sessionType: "annual_membership",
        status: "completed",
        completedAt: { lt: cutoff7 },
        renewalReminder7SentAt: null,
        expiredAt: null,
      },
      take: 200,
    });

    for (const m of due7) {
      if (!m.completedAt) continue;
      const expiresOn = new Date(m.completedAt.getTime() + TERM_DAYS * DAY_MS);
      const daysLeft = Math.max(
        1,
        Math.round((expiresOn.getTime() - now.getTime()) / DAY_MS),
      );

      // Claim-then-send; see the 30d branch above for rationale.
      const claim = await prisma.checkoutSession.updateMany({
        where: { id: m.id, renewalReminder7SentAt: null },
        data: { renewalReminder7SentAt: now },
      });
      if (claim.count === 0) continue;

      const sent = await sendAnnualRenewalReminder(m.providerEmail, {
        daysLeft,
        expiresOn,
      }).catch((err) => {
        logger.error("cron/annual-renewal", "7d reminder send failed", err);
        return false;
      });

      if (!sent) {
        await prisma.checkoutSession
          .update({
            where: { id: m.id },
            data: { renewalReminder7SentAt: null },
          })
          .catch((err) =>
            logger.error("cron/annual-renewal", "7d claim rollback failed", err),
          );
        continue;
      }

      await audit({
        action: "annual.subscribed",
        entityType: "checkout_session",
        entityId: m.id,
        metadata: { step: "reminder_7d", daysLeft },
      }).catch((err) => {
        logger.error("cron/annual-renewal", "Audit failed (7d)", err);
      });
      reminders7++;
    }

    // ── Expirations (term complete) ─────────────────────────────
    const dueExpired = await prisma.checkoutSession.findMany({
      where: {
        sessionType: "annual_membership",
        status: "completed",
        completedAt: { lt: cutoffExpired },
        expiredAt: null,
      },
      take: 200,
    });

    for (const m of dueExpired) {
      if (!m.completedAt) continue;
      const expiredOn = new Date(m.completedAt.getTime() + TERM_DAYS * DAY_MS);

      // Atomic claim so concurrent cron passes can't both send the
      // lapsed-membership email. Unlike the reminder branches, we do
      // NOT roll back on send failure — the row state is the source
      // of truth for the admin inbox and we don't want to keep
      // retrying past term.
      const claim = await prisma.checkoutSession.updateMany({
        where: { id: m.id, expiredAt: null },
        data: { expiredAt: now },
      });
      if (claim.count === 0) continue;

      const sent = await sendAnnualMembershipExpired(
        m.providerEmail,
        expiredOn,
      ).catch((err) => {
        logger.error("cron/annual-renewal", "Expired email send failed", err);
        return false;
      });

      await audit({
        action: "annual.subscribed",
        entityType: "checkout_session",
        entityId: m.id,
        metadata: { step: "expired", emailSent: sent },
      }).catch((err) => {
        logger.error("cron/annual-renewal", "Audit failed (expired)", err);
      });

      expirations++;
    }

    logger.info(
      "cron/annual-renewal",
      `30d: ${reminders30}, 7d: ${reminders7}, expirations: ${expirations}`,
    );

    return NextResponse.json({
      success: true,
      reminders30,
      reminders7,
      expirations,
    });
  } catch (err) {
    logger.error("cron/annual-renewal", "Error:", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
