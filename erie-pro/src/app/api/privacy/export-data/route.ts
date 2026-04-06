// ── GDPR/CCPA Data Export Endpoint ──────────────────────────────────
// POST /api/privacy/export-data
// Returns all personal data associated with an email address.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { MAX_BODY_SIZE } from "@/lib/validation";
import { auth } from "@/lib/auth";

const ExportDataSchema = z.object({
  email: z
    .string()
    .email("Valid email is required")
    .transform((e) => e.toLowerCase().trim()),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

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

    const parsed = ExportDataSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    if (session.user.email.toLowerCase() !== email) {
      return NextResponse.json(
        { success: false, error: "You can only export your own data" },
        { status: 403 }
      );
    }

    // ── Query all tables for matching data ───────────────────────
    const leads = await prisma.lead.findMany({
      where: { email },
      select: {
        id: true,
        niche: true,
        city: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        message: true,
        routeType: true,
        tcpaConsent: true,
        tcpaConsentAt: true,
        createdAt: true,
      },
    });

    const [contactMessages, leadOutcomes] = await Promise.all([
      prisma.contactMessage.findMany({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          message: true,
          niche: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.leadOutcome.findMany({
        where: { lead: { email } },
        select: {
          id: true,
          outcome: true,
          responseTimeSeconds: true,
          satisfactionRating: true,
          createdAt: true,
        },
      }),
    ]);

    // TrackedCall is keyed by phone number, not email.
    // Only query if we found a lead with a phone number on file.
    const phones = [...new Set(leads.map((l) => l.phone).filter((p): p is string => !!p))];
    const trackedCalls = phones.length > 0
      ? await prisma.trackedCall.findMany({
          where: { callerPhone: { in: phones } },
          select: {
            id: true,
            niche: true,
            callerPhone: true,
            duration: true,
            outcome: true,
            createdAt: true,
          },
        })
      : [];

    // ── Audit trail for the export request ───────────────────────
    await audit({
      action: "admin.action",
      entityType: "provider",
      metadata: {
        type: "gdpr_data_export",
        email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
        recordCounts: {
          leads: leads.length,
          contactMessages: contactMessages.length,
          leadOutcomes: leadOutcomes.length,
          trackedCalls: trackedCalls.length,
        },
      },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    logger.info("privacy/export-data", "Data export completed", {
      recordCount: leads.length + contactMessages.length + leadOutcomes.length + trackedCalls.length,
    });

    return NextResponse.json({
      success: true,
      exportedAt: new Date().toISOString(),
      data: {
        leads,
        contactMessages,
        leadOutcomes,
        trackedCalls,
      },
    });
  } catch (err) {
    logger.error("/api/privacy/export-data", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
