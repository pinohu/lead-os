import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { ContactRequestSchema, formatZodErrors, MAX_BODY_SIZE } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendAdminContactAlert, sendListingOutreach } from "@/lib/email";
import { logger } from "@/lib/logger";
import { cityConfig } from "@/lib/city-config";

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

    const { name, email, phone, message, niche, listingId } = parsed.data;

    // Store contact message in database (Phase 1.5.11 fix)
    const contactMsg = await prisma.contactMessage.create({
      data: {
        name: name ?? null,
        email,
        phone: phone ?? null,
        message: message ?? null,
        niche: niche ?? null,
      },
    });

    // Notify admin via email (fire-and-forget, runs after response)
    after(async () => {
      try {
        const tasks: Promise<unknown>[] = [];

        // Admin alert
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          tasks.push(
            sendAdminContactAlert(adminEmail, {
              name: name ?? null,
              email,
              phone: phone ?? null,
              message: message ?? null,
              niche: niche ?? null,
              messageId: contactMsg.id,
            }).catch((err) => { logger.error("email", "Admin contact alert failed", err); })
          );
        }

        // Listing outreach: if this contact came from an unclaimed listing,
        // email the business owner to pitch claiming their listing.
        if (listingId) {
          try {
            const listing = await prisma.directoryListing.findUnique({
              where: { id: listingId },
              select: { id: true, businessName: true, niche: true, email: true, website: true },
            });

            if (listing && !listing.email) {
              logger.info("listing-outreach", `Listing ${listing.businessName} has no email — skipping outreach`);
            } else if (listing?.email) {
              // Count leads this month for this listing
              const monthStart = new Date();
              monthStart.setDate(1);
              monthStart.setHours(0, 0, 0, 0);
              const leadCount = await prisma.contactMessage.count({
                where: {
                  niche: listing.niche,
                  createdAt: { gte: monthStart },
                },
              });

              const claimUrl = `https://${cityConfig.domain}/for-business/claim?niche=${encodeURIComponent(listing.niche)}&listing=${encodeURIComponent(listing.id)}`;

              tasks.push(
                sendListingOutreach(listing.email, {
                  businessName: listing.businessName,
                  niche: listing.niche,
                  leadCount,
                  listingId: listing.id,
                  claimUrl,
                }).catch((err) => { logger.error("email", "Listing outreach failed", err); })
              );
            }
          } catch (err) {
            logger.error("listing-outreach", "Failed to look up listing for outreach", err);
          }
        }

        await Promise.allSettled(tasks);
      } catch (err) {
        logger.error("email", "Background email tasks failed", err);
      }
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
