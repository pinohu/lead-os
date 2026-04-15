// ── Lead Dispute API ──────────────────────────────────────────────────
// POST /api/disputes — File a dispute for a bad lead
// Requires authenticated provider session.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { MAX_BODY_SIZE, sanitizeText } from "@/lib/validation";

const DisputeSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  providerId: z.string().min(1, "Provider ID is required"),
  reason: z.enum(["wrong_number", "spam", "out_of_area", "duplicate", "other"], {
    error: "Invalid dispute reason",
  }),
  description: z.string().max(1000).transform((t) => sanitizeText(t)).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit: reuse contact limits (5/min)
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  // Auth check
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // ── Body size check ──────────────────────────────────────────
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: "Request body too large" },
        { status: 413 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parsed = DisputeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const { leadId, providerId, reason, description } = parsed.data;

    // Verify the user owns this provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (user?.providerId !== providerId) {
      return NextResponse.json(
        { success: false, error: "You can only dispute leads for your own territory" },
        { status: 403 }
      );
    }

    // Verify the lead exists and was routed to this provider
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });
    if (!lead || lead.routedToId !== providerId) {
      return NextResponse.json(
        { success: false, error: "Lead not found or not routed to your territory" },
        { status: 404 }
      );
    }

    // Create the dispute. The DB has a UNIQUE (leadId, providerId)
    // index backing this write, so the previous "findFirst then create"
    // dedupe — which was racy and let a provider win a double-credit by
    // submitting two disputes in parallel — is now collapsed into a
    // single atomic INSERT. A duplicate surfaces as Prisma P2002 and is
    // mapped to 409 so the caller sees the same "already filed" error.
    let dispute;
    try {
      dispute = await prisma.leadDispute.create({
        data: {
          leadId,
          providerId,
          reason,
          description: description ?? null,
          status: "pending",
        },
      });
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code;
      if (code === "P2002") {
        return NextResponse.json(
          { success: false, error: "A dispute has already been filed for this lead" },
          { status: 409 }
        );
      }
      throw err;
    }

    await audit({
      action: "lead.disputed",
      entityType: "dispute",
      entityId: dispute.id,
      providerId,
      metadata: { leadId, reason },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json({
      success: true,
      disputeId: dispute.id,
      message: "Dispute filed. We'll review it within 48 hours.",
    });
  } catch (err) {
    logger.error("/api/disputes", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
