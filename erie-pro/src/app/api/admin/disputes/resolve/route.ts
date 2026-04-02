// ── Admin Dispute Resolution API ─────────────────────────────────────
// POST /api/admin/disputes/resolve — Approve or deny a lead dispute
// Protected by session-based admin role check.

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { audit } from "@/lib/audit-log"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { MAX_BODY_SIZE } from "@/lib/validation"

const ResolveSchema = z.object({
  disputeId: z.string().min(1, "Dispute ID is required"),
  status: z.enum(["approved", "denied"], {
    error: "Status must be 'approved' or 'denied'",
  }),
  creditAmount: z.number().min(0).optional(),
})

export async function POST(req: NextRequest) {
  // Admin auth guard
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

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

    // Verify the dispute exists and is pending
    const existing = await prisma.leadDispute.findUnique({
      where: { id: disputeId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Dispute not found" },
        { status: 404 }
      )
    }
    if (existing.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Dispute already resolved as '${existing.status}'` },
        { status: 409 }
      )
    }

    // Update the dispute
    const updated = await prisma.leadDispute.update({
      where: { id: disputeId },
      data: {
        status,
        resolvedAt: new Date(),
        creditAmount: creditAmount ?? null,
      },
      include: {
        lead: { select: { firstName: true, lastName: true, niche: true } },
        provider: { select: { businessName: true, email: true } },
      },
    })

    // Record audit log
    await audit({
      action: "lead.dispute_resolved",
      entityType: "dispute",
      entityId: disputeId,
      providerId: existing.providerId,
      metadata: {
        status,
        creditAmount: creditAmount ?? null,
        leadId: existing.leadId,
        reason: existing.reason,
      },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    })

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
