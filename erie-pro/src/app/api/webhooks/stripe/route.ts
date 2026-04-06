// ── Stripe Webhook Endpoint ─────────────────────────────────────────
// Handles Stripe events for subscription lifecycle management.
// Signature verification ensures only Stripe can call this endpoint.

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  constructWebhookEvent,
  handleStripeWebhook,
  isStripeDryRun,
  getCheckoutSession,
  getMonthlyFee,
} from "@/lib/stripe-integration";
import { prisma } from "@/lib/db";
import type { SubscriptionStatus } from "@/generated/prisma";
import { activatePerks, deactivatePerks } from "@/lib/perk-manager";
import { deliverBankedLeads } from "@/lib/lead-routing";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { sendWelcomeEmail, sendEmail, sendEmailVerification, sendClaimVerificationCode, sendAdminVerificationAlert, escapeHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";

    // ── Dry-run mode: accept mock events ─────────────────────────
    if (isStripeDryRun()) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Server misconfigured: Stripe not configured for production" },
          { status: 500 }
        );
      }

      let mockEvent;
      try {
        mockEvent = JSON.parse(rawBody);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid JSON body" },
          { status: 400 }
        );
      }

      // Handle mock events in dry-run mode
      if (mockEvent.type === "checkout.session.completed") {
        const sessionId = mockEvent.data?.object?.id;
        if (sessionId) {
          await handleCheckoutCompleted(sessionId);
        }
      }

      return NextResponse.json({
        received: true,
        mode: "dry-run",
        type: mockEvent.type,
      });
    }

    // ── Production: verify Stripe signature ──────────────────────
    const event = constructWebhookEvent(rawBody, signature);
    if (!event) {
      logger.warn("webhook/stripe", "Invalid signature — rejected");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Idempotency: check if we already processed this event (any action)
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        metadata: { path: ["stripeEventId"], equals: event.id },
      },
    });
    if (existingLog) {
      logger.info("webhook/stripe", "Duplicate event skipped:", event.id);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Handle the event
    const result = await handleStripeWebhook(event);

    // ── 2.3: Handle payment failure — set grace period instead of immediate deactivation
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const customerId = invoice && "customer" in invoice ? (invoice.customer as string) : null;

      if (customerId) {
        const provider = await prisma.provider.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true, email: true, businessName: true, gracePeriodEndsAt: true },
        });

        if (provider) {
          // Set 7-day grace period (only if not already in one)
          const gracePeriodEndsAt = provider.gracePeriodEndsAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

          await prisma.provider.update({
            where: { id: provider.id },
            data: {
              subscriptionStatus: "past_due",
              gracePeriodEndsAt,
            },
          });

          const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://erie.pro";
          sendEmail({
            to: provider.email,
            subject: "Payment failed \u2014 7-day grace period started",
            html: `
              <p>Hi ${escapeHtml(provider.businessName)},</p>
              <p>Your most recent payment for your Erie Pro territory subscription has failed.</p>
              <p>You have a <strong>7-day grace period</strong> to update your payment information before your territory is deactivated.</p>
              <p><a href="${siteUrl}/dashboard/billing">Update Payment Info</a></p>
              <p>If you have questions, reply to this email or contact our support team.</p>
            `,
          }).catch((err) => { logger.error("stripe-webhook", "Failed to send dunning email", err) });

          await audit({
            action: "subscription.payment_failed",
            entityType: "subscription",
            providerId: provider.id,
            metadata: { stripeEventId: event.id, gracePeriodEndsAt: gracePeriodEndsAt.toISOString() },
          }).catch((err) => { logger.error("stripe-webhook", "Failed to audit payment failure", err) });
        }
      }
    }

    // Additional logic for checkout completion
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session && "id" in session) {
        await handleCheckoutCompleted(session.id as string, event.id);
      }
    }

    // Handle subscription status changes (trial→active, active→past_due, etc.)
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object;
      if (sub && "customer" in sub) {
        const customerId = sub.customer as string;
        const status = "status" in sub ? (sub.status as string) : null;
        const cancelAtPeriodEnd = "cancel_at_period_end" in sub ? (sub.cancel_at_period_end as boolean) : false;

        const provider = await prisma.provider.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true, email: true, businessName: true, subscriptionStatus: true },
        });

        if (provider && status) {
          // Map Stripe status to our subscription status
          const statusMap: Record<string, SubscriptionStatus> = {
            active: "active",
            trialing: "trial",
            past_due: "past_due",
            canceled: "cancelled",
            unpaid: "past_due",
            incomplete: "trial",
            incomplete_expired: "expired",
          };

          const newStatus: SubscriptionStatus = statusMap[status] ?? provider.subscriptionStatus;

          if (newStatus !== provider.subscriptionStatus || cancelAtPeriodEnd) {
            await prisma.provider.update({
              where: { id: provider.id },
              data: { subscriptionStatus: newStatus },
            });

            await audit({
              action: "subscription.status_changed",
              entityType: "subscription",
              providerId: provider.id,
              metadata: {
                stripeEventId: event.id,
                oldStatus: provider.subscriptionStatus,
                newStatus,
                cancelAtPeriodEnd,
              },
            });

            logger.info("webhook/stripe", `Subscription updated for ${provider.id}: ${provider.subscriptionStatus} → ${newStatus}`);

            // 2.4: Auto-reactivate when payment recovers from past_due → active
            if (newStatus === "active" && provider.subscriptionStatus === "past_due") {
              // Clear grace period
              await prisma.provider.update({
                where: { id: provider.id },
                data: { gracePeriodEndsAt: null },
              });

              // Re-activate territories that were deactivated during grace period
              const territories = await prisma.territory.findMany({
                where: { providerId: provider.id, deactivatedAt: { not: null } },
                orderBy: { deactivatedAt: "desc" },
                take: 5, // reasonable limit
              });

              for (const territory of territories) {
                await activatePerks(
                  territory.niche,
                  territory.city,
                  provider.id,
                  provider.businessName,
                  "standard"
                );
              }

              const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://erie.pro";
              sendEmail({
                to: provider.email,
                subject: "Payment received \u2014 your territory is active again!",
                html: `
                  <p>Hi ${escapeHtml(provider.businessName)},</p>
                  <p>Great news! Your payment has been processed successfully and your Erie Pro territory is active again.</p>
                  <p>Leads are now being routed to you. Check your dashboard for any new leads:</p>
                  <p><a href="${siteUrl}/dashboard">Go to Dashboard</a></p>
                `,
              }).catch((err) => { logger.error("stripe-webhook", "Reactivation email failed", err) });

              logger.info("webhook/stripe", `Auto-reactivated territories for provider ${provider.id} after payment recovery`);
            }

            // Notify provider if subscription is at risk
            if (newStatus === "past_due") {
              sendEmail({
                to: provider.email,
                subject: "Your subscription is past due — action required",
                html: `
                  <p>Hi ${escapeHtml(provider.businessName)},</p>
                  <p>Your Erie Pro territory subscription is now past due. Your territory may be deactivated if payment is not received.</p>
                  <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://erie.pro"}/dashboard/settings">Update Payment Info</a></p>
                `,
              }).catch((err) => { logger.error("stripe-webhook", "Past due notification failed", err) });
            }
          }
        }
      }
    }

    // Handle subscription cancellation — deactivate perks
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      if (sub && "metadata" in sub) {
        const metadata = (sub as { metadata?: Record<string, string> }).metadata;
        if (metadata?.niche && metadata?.city && metadata?.providerId) {
          await deactivatePerks(metadata.niche, metadata.city);

          await audit({
            action: "subscription.cancelled",
            entityType: "subscription",
            providerId: metadata.providerId,
            metadata: { stripeEventId: event.id },
          });
        }
      }
    }

    return NextResponse.json({
      received: true,
      handled: result.handled,
      type: result.eventType,
    });
  } catch (err) {
    logger.error("webhook/stripe", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle a completed checkout session:
 * 1. Find the checkout session in our DB
 * 2. Activate the provider's subscription
 * 3. Create/activate the territory
 * 4. Link or create the User account for dashboard access
 * 5. Deliver any banked leads
 */
async function handleCheckoutCompleted(
  stripeSessionId: string,
  stripeEventId?: string
): Promise<void> {
  const checkoutSession = await getCheckoutSession(stripeSessionId);
  if (!checkoutSession) return;

  if (checkoutSession.sessionType === "territory_claim") {
    // 2.1: Find existing provider OR create one from checkout metadata
    let provider = await prisma.provider.findFirst({
      where: { email: checkoutSession.providerEmail },
    });

    const isNewProvider = !provider;

    if (!provider) {
      // Provider record is missing (e.g., claim form succeeded but provider
      // creation failed). Create from the checkout session metadata.
      const slug = (checkoutSession.providerName ?? "provider")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        + "-" + Date.now().toString(36);

      provider = await prisma.provider.create({
        data: {
          slug,
          businessName: checkoutSession.providerName ?? "Unnamed Business",
          niche: checkoutSession.niche,
          city: checkoutSession.city ?? "erie",
          phone: "",
          email: checkoutSession.providerEmail,
          monthlyFee: checkoutSession.monthlyFee ?? getMonthlyFee(checkoutSession.niche),
          subscriptionStatus: "active",
          stripeSubscriptionId: stripeSessionId,
          emailVerified: false,
        },
      });

      await audit({
        action: "provider.created",
        entityType: "provider",
        entityId: provider.id,
        providerId: provider.id,
        metadata: { source: "stripe_webhook_recovery", stripeEventId },
      });

      logger.info("webhook/stripe", "Created missing provider from checkout metadata:", provider.id);
    }

    // Wrap critical DB operations in a transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Activate provider subscription
      await tx.provider.update({
        where: { id: provider.id },
        data: {
          subscriptionStatus: "active",
          stripeSubscriptionId: stripeSessionId,
          // 2.2: New providers start unverified
          ...(isNewProvider ? { emailVerified: false } : {}),
        },
      });

      // Create or link User account for dashboard access
      const existingUser = await tx.user.findUnique({
        where: { email: provider.email },
      });

      if (!existingUser) {
        await tx.user.create({
          data: {
            email: provider.email,
            name: provider.businessName,
            role: "provider",
            providerId: provider.id,
          },
        });
        logger.info("webhook/stripe", "Created user account for provider:", provider.id);
      } else if (!existingUser.providerId) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: { providerId: provider.id },
        });
      }

      // Mark checkout session as completed (inside transaction)
      await tx.checkoutSession.updateMany({
        where: { stripeSessionId },
        data: { status: "completed", completedAt: new Date() },
      });
    });

    // 2.2: Send email verification if provider is not yet verified
    if (!provider.emailVerified) {
      const token = crypto.randomUUID();
      await prisma.provider.update({
        where: { id: provider.id },
        data: { emailVerifyToken: token },
      });
      sendEmailVerification(provider.email, token).catch((err) => {
        logger.error("stripe-webhook", "Failed to send verification email", err);
      });
      logger.info("webhook/stripe", "Sent email verification to provider:", provider.id);
    }

    // These run after the transaction succeeds — they have side effects
    // (external APIs, email sends) that shouldn't be in a DB transaction

    // Activate territory and perks
    await activatePerks(
      checkoutSession.niche,
      checkoutSession.city,
      provider.id,
      provider.businessName,
      "standard"
    );

    // Deliver any banked leads to the new provider
    const actualDelivered = await deliverBankedLeads(
      checkoutSession.niche,
      checkoutSession.city,
      provider.id
    );

    await audit({
      action: "territory.claimed",
      entityType: "territory",
      entityId: `${checkoutSession.niche}:${checkoutSession.city}`,
      providerId: provider.id,
      metadata: {
        niche: checkoutSession.niche,
        city: checkoutSession.city,
        bankedLeadsDelivered: actualDelivered,
        stripeEventId,
      },
    });

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(
      provider.email,
      provider.businessName,
      checkoutSession.niche,
      actualDelivered
    ).catch((err) => { logger.error("stripe-webhook", "Failed to process webhook task", err) });

    // ── Ownership Verification Flow ─────────────────────────────
    // If already auto-verified (email domain matched), skip.
    // If listing has email, auto-send verification code.
    // Otherwise, flag for admin review.
    const freshProvider = await prisma.provider.findUnique({
      where: { id: provider.id },
      select: { verificationStatus: true, claimedListingId: true },
    });

    if (freshProvider && !["verified", "auto_verified", "admin_approved"].includes(freshProvider.verificationStatus)) {
      if (freshProvider.claimedListingId) {
        const listing = await prisma.directoryListing.findUnique({
          where: { id: freshProvider.claimedListingId },
          select: { email: true, businessName: true },
        });

        if (listing?.email) {
          // Auto-send verification code to listing's email
          const code = crypto.randomInt(100000, 999999).toString();
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
          await prisma.provider.update({
            where: { id: provider.id },
            data: {
              verificationCode: code,
              verificationCodeExp: expiresAt,
              verificationStatus: "pending",
              verificationAttempts: 1,
            },
          });
          sendClaimVerificationCode(listing.email, listing.businessName, code, provider.businessName)
            .catch((err) => logger.error("stripe-webhook", "Verification code send failed", err));
          logger.info("webhook/stripe", `Auto-sent verification code for provider ${provider.id}`);
        } else {
          // No listing email — flag for admin
          await prisma.provider.update({
            where: { id: provider.id },
            data: { verificationStatus: "pending" },
          });
          sendAdminVerificationAlert(provider.businessName, provider.email, checkoutSession.niche, "Listing has no email — needs manual verification")
            .catch((err) => logger.error("stripe-webhook", "Admin alert failed", err));
        }
      } else {
        // No listing linked (new business, not claiming) — auto-verify
        // New businesses without a listing aren't impersonating anyone
        await prisma.provider.update({
          where: { id: provider.id },
          data: { verificationStatus: "auto_verified" },
        });
      }
    }

    logger.info("webhook/stripe", `Territory claimed: ${checkoutSession.niche}/${checkoutSession.city}`, {
      providerId: provider.id,
      deliveredLeads: actualDelivered,
    });
  } else {
    // Non-territory-claim sessions: just mark as completed
    await prisma.checkoutSession.updateMany({
      where: { stripeSessionId },
      data: { status: "completed", completedAt: new Date() },
    });
  }
}
