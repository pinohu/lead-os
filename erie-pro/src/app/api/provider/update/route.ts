// ── Provider Profile Update API ────────────────────────────────────────
// PATCH /api/provider/update — Update provider profile fields
// Requires authenticated provider session.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { sanitizeText, websiteUrlSchema, MAX_BODY_SIZE } from "@/lib/validation";
import { getClientIp } from "@/lib/client-ip";

const UpdateProfileSchema = z.object({
  businessName: z.string().min(2).max(200).transform(sanitizeText).optional(),
  phone: z.string().min(10).max(20).optional(),
  description: z.string().max(2000).transform(sanitizeText).optional(),
  // Lock to http/https only — bare z.url() would let a provider store
  // a `javascript:` URL that executes on click from the public profile
  // page's "Visit Website" link (stored XSS). See websiteUrlSchema.
  website: websiteUrlSchema.optional().nullable(),
  serviceAreas: z.array(z.string().max(100)).max(20).optional(),
  employeeCount: z.string().max(20).optional(),
  license: z.string().max(100).transform(sanitizeText).optional(),
  insurance: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "contact");
  if (rateLimited) return rateLimited;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
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

    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user?.providerId) {
      return NextResponse.json(
        { success: false, error: "No provider linked to this account" },
        { status: 403 }
      );
    }

    // Build update payload (only include provided fields)
    const updates: Record<string, unknown> = {};
    if (parsed.data.businessName !== undefined) updates.businessName = parsed.data.businessName;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.website !== undefined) updates.website = parsed.data.website;
    if (parsed.data.serviceAreas !== undefined) updates.serviceAreas = parsed.data.serviceAreas;
    if (parsed.data.employeeCount !== undefined) updates.employeeCount = parsed.data.employeeCount;
    if (parsed.data.license !== undefined) updates.license = parsed.data.license;
    if (parsed.data.insurance !== undefined) updates.insurance = parsed.data.insurance;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.provider.update({
      where: { id: user.providerId },
      data: updates,
    });

    await audit({
      action: "admin.action",
      entityType: "provider",
      entityId: user.providerId,
      providerId: user.providerId,
      metadata: { type: "profile_update", fields: Object.keys(updates) },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      provider: {
        id: updated.id,
        businessName: updated.businessName,
        phone: updated.phone,
        description: updated.description,
      },
    });
  } catch (err) {
    logger.error("/api/provider/update", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
