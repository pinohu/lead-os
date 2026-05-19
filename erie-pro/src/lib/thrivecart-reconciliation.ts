// erie-pro/src/lib/thrivecart-reconciliation.ts
// Unmatched ThriveCart events → admin reconciliation queue (critical path).

import type { Prisma } from "@/generated/prisma"
import { prisma } from "@/lib/db"

export type ReconciliationEnqueueInput = {
  thriveCartEventId: string
  reason: string
  suggestedAction?: string
  metadata?: Prisma.InputJsonValue
}

export async function enqueueThriveCartReconciliation(input: ReconciliationEnqueueInput) {
  const item = await prisma.thriveCartReconciliationItem.upsert({
    where: { thriveCartEventId: input.thriveCartEventId },
    create: {
      thriveCartEventId: input.thriveCartEventId,
      status: "unmatched",
      reason: input.reason,
      suggestedAction: input.suggestedAction ?? "manual_match_provider_or_refund",
      metadata: input.metadata ?? {},
    },
    update: {
      status: "unmatched",
      reason: input.reason,
      suggestedAction: input.suggestedAction ?? undefined,
      metadata: input.metadata ?? undefined,
    },
  })

  await prisma.thriveCartEvent.update({
    where: { id: input.thriveCartEventId },
    data: { reconciliationStatus: "unmatched" },
  })

  return item
}

export async function markThriveCartEventMatched({
  thriveCartEventId,
  providerSubscriptionId,
}: {
  thriveCartEventId: string
  providerSubscriptionId?: string
}) {
  await prisma.thriveCartReconciliationItem.updateMany({
    where: { thriveCartEventId, status: "unmatched" },
    data: {
      status: "manual_resolved",
      resolvedAt: new Date(),
      resolutionNotes: "Auto-matched during webhook processing",
    },
  })

  await prisma.thriveCartEvent.update({
    where: { id: thriveCartEventId },
    data: {
      reconciliationStatus: "matched",
      providerSubscriptionId: providerSubscriptionId ?? undefined,
    },
  })
}

export async function resolveReconciliationItem({
  itemId,
  resolvedBy,
  resolutionNotes,
  status = "manual_resolved",
}: {
  itemId: string
  resolvedBy: string
  resolutionNotes: string
  status?: "manual_resolved" | "ignored"
}) {
  const item = await prisma.thriveCartReconciliationItem.update({
    where: { id: itemId },
    data: {
      status,
      resolvedBy,
      resolvedAt: new Date(),
      resolutionNotes,
    },
    include: { thriveCartEvent: true },
  })

  await prisma.thriveCartEvent.update({
    where: { id: item.thriveCartEventId },
    data: { reconciliationStatus: status },
  })

  return item
}
