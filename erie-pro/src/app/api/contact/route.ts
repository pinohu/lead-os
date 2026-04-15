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
        //
        // This path was previously a mail-bomb vector: any visitor could
        // POST /api/contact with an arbitrary listingId and the listing
        // owner would receive an outreach email for each submission.
        // IP rate limits alone didn't help, since an attacker can rotate
        // IPs but still target the same victim listing. We now enforce a
        // per-listing cooldown via an atomic `updateMany` guarded by
        // `lastOutreachAt` — only the request that actually flips the
        // timestamp proceeds to send the email, so at most one outreach
        // lands per listing per cooldown window.
        const OUTREACH_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
        if (listingId) {
          try {
            const listing = await prisma.directoryListing.findUnique({
              where: { id: listingId },
              select: { id: true, businessName: true, niche: true, email: true, website: true, claimedByProviderId: true },
            });

            if (!listing) {
              // unknown listing — nothing to do
            } else if (listing.claimedByProviderId) {
              // Already claimed; the owner doesn't need a pitch email.
            } else if (!listing.email) {
              logger.info(
                "listing-outreach",
                `Listing ${listing.businessName} has no email — skipping outreach`
              );
            } else {
              // Atomic claim of the outreach slot for this listing.
              // Only the request whose updateMany affects one row is
              // allowed to send; all others see 0 and skip.
              const cutoff = new Date(Date.now() - OUTREACH_COOLDOWN_MS);
              const claimed = await prisma.directoryListing.updateMany({
                where: {
                  id: listing.id,
                  OR: [
                    { lastOutreachAt: null },
                    { lastOutreachAt: { lt: cutoff } },
                  ],
                },
                data: { lastOutreachAt: new Date() },
              });

              if (claimed.count > 0) {
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
                  }).catch((err) => {
                    logger.error("email", "Listing outreach failed", err);
                  })
                );
              }
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
