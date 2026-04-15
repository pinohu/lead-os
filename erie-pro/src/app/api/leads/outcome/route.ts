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

// Note: `satisfactionRating` and `responseTimeSeconds` are DELIBERATELY
// not accepted from the provider here. Both feed public-facing trust
// signals (provider.avgRating, provider.avgResponseTime) that inform
// directory ranking and lead routing — letting providers submit their
// own values would let them pad their metrics to look better than
// reality. Rating must come from a consumer-facing flow (post-job
// survey). Response time is derived server-side from lead.createdAt
// and the moment this endpoint receives the outcome.
const OutcomeSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  outcome: z.enum(["responded", "converted", "no_response", "declined", "cancelled"], {
    error: "Invalid outcome type",
  }),
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

    const { leadId, outcome } = parsed.data;

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

    // Server-computed response time so providers can't fake sub-minute
    // response times to lower their public avgResponseTime. The first
    // outcome submission freezes the value (preserved by upsert on
    // update); subsequent outcome changes (responded → converted) keep
    // the original first-response time.
    const nowMs = Date.now();
    const computedResponseSeconds = Math.max(
      0,
      Math.floor((nowMs - lead.createdAt.getTime()) / 1000)
    );

    // Upsert against the (leadId, providerId) unique index (see
    // schema + migration 20260415030000). Previously this was a raw
    // `create`, which let the same provider stack N outcome rows for
    // one lead — every "converted" row incremented the count aggregate,
    // inflating provider.convertedLeads as a ranking/trust signal.
    const record = await prisma.leadOutcome.upsert({
      where: { leadId_providerId: { leadId, providerId: user.providerId } },
      create: {
        leadId,
        providerId: user.providerId,
        outcome,
        responseTimeSeconds: computedResponseSeconds,
      },
      update: {
        // Only the outcome changes on re-submission (e.g.
        // responded → converted). responseTimeSeconds is intentionally
        // not updated — it was the real first-response latency and
        // must stay frozen.
        outcome,
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
      metadata: { outcome, responseTimeSeconds: record.responseTimeSeconds },
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
