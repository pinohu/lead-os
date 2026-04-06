// ── Consumer Lead Status API ──────────────────────────────────────────
// GET ?token=xxx  — single lead lookup by statusToken
// POST { email }  — all leads for an email (rate limited)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";

function formatLead(lead: {
  id: string;
  niche: string;
  routeType: string;
  createdAt: Date;
  slaDeadline: Date | null;
  routedTo: { businessName: string } | null;
  outcomes: { outcome: string; createdAt: Date }[];
}) {
  const latestOutcome = lead.outcomes[0]?.outcome ?? null;

  // Derive a consumer-friendly status
  let status: string;
  if (latestOutcome === "converted" || latestOutcome === "responded") {
    status = "Completed";
  } else if (latestOutcome === "no_response") {
    status = "Pending Response";
  } else if (lead.routedTo) {
    status = "Routed";
  } else {
    status = "Submitted";
  }

  return {
    id: lead.id,
    niche: lead.niche,
    status,
    routedTo: lead.routedTo?.businessName ?? null,
    createdAt: lead.createdAt.toISOString(),
    slaDeadline: lead.slaDeadline?.toISOString() ?? null,
    outcome: latestOutcome,
  };
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Missing token parameter" },
      { status: 400 }
    );
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { statusToken: token },
      include: {
        routedTo: { select: { businessName: true } },
        outcomes: {
          select: { outcome: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      leads: [formatLead(lead)],
    });
  } catch (err) {
    logger.error("api/lead-status", "GET error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  // Rate limit: 5 lookups per minute per IP
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  try {
    const email = session.user.email.toLowerCase().trim();

    const leads = await prisma.lead.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        routedTo: { select: { businessName: true } },
        outcomes: {
          select: { outcome: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      leads: leads.map(formatLead),
    });
  } catch (err) {
    logger.error("api/lead-status", "POST error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
