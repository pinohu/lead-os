"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import {
  sendConciergeAssignmentToPro,
  sendConciergeHandoffToRequester,
} from "@/lib/email";

async function requireAdmin(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/concierge");
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") redirect("/dashboard");
  const id =
    (session.user as { id?: string }).id ??
    (session.user as { email?: string }).email ??
    "unknown";
  return { id };
}

const AssignSchema = z.object({
  sessionId: z.string().min(1),
  providerId: z.string().min(1).optional().or(z.literal("")),
  opsNotes: z.string().max(2000).optional(),
});

/**
 * Assign an internal provider to a concierge job and/or update ops
 * notes. If providerId is empty string, the existing assignment is
 * cleared. Does NOT mark fulfilled — use markFulfilled for that.
 */
export async function assignConciergeJob(formData: FormData): Promise<void> {
  const { id: actor } = await requireAdmin();

  const parsed = AssignSchema.safeParse({
    sessionId: formData.get("sessionId"),
    providerId: formData.get("providerId"),
    opsNotes: formData.get("opsNotes"),
  });

  if (!parsed.success) {
    logger.warn("admin/concierge", "Invalid assign payload", parsed.error);
    return;
  }

  const { sessionId, providerId, opsNotes } = parsed.data;
  const normalizedProviderId =
    providerId && providerId.length > 0 ? providerId : null;

  // Snapshot the prior assignment so we only email when it actually
  // changes (otherwise editing notes would re-notify the pro).
  const existing = await prisma.checkoutSession.findUnique({
    where: { id: sessionId },
    select: {
      assignedProviderId: true,
      providerEmail: true,
      niche: true,
      city: true,
    },
  });

  await prisma.checkoutSession.update({
    where: { id: sessionId },
    data: {
      assignedProviderId: normalizedProviderId,
      opsNotes: opsNotes ?? null,
    },
  });

  const assignmentChanged =
    !!normalizedProviderId &&
    existing?.assignedProviderId !== normalizedProviderId;

  if (assignmentChanged) {
    const pro = await prisma.provider.findUnique({
      where: { id: normalizedProviderId },
      select: { email: true, businessName: true, phone: true },
    });

    if (pro) {
      await sendConciergeAssignmentToPro(pro.email, pro.businessName, {
        requesterEmail: existing?.providerEmail ?? "(unknown)",
        niche: existing?.niche ?? "concierge",
        city: existing?.city ?? "",
        opsNotes: opsNotes ?? null,
      }).catch((err) => {
        logger.error(
          "admin/concierge",
          "Failed to email assigned pro",
          err,
        );
      });

      if (existing?.providerEmail) {
        await sendConciergeHandoffToRequester(existing.providerEmail, {
          providerName: pro.businessName,
          providerPhone: pro.phone ?? null,
          niche: existing?.niche ?? "concierge",
        }).catch((err) => {
          logger.error(
            "admin/concierge",
            "Failed to email requester handoff",
            err,
          );
        });
      }
    } else {
      logger.warn(
        "admin/concierge",
        `Assigned provider ${normalizedProviderId} not found`,
      );
    }
  }

  await audit({
    action: "concierge.paid", // reuse — we track the assignment via metadata
    entityType: "checkout_session",
    entityId: sessionId,
    metadata: {
      step: "assigned",
      assignedProviderId: normalizedProviderId,
      assignmentChanged,
      opsNotesLength: opsNotes?.length ?? 0,
      actor,
    },
  }).catch((err) => {
    logger.error("admin/concierge", "Audit failed for assign", err);
  });

  revalidatePath("/admin/concierge");
}

const FulfillSchema = z.object({
  sessionId: z.string().min(1),
});

/**
 * Mark a concierge job as fulfilled — the requester has been handed
 * off to a pro. Sets fulfilledAt to now.
 */
export async function markConciergeFulfilled(formData: FormData): Promise<void> {
  const { id: actor } = await requireAdmin();

  const parsed = FulfillSchema.safeParse({
    sessionId: formData.get("sessionId"),
  });
  if (!parsed.success) {
    logger.warn("admin/concierge", "Invalid fulfill payload", parsed.error);
    return;
  }

  await prisma.checkoutSession.update({
    where: { id: parsed.data.sessionId },
    data: { fulfilledAt: new Date() },
  });

  await audit({
    action: "concierge.paid",
    entityType: "checkout_session",
    entityId: parsed.data.sessionId,
    metadata: { step: "fulfilled", actor },
  }).catch((err) => {
    logger.error("admin/concierge", "Audit failed for fulfill", err);
  });

  revalidatePath("/admin/concierge");
}

/**
 * Reopen a previously fulfilled concierge job — clears fulfilledAt.
 * Useful if the requester came back and said the pro didn't work out.
 */
export async function reopenConciergeJob(formData: FormData): Promise<void> {
  const { id: actor } = await requireAdmin();

  const parsed = FulfillSchema.safeParse({
    sessionId: formData.get("sessionId"),
  });
  if (!parsed.success) return;

  await prisma.checkoutSession.update({
    where: { id: parsed.data.sessionId },
    data: { fulfilledAt: null },
  });

  await audit({
    action: "concierge.paid",
    entityType: "checkout_session",
    entityId: parsed.data.sessionId,
    metadata: { step: "reopened", actor },
  }).catch((err) => {
    logger.error("admin/concierge", "Audit failed for reopen", err);
  });

  revalidatePath("/admin/concierge");
}
