// ── Consumer Lead Status API ──────────────────────────────────────────
// GET  ?token=xxx  — single lead lookup by statusToken (from email link)
// POST { email }   — email the consumer a list of status links for their
//                    requests. Previously this returned the raw lead
//                    history in the response body, which let any attacker
//                    who knew a victim's email enumerate their full
//                    service-request history (niches, providers, dates,
//                    statuses) — a PII leak / harassment vector. We now
//                    respond with an identical generic message regardless
//                    of whether any leads exist for the address, and only
//                    deliver the per-lead statusTokens to the inbox that
//                    can actually receive mail for the supplied email.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { sendLeadStatusSummary } from "@/lib/email";

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

// Constant-shape response used on every POST result. Returning the same
// body regardless of whether the email has any associated leads is what
// makes this endpoint enumeration-resistant — an attacker can no longer
// tell "this email is in our system" from "this email is not".
const GENERIC_POST_RESPONSE = {
  success: true,
  message:
    "If this email is associated with any service requests, we've sent status links to that inbox. Please check your email.",
};

export async function POST(req: NextRequest) {
  // Rate limit: 5 lookups per minute per IP. This also caps how fast an
  // attacker could trigger "please email my status" messages to victims.
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  try {
    const body = await req.json().catch(() => null);
    if (!body?.email || typeof body.email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const email = body.email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Look up the caller's leads. Nothing from this query is returned
    // to the HTTP response — it feeds the outbound email only, so an
    // attacker polling this endpoint with someone else's address
    // learns nothing about whether that person has any requests.
    const rawLeads = await prisma.lead.findMany({
      where: { email, statusToken: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        niche: true,
        statusToken: true,
        createdAt: true,
      },
    });

    // Narrow away the `string | null` from the schema — the `not: null`
    // filter above guarantees every row has a token, but TS can't see
    // that through Prisma's generated types.
    const leads = rawLeads.flatMap((l) =>
      l.statusToken
        ? [{ niche: l.niche, statusToken: l.statusToken, createdAt: l.createdAt }]
        : []
    );

    if (leads.length > 0) {
      // Respect the global suppression list so unsubscribed users don't
      // start receiving status summaries again. Failure to send (email
      // service down, suppressed recipient, etc.) is swallowed so the
      // outer response shape stays constant.
      const suppressed = await prisma.suppression.findFirst({
        where: { email },
        select: { id: true },
      });
      if (!suppressed) {
        try {
          await sendLeadStatusSummary(email, leads);
        } catch (err) {
          logger.error(
            "api/lead-status",
            "Failed to send status summary email:",
            err
          );
        }
      }
    }

    return NextResponse.json(GENERIC_POST_RESPONSE);
  } catch (err) {
    logger.error("api/lead-status", "POST error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
