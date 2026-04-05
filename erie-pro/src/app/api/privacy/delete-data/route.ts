// ── CCPA Data Deletion Request ─────────────────────────────────────────
// POST /api/privacy/delete-data
// Accepts data deletion requests per CCPA/CPRA requirements.
// Queues the request for manual processing within 45 days.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { MAX_BODY_SIZE, sanitizeText } from "@/lib/validation";
import { auth } from "@/lib/auth";

const DeleteDataSchema = z.object({
  email: z.string().email("Valid email is required").transform((e) => e.toLowerCase().trim()),
  reason: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit: treat as contact
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Authentication required. Please sign in to request data deletion." },
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

    const parsed = DeleteDataSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((e: { message: string }) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const { email, reason } = parsed.data;

    if (email !== session.user.email!.toLowerCase().trim()) {
      return NextResponse.json(
        { success: false, error: "You can only request deletion of data associated with your own account." },
        { status: 403 }
      );
    }

    // Store the request as a contact message with special niche tag
    await prisma.contactMessage.create({
      data: {
        name: "CCPA Data Deletion Request",
        email,
        message: sanitizeText(reason ?? "User requested deletion of all personal data per CCPA."),
        niche: "_ccpa_deletion",
        status: "unread",
      },
    });

    await audit({
      action: "admin.action",
      entityType: "provider",
      metadata: { type: "ccpa_deletion_request", email: email.replace(/(.{2}).*(@.*)/, "$1***$2") },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json({
      success: true,
      message:
        "Your data deletion request has been received. We will process it within 45 days as required by law. You will receive a confirmation email when complete.",
    });
  } catch (err) {
    logger.error("/api/privacy/delete-data", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
