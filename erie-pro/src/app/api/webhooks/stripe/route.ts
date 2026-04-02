// ── Stripe Webhook Endpoint ─────────────────────────────────────────
// Handles Stripe events for subscription lifecycle management.
// Signature verification ensures only Stripe can call this endpoint.

import { NextRequest, NextResponse } from "next/server";
import {
  constructWebhookEvent,
  handleStripeWebhook,
  isStripeDryRun,
  getCheckoutSession,
} from "@/lib/stripe-integration";
import { prisma } from "@/lib/db";
import type { SubscriptionStatus } from "@/generated/prisma";
import { activatePerks, deactivatePerks } from "@/lib/perk-manager";
import { deliverBankedLeads } from "@/lib/lead-routing";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { sendWelcomeEmail, sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";

    // ── Dry-run mode: accept mock events ─────────────────────────
    if (isStripeDryRun()) {
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

    // ── Handle payment failure — notify provider ──────────────
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const customerId = invoice && "customer" in invoice ? (invoice.customer as string) : null;

      if (customerId) {
        const provider = await prisma.provider.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true, email: true, businessName: true },
        });

        if (provider) {
          sendEmail({
            to: provider.email,
            subject: "Payment failed \u2014 action required",
            html: `
              <p>Hi ${provider.businessName},</p>
              <p>Your most recent payment for your Erie Pro territory subscription has failed.</p>
              <p>Please update your payment information to avoid service interruption:</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://erie.pro"}/dashboard/billing">Update Payment Info</a></p>
              <p>If you have questions, reply to this email or contact our support team.</p>
            `,
          }).catch((err) => { logger.error("stripe-webhook", "Failed to process webhook task", err) });

          await audit({
            action: "subscription.payment_failed",
            entityType: "subscription",
            providerId: provider.id,
            metadata: { stripeEventId: event.id },
          }).catch((err) => { logger.error("stripe-webhook", "Failed to process webhook task", err) });
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

            // Notify provider if subscription is at risk
            if (newStatus === "past_due") {
              sendEmail({
                to: provider.email,
                subject: "Your subscription is past due — action required",
                html: `
                  <p>Hi ${provider.businessName},</p>
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
    // Find or create the provider
    const provider = await prisma.provider.findFirst({
      where: { email: checkoutSession.providerEmail },
    });

    if (provider) {
      // Wrap critical DB operations in a transaction for atomicity
      const deliveredCount = await prisma.$transaction(async (tx) => {
        // Activate provider subscription
        await tx.provider.update({
          where: { id: provider.id },
          data: {
            subscriptionStatus: "active",
            stripeSubscriptionId: stripeSessionId,
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

        return 0; // deliverBankedLeads runs outside transaction (it has its own logic)
      });

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

      logger.info("webhook/stripe", `Territory claimed: ${checkoutSession.niche}/${checkoutSession.city}`, {
        providerId: provider.id,
        deliveredLeads: actualDelivered,
      });
    }
  } else {
    // Non-territory-claim sessions: just mark as completed
    await prisma.checkoutSession.updateMany({
      where: { stripeSessionId },
      data: { status: "completed", completedAt: new Date() },
    });
  }
}
