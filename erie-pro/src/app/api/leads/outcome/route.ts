// ── Lead Outcome Recording API ────────────────────────────────────────
// POST /api/leads/outcome — Provider records what happened with a lead
// Requires authenticated provider session.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { MAX_BODY_SIZE } from "@/lib/validation";

const OutcomeSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  outcome: z.enum(["responded", "converted", "no_response", "declined", "cancelled"], {
    error: "Invalid outcome type",
  }),
  responseTimeSeconds: z.number().min(0).optional(),
  satisfactionRating: z.number().min(0).max(5).optional(),
});

export async function POST(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "leadPurchase");
  if (rateLimited) return rateLimited;

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

    const parsed = OutcomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const { leadId, outcome, responseTimeSeconds, satisfactionRating } = parsed.data;

    // Verify user owns a provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user?.providerId) {
      return NextResponse.json(
        { success: false, error: "No provider linked to this account" },
        { status: 403 }
      );
    }

    // Verify the lead was routed to this provider
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });
    if (!lead || lead.routedToId !== user.providerId) {
      return NextResponse.json(
        { success: false, error: "Lead not found or not routed to your territory" },
        { status: 404 }
      );
    }

    // Create outcome record
    const record = await prisma.leadOutcome.create({
      data: {
        leadId,
        providerId: user.providerId,
        outcome,
        responseTimeSeconds: responseTimeSeconds ?? null,
        satisfactionRating: satisfactionRating ?? null,
      },
    });

    // Update provider denormalized metrics using aggregate queries (not full table scan)
    const [convertedCount, avgMetrics] = await Promise.all([
      prisma.leadOutcome.count({
        where: { providerId: user.providerId, outcome: "converted" },
      }),
      prisma.leadOutcome.aggregate({
        where: { providerId: user.providerId },
        _avg: {
          responseTimeSeconds: true,
          satisfactionRating: true,
        },
        _count: {
          satisfactionRating: true,
        },
      }),
    ]);

    await prisma.provider.update({
      where: { id: user.providerId },
      data: {
        convertedLeads: convertedCount,
        avgResponseTime: avgMetrics._avg.responseTimeSeconds ?? 0,
        avgRating: avgMetrics._avg.satisfactionRating ?? 0,
        reviewCount: avgMetrics._count.satisfactionRating,
      },
    });

    await audit({
      action: "lead.routed",
      entityType: "lead",
      entityId: leadId,
      providerId: user.providerId,
      metadata: { outcome, responseTimeSeconds },
    });

    return NextResponse.json({
      success: true,
      outcomeId: record.id,
    });
  } catch (err) {
    logger.error("/api/leads/outcome", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
