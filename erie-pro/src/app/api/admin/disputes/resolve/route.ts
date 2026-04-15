// ── Admin Dispute Resolution API ─────────────────────────────────────
// POST /api/admin/disputes/resolve — Approve or deny a lead dispute
// Protected by session-based admin role check.

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { audit } from "@/lib/audit-log"
import { requireAdmin } from "@/lib/require-admin"
import { logger } from "@/lib/logger"
import { sendDisputeResolutionEmail } from "@/lib/email"
import { MAX_BODY_SIZE } from "@/lib/validation"
import { getClientIp } from "@/lib/client-ip"

const ResolveSchema = z.object({
  disputeId: z.string().min(1, "Dispute ID is required"),
  status: z.enum(["approved", "denied"], {
    error: "Status must be 'approved' or 'denied'",
  }),
  creditAmount: z.number().min(0).optional(),
})

export async function POST(req: NextRequest) {
  // Admin auth guard
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    // ── Body size check ──────────────────────────────────────────
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10)
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: "Request body too large" },
        { status: 413 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      )
    }

    const parsed = ResolveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues.map((e) => e.message).join("; "),
        },
        { status: 400 }
      )
    }

    const { disputeId, status, creditAmount } = parsed.data

    // Atomic claim pattern: the prior findUnique→check→update shape let
    // two concurrent admin clicks (approve + deny, or same button twice)
    // both observe status === "pending" before either wrote, so the
    // second update silently overwrote the first — losing one resolver's
    // audit intent and making final credit amount nondeterministic.
    // `updateMany` with a compound WHERE makes the DB the gate: exactly
    // one admin flips pending→resolved; concurrent losers see count === 0
    // and get the same 409 "already resolved" as a late click.
    const claim = await prisma.leadDispute.updateMany({
      where: { id: disputeId, status: "pending" },
      data: {
        status,
        resolvedAt: new Date(),
        creditAmount: creditAmount ?? null,
      },
    })

    if (claim.count === 0) {
      // Distinguish 404 (never existed) from 409 (already resolved).
      const existing = await prisma.leadDispute.findUnique({
        where: { id: disputeId },
        select: { status: true },
      })
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Dispute not found" },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, error: `Dispute already resolved as '${existing.status}'` },
        { status: 409 }
      )
    }

    // Fetch the resolved dispute with related data for the notification email.
    // `updateMany` doesn't support `include`, so this is a separate read —
    // no race here since the row is now in a terminal state (our atomic
    // update above is the only path that writes it post-resolve).
    const updated = await prisma.leadDispute.findUnique({
      where: { id: disputeId },
      include: {
        lead: { select: { firstName: true, lastName: true, niche: true } },
        provider: { select: { businessName: true, email: true } },
      },
    })
    if (!updated) {
      // Shouldn't happen — we just updated it — but bail defensively.
      return NextResponse.json(
        { success: false, error: "Dispute not found" },
        { status: 404 }
      )
    }

    // Record audit log
    await audit({
      action: "lead.dispute_resolved",
      entityType: "dispute",
      entityId: disputeId,
      providerId: updated.providerId,
      metadata: {
        status,
        creditAmount: creditAmount ?? null,
        leadId: updated.leadId,
        reason: updated.reason,
      },
      ipAddress: getClientIp(req),
    })

    // Notify the provider of the resolution outcome
    if (updated.provider?.email) {
      const leadName = [updated.lead?.firstName, updated.lead?.lastName]
        .filter(Boolean)
        .join(" ") || "Unknown"

      await sendDisputeResolutionEmail(
        updated.provider.email,
        updated.provider.businessName ?? "Provider",
        {
          status,
          leadName,
          niche: updated.lead?.niche ?? "service",
          creditAmount: creditAmount ?? null,
          reason: updated.reason,
        }
      ).catch((err) => {
        // Non-blocking: log but don't fail the resolution
        logger.error("/api/admin/disputes/resolve", "Failed to send resolution email:", err)
      })
    }

    return NextResponse.json({
      success: true,
      dispute: updated,
    })
  } catch (err) {
    logger.error("/api/admin/disputes/resolve", "Error:", err)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
