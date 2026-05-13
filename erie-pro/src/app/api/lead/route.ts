import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { routeLead } from "@/lib/lead-routing"
import { LeadRequestSchema, formatZodErrors, MAX_BODY_SIZE } from "@/lib/validation"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendNewLeadNotification, sendConsumerConfirmation, sendAdminLeadAlert } from "@/lib/email"
import { logger } from "@/lib/logger"
import { audit } from "@/lib/audit-log"
import { prisma } from "@/lib/db"
import { deliverWebhookEvent } from "@/lib/webhook-delivery"
import { syncLeadToBoostspace } from "@/lib/lead-external-sync"
import { recordRevenueActionPlan } from "@/lib/revenue-actions"

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 5 leads per minute per IP ────────────────────
    const rateLimited = await checkRateLimit(request, "lead")
    if (rateLimited) return rateLimited

    // ── Body size check ──────────────────────────────────────────
    const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10)
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: "Request body too large" },
        { status: 413 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    // ── Zod validation (sanitizes, normalizes phone/email, enforces TCPA) ──
    const parsed = LeadRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodErrors(parsed.error) },
        { status: 400 }
      )
    }

    const {
      firstName,
      lastName,
      phone,
      email,
      message,
      niche,
      city,
      provider,
      requestedProviderName,
      requestedProviderSlug,
      requestedProviderPhone,
      requestedProviderAddress,
      sourcePage,
      routingIntent,
    } = parsed.data

    const targetProviderName = requestedProviderName || provider
    const isProviderSpecific = routingIntent === "provider_specific" || Boolean(targetProviderName || requestedProviderSlug)
    const providerLookupOr = [
      ...(targetProviderName ? [{ businessName: { equals: targetProviderName, mode: "insensitive" as const } }] : []),
      ...(requestedProviderSlug ? [{ slug: requestedProviderSlug }] : []),
    ]

    // ── Suppression list check (TCPA/CAN-SPAM compliance) ──────
    const suppressed = await prisma.suppression.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    })
    if (suppressed) {
      return NextResponse.json(
        { success: false, error: "This contact has opted out of communications" },
        { status: 403 }
      )
    }

    // ── Self-dealing prevention ─────────────────────────────────
    const leadDomain = email.split("@")[1]?.toLowerCase()
    if (leadDomain) {
      const activeProviders = await prisma.provider.findMany({
        where: {
          niche,
          subscriptionStatus: { in: ["active", "trial"] },
        },
        select: { email: true },
      })

      const providerDomains = new Set(
        activeProviders.map((p) => p.email.split("@")[1]?.toLowerCase()).filter(Boolean)
      )

      if (providerDomains.has(leadDomain)) {
        return NextResponse.json(
          { success: false, error: "This email domain is associated with an existing provider in this category" },
          { status: 400 }
        )
      }
    }

    // ── Record TCPA consent metadata ─────────────────────────────
    const tcpaIpAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

    const preferredProvider = targetProviderName || requestedProviderSlug
      ? await prisma.provider.findFirst({
          where: {
            OR: providerLookupOr,
            niche,
            city: { equals: city, mode: "insensitive" },
            subscriptionStatus: "active",
            emailVerified: true,
            verificationStatus: { in: ["verified", "auto_verified", "admin_approved"] },
          },
        })
      : null

    // Provider-specific pages should never silently route a driver to a different business.
    // If the named provider is not claimed/verified, bank the lead for manual follow-up.
    const result = isProviderSpecific && preferredProvider
      ? await (async () => {
          const statusToken = crypto.randomUUID()
          const now = new Date()
          const lead = await prisma.lead.create({
            data: {
              niche,
              city: city.toLowerCase(),
              firstName: firstName ?? null,
              lastName: lastName ?? null,
              email: email.toLowerCase(),
              phone: phone ?? null,
              message,
              routeType: "primary",
              routedToId: preferredProvider.id,
              slaDeadline: new Date(now.getTime() + 1800 * 1000),
              source: "client-site",
              requestedProviderName: targetProviderName ?? null,
              requestedProviderSlug: requestedProviderSlug ?? preferredProvider.slug,
              requestedProviderPhone: requestedProviderPhone ?? preferredProvider.phone,
              requestedProviderAddress,
              sourcePage,
              routingIntent: "provider_specific",
              providerDeliveryStatus: "delivered",
              providerDeliveredAt: now,
              statusToken,
              tcpaConsent: true,
              tcpaConsentText: parsed.data.tcpaConsentText,
              tcpaConsentAt: now,
              tcpaIpAddress,
            },
          })

          await prisma.provider.update({
            where: { id: preferredProvider.id },
            data: {
              totalLeads: { increment: 1 },
              lastLeadAt: now,
            },
          })

          return {
            leadId: lead.id,
            niche,
            city,
            routedTo: {
              id: preferredProvider.id,
              slug: preferredProvider.slug,
              businessName: preferredProvider.businessName,
              niche: preferredProvider.niche,
              city: preferredProvider.city,
              tier: preferredProvider.tier as "primary" | "backup" | "overflow",
              phone: preferredProvider.phone,
              email: preferredProvider.email,
              responseTimeAvg: preferredProvider.avgResponseTime,
              conversionRate: preferredProvider.totalLeads > 0 ? preferredProvider.convertedLeads / preferredProvider.totalLeads : 0,
              satisfactionScore: preferredProvider.avgRating,
              isActive: preferredProvider.subscriptionStatus === "active",
              slaTimeoutSeconds: 1800,
            },
            routeType: "primary" as const,
            timestamp: lead.createdAt.toISOString(),
            slaDeadline: lead.slaDeadline?.toISOString() ?? now.toISOString(),
            statusToken,
          }
        })()
      : isProviderSpecific && !preferredProvider
      ? await (async () => {
          const statusToken = crypto.randomUUID()
          const lead = await prisma.lead.create({
            data: {
              niche,
              city: city.toLowerCase(),
              firstName: firstName ?? null,
              lastName: lastName ?? null,
              email: email.toLowerCase(),
              phone: phone ?? null,
              message,
              routeType: "unmatched",
              source: "client-site",
              requestedProviderName: targetProviderName ?? null,
              requestedProviderSlug: requestedProviderSlug ?? null,
              requestedProviderPhone: requestedProviderPhone ?? null,
              requestedProviderAddress: requestedProviderAddress ?? null,
              sourcePage: sourcePage ?? null,
              routingIntent: "provider_specific",
              providerDeliveryStatus: "pending_provider_delivery",
              statusToken,
              tcpaConsent: true,
              tcpaConsentText: parsed.data.tcpaConsentText,
              tcpaConsentAt: new Date(),
              tcpaIpAddress,
            },
          })

          return {
            leadId: lead.id,
            niche,
            city,
            routedTo: null,
            routeType: "unmatched" as const,
            timestamp: lead.createdAt.toISOString(),
            slaDeadline: lead.createdAt.toISOString(),
            statusToken,
          }
        })()
      : await routeLead(niche, city, {
          firstName,
          lastName,
          phone,
          email,
          message,
          provider: targetProviderName,
          requestedProviderName: targetProviderName,
          requestedProviderSlug,
          requestedProviderPhone,
          requestedProviderAddress,
          sourcePage,
          routingIntent: isProviderSpecific ? "provider_specific" : "general",
          source: isProviderSpecific ? "client-site" : "erie-pro",
          timestamp: new Date().toISOString(),
          tcpaConsent: true,
          tcpaConsentText: parsed.data.tcpaConsentText,
          tcpaConsentAt: new Date().toISOString(),
          tcpaIpAddress,
        })

    const leadName = `${firstName ?? ""} ${lastName ?? ""}`.trim() || "New Lead"
    const actionPlanResult = await recordRevenueActionPlan({
      sourceSystem: "erie-pro",
      eventType: result.routedTo ? "lead.routed" : "lead.submitted",
      customerEmail: email,
      serviceSlug: niche,
      serviceLabel: niche,
      sourcePage,
      sourcePageType: isProviderSpecific ? "provider_specific_lead_form" : "lead_form",
      metadata: {
        leadId: result.leadId,
        routeType: result.routeType,
        city,
        routedToId: result.routedTo?.id ?? null,
        routedToName: result.routedTo?.businessName ?? null,
        routingIntent: isProviderSpecific ? "provider_specific" : "general",
        requestedProviderName: targetProviderName ?? null,
        requestedProviderSlug: requestedProviderSlug ?? null,
      },
    }).catch((error) => {
      logger.error("lead", "Revenue action plan failed", error)
      return null
    })

    // ── Schedule emails + audit to run AFTER response is sent ────
    // Using Next.js after() so the response returns immediately
    // and emails don't block or cause timeouts.
    after(async () => {
      try {
        const tasks: Promise<unknown>[] = []

        // Provider notification
        if (result.routedTo && result.routedTo.email) {
          tasks.push(
            sendNewLeadNotification(
              result.routedTo.email,
              result.routedTo.businessName,
              leadName,
              email,
              phone ?? null,
              niche,
              message ?? null
            ).catch((err) => { logger.error("email", "Provider notification failed", err) })
          )
        }

        // Consumer confirmation (includes status tracking link)
        tasks.push(
          sendConsumerConfirmation(
            email,
            leadName === "New Lead" ? "" : leadName,
            niche,
            result.routedTo?.businessName ?? null,
            result.statusToken,
            { requestedProviderName: isProviderSpecific ? targetProviderName ?? null : null }
          ).catch((err) => { logger.error("email", "Consumer confirmation failed", err) })
        )

        // Admin alert
        const adminEmail = process.env.ADMIN_EMAIL
        if (adminEmail) {
          tasks.push(
            sendAdminLeadAlert(adminEmail, {
              leadName,
              leadEmail: email,
              leadPhone: phone ?? null,
              niche,
              message: message ?? null,
              routedTo: result.routedTo?.businessName ?? null,
              routeType: result.routeType,
              leadId: result.leadId,
            }).catch((err) => { logger.error("email", "Admin lead alert failed", err) })
          )
        }

        // Audit log
        tasks.push(
          audit({
            action: result.routedTo ? "lead.routed" : "lead.submitted",
            entityType: "lead",
            entityId: result.leadId,
            providerId: result.routedTo?.id,
            metadata: { niche, city, ...(result.routedTo ? {} : { status: "banked" }) },
          }).catch((err) => { logger.error("lead", "Audit log failed", err) })
        )

        // Outbound webhook delivery
        if (result.routedTo) {
          tasks.push(
            deliverWebhookEvent(result.routedTo.id, "lead.created", {
              leadId: result.leadId,
              niche,
              city,
              firstName,
              lastName,
              email,
              routeType: result.routeType,
              requestedProviderName: targetProviderName ?? null,
              requestedProviderSlug: requestedProviderSlug ?? null,
            }).catch((err) => { logger.error("webhook", "Webhook delivery failed", err) })
          )
        }

        tasks.push(
          syncLeadToBoostspace(result.leadId).catch((err) => {
            logger.error("lead", "External lead sync failed", err)
          })
        )

        await Promise.allSettled(tasks)
      } catch (err) {
        logger.error("after", "Background tasks failed", err)
      }
    })

    return NextResponse.json({
      success: true,
      leadId: result.leadId,
      routedTo: result.routedTo?.businessName ?? "Queued for matching",
      actionPlan: actionPlanResult?.plan ?? null,
      message:
        result.routedTo
          ? `Your request has been received and routed to ${result.routedTo.businessName}.`
          : isProviderSpecific
            ? "Your request has been received. Erie.pro will review it for provider follow-up."
            : "Your request has been received. A provider will contact you shortly.",
    })
  } catch (err) {
    logger.error("/api/lead", "Error:", err)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
