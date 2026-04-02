import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ContactRequestSchema, formatZodErrors, MAX_BODY_SIZE } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    // ── Rate limit: 5 contacts per minute per IP ─────────────────
    const rateLimited = await checkRateLimit(req, "contact");
    if (rateLimited) return rateLimited;

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

    // ── Zod validation (sanitizes text, lowercases email) ────────
    const parsed = ContactRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodErrors(parsed.error) },
        { status: 400 }
      );
    }

    const { name, email, phone, message, niche } = parsed.data;

    // Store contact message in database (Phase 1.5.11 fix)
    await prisma.contactMessage.create({
      data: {
        name: name ?? null,
        email,
        phone: phone ?? null,
        message: message ?? null,
        niche: niche ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Thank you for contacting us. We'll be in touch within 24 hours.",
    });
  } catch (err) {
    logger.error("/api/contact", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
