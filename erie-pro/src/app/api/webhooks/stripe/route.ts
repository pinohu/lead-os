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
import { cityConfig } from "@/lib/city-config";
import { activatePerks, deactivatePerks } from "@/lib/perk-manager";
import { deliverBankedLeads } from "@/lib/lead-routing";
import { audit } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { sendWelcomeEmail, sendEmail, sendEmailVerification, sendClaimVerificationCode, sendAdminVerificationAlert } from "@/lib/email";

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
              <p>Hi ${provider.businessName},</p>
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
                  <p>Hi ${provider.businessName},</p>
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

type PurchasedLead = {
  id: string;
  niche: string;
  city: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  source: string;
  temperature: string;
  createdAt: Date;
};

type PurchaseDetails = {
  buyerEmail: string;
  price: number | null;
  temperature: string | null;
  stripeSessionId: string;
  checkoutSessionId: string;
  purchasedAt: Date;
};

function escapeHtml(value: string | number | Date | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function leadName(lead: PurchasedLead): string {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() || "Lead";
}

function formattedPrice(price: number | null): string {
  if (typeof price !== "number") return "paid";
  return `$${price.toFixed(2)}`;
}

function leadDetailsTable(lead: PurchasedLead, details: PurchaseDetails): string {
  const messageRow = lead.message
    ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Message:</td><td style="padding:8px 0;color:#111827">${escapeHtml(lead.message)}</td></tr>`
    : "";
  const phoneRow = lead.phone
    ? `<tr><td style="padding:8px 0;color:#6b7280">Phone:</td><td style="padding:8px 0;color:#111827"><a href="tel:${escapeHtml(lead.phone)}" style="color:#2563eb">${escapeHtml(lead.phone)}</a></td></tr>`
    : "";

  return `
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
      <tr><td style="padding:8px 0;color:#6b7280;width:120px">Name:</td><td style="padding:8px 0;color:#111827;font-weight:600">${escapeHtml(leadName(lead))}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Email:</td><td style="padding:8px 0;color:#111827"><a href="mailto:${escapeHtml(lead.email)}" style="color:#2563eb">${escapeHtml(lead.email)}</a></td></tr>
      ${phoneRow}
      <tr><td style="padding:8px 0;color:#6b7280">Niche:</td><td style="padding:8px 0;color:#111827">${escapeHtml(lead.niche)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">City:</td><td style="padding:8px 0;color:#111827">${escapeHtml(lead.city)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Temperature:</td><td style="padding:8px 0;color:#111827">${escapeHtml(details.temperature ?? lead.temperature)}</td></tr>
      ${messageRow}
    </table>
  `;
}

function sendLeadPurchaseEmail(
  lead: PurchasedLead,
  details: PurchaseDetails
): Promise<boolean> {
  return sendEmail({
    to: details.buyerEmail,
    subject: `Your ${lead.niche} lead details`,
    html: `
      <p>Payment received. Here are the purchased lead details:</p>
      ${leadDetailsTable(lead, details)}
      <p>Amount paid: <strong>${escapeHtml(formattedPrice(details.price))}</strong></p>
      <p>Reach out promptly while the request is fresh.</p>
      <p style="font-size:12px;color:#6b7280">Stripe session: <code>${escapeHtml(details.stripeSessionId)}</code></p>
    `,
  });
}

function sendLeadPurchaseAdminEmail(
  adminEmail: string,
  lead: PurchasedLead,
  details: PurchaseDetails
): Promise<boolean> {
  return sendEmail({
    to: adminEmail,
    subject: `[${cityConfig.slug}] Lead purchased - ${lead.niche}`,
    html: `
      <p><strong>${escapeHtml(details.buyerEmail)}</strong> purchased a ${escapeHtml(lead.niche)} lead for ${escapeHtml(formattedPrice(details.price))}.</p>
      ${leadDetailsTable(lead, details)}
      <p>Checkout session: <code>${escapeHtml(details.checkoutSessionId)}</code></p>
      <p>Stripe session: <code>${escapeHtml(details.stripeSessionId)}</code></p>
      <p>Purchased at: ${escapeHtml(details.purchasedAt.toISOString())}</p>
    `,
  });
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
  } else if (checkoutSession.sessionType === "lead_purchase") {
    const fulfillment = await prisma.$transaction(async (tx) => {
      const session = await tx.checkoutSession.findUnique({
        where: { id: checkoutSession.id },
      });

      if (!session || session.status !== "pending") {
        return { status: "duplicate" as const };
      }

      if (!session.leadId) {
        return { status: "missing_lead_id" as const };
      }

      const lead = await tx.lead.findUnique({
        where: { id: session.leadId },
        select: {
          id: true,
          niche: true,
          city: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          message: true,
          source: true,
          temperature: true,
          createdAt: true,
        },
      });

      if (!lead) {
        return { status: "missing_lead" as const, session };
      }

      const claimed = await tx.lead.updateMany({
        where: { id: lead.id, routeType: "unmatched" },
        data: {
          routeType: "overflow",
          routedToId: null,
          slaDeadline: null,
          deliverAt: null,
        },
      });

      if (claimed.count === 0) {
        return { status: "lead_unavailable" as const, session, lead };
      }

      await tx.checkoutSession.update({
        where: { id: session.id },
        data: { status: "completed", completedAt: new Date() },
      });

      return { status: "fulfilled" as const, session, lead };
    });

    if (fulfillment.status === "duplicate") {
      logger.info("webhook/stripe", `Duplicate lead purchase fulfillment skipped: ${stripeSessionId}`);
      return;
    }

    if (fulfillment.status !== "fulfilled") {
      logger.warn("webhook/stripe", `Lead purchase fulfillment skipped: ${fulfillment.status}`, {
        stripeSessionId,
        checkoutSessionId: checkoutSession.id,
        leadId: "session" in fulfillment ? fulfillment.session?.leadId : checkoutSession.leadId,
      });
      return;
    }

    const purchasedAt = new Date();
    const purchaseDetails = {
      buyerEmail: fulfillment.session.providerEmail,
      price: fulfillment.session.price,
      temperature: fulfillment.session.temperature ?? fulfillment.lead.temperature,
      stripeSessionId,
      checkoutSessionId: fulfillment.session.id,
      purchasedAt,
    };

    const emailTasks: Promise<boolean>[] = [
      sendLeadPurchaseEmail(fulfillment.lead, purchaseDetails),
    ];
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      emailTasks.push(sendLeadPurchaseAdminEmail(adminEmail, fulfillment.lead, purchaseDetails));
    }

    const emailResults = await Promise.allSettled(emailTasks);
    for (const result of emailResults) {
      if (result.status === "rejected") {
        logger.error("stripe-webhook", "Lead purchase email failed", result.reason);
      }
    }

    await audit({
      action: "lead.purchased",
      entityType: "lead",
      entityId: fulfillment.lead.id,
      metadata: {
        stripeEventId,
        stripeSessionId,
        checkoutSessionId: fulfillment.session.id,
        buyerEmail: fulfillment.session.providerEmail,
        price: fulfillment.session.price,
        niche: fulfillment.lead.niche,
        city: fulfillment.lead.city,
        temperature: purchaseDetails.temperature,
        lead: {
          firstName: fulfillment.lead.firstName,
          lastName: fulfillment.lead.lastName,
          email: fulfillment.lead.email,
          phone: fulfillment.lead.phone,
          message: fulfillment.lead.message,
          source: fulfillment.lead.source,
          createdAt: fulfillment.lead.createdAt.toISOString(),
        },
      },
    });

    logger.info("webhook/stripe", `Lead purchased: ${fulfillment.lead.id}`, {
      buyerEmail: fulfillment.session.providerEmail,
      stripeSessionId,
    });
  } else if (checkoutSession.sessionType === "concierge_job") {
    // ── Concierge job: $29 one-time ──────────────────────────────
    // The ops team needs to see this in their inbox so they can call
    // pros on the requester's behalf. Requester gets a confirmation.
    await prisma.checkoutSession.updateMany({
      where: { stripeSessionId },
      data: { status: "completed", completedAt: new Date() },
    });

    const requesterEmail = checkoutSession.providerEmail;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${cityConfig.domain}`;
    const adminEmail = process.env.ADMIN_EMAIL;

    sendEmail({
      to: requesterEmail,
      subject: `${cityConfig.name} Pro — we've got your concierge request`,
      html: `
        <p>Thanks — payment received for your Concierge match.</p>
        <p>Our team will call 2–3 vetted pros in your area and text you
        the one to book within the next few business hours.</p>
        <p>Reply to this email if anything about the job changes (access,
        timing, scope).</p>
      `,
    }).catch((err) => {
      logger.error("stripe-webhook", "Concierge confirmation email failed", err);
    });

    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `[${cityConfig.slug}] New Concierge job — ${requesterEmail}`,
        html: `
          <p>New Concierge job paid for by <strong>${requesterEmail}</strong>.</p>
          <p>Stripe session: <code>${stripeSessionId}</code></p>
          <p>Follow up in the admin dashboard: <a href="${siteUrl}/admin">${siteUrl}/admin</a></p>
        `,
      }).catch((err) => {
        logger.error("stripe-webhook", "Concierge ops alert failed", err);
      });
    }

    await audit({
      action: "concierge.paid",
      entityType: "checkout_session",
      entityId: checkoutSession.id,
      metadata: {
        stripeEventId,
        stripeSessionId,
        requesterEmail,
        price: checkoutSession.price,
      },
    }).catch((err) => {
      logger.error("stripe-webhook", "Concierge audit failed", err);
    });

    logger.info("webhook/stripe", `Concierge job paid: ${stripeSessionId} (${requesterEmail})`);
  } else if (checkoutSession.sessionType === "annual_membership") {
    // ── Annual membership: $199/yr ───────────────────────────────
    // Mark completed, welcome the requester, note for ops.
    await prisma.checkoutSession.updateMany({
      where: { stripeSessionId },
      data: { status: "completed", completedAt: new Date() },
    });

    const requesterEmail = checkoutSession.providerEmail;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${cityConfig.domain}`;
    const adminEmail = process.env.ADMIN_EMAIL;

    sendEmail({
      to: requesterEmail,
      subject: `Welcome to ${cityConfig.name} Pro Annual`,
      html: `
        <p>Welcome! Your Annual membership is active for the next 12 months.</p>
        <ul>
          <li>Unlimited Concierge matches</li>
          <li>Same-day priority when pros are available</li>
          <li>Direct line to our ops team</li>
        </ul>
        <p>To kick off a job, reply to this email or visit
        <a href="${siteUrl}">${cityConfig.domain}</a>.</p>
      `,
    }).catch((err) => {
      logger.error("stripe-webhook", "Annual welcome email failed", err);
    });

    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `[${cityConfig.slug}] New Annual member — ${requesterEmail}`,
        html: `
          <p>New Annual member: <strong>${requesterEmail}</strong>.</p>
          <p>Stripe session: <code>${stripeSessionId}</code></p>
        `,
      }).catch((err) => {
        logger.error("stripe-webhook", "Annual ops alert failed", err);
      });
    }

    await audit({
      action: "annual.subscribed",
      entityType: "checkout_session",
      entityId: checkoutSession.id,
      metadata: {
        stripeEventId,
        stripeSessionId,
        requesterEmail,
        price: checkoutSession.price,
      },
    }).catch((err) => {
      logger.error("stripe-webhook", "Annual audit failed", err);
    });

    logger.info("webhook/stripe", `Annual membership: ${stripeSessionId} (${requesterEmail})`);
  } else {
    // Unknown session type — mark completed and log.
    await prisma.checkoutSession.updateMany({
      where: { stripeSessionId },
      data: { status: "completed", completedAt: new Date() },
    });
    logger.warn("webhook/stripe", `Unhandled checkout session type: ${checkoutSession.sessionType}`);
  }
}
