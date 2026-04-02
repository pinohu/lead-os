import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { routeLead } from "@/lib/lead-routing"
import { LeadRequestSchema, formatZodErrors, MAX_BODY_SIZE } from "@/lib/validation"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendNewLeadNotification, sendConsumerConfirmation, sendAdminLeadAlert } from "@/lib/email"
import { logger } from "@/lib/logger"
import { audit } from "@/lib/audit-log"
import { prisma } from "@/lib/db"

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

    const { firstName, lastName, phone, email, message, niche, city, provider } = parsed.data

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

    // Route the lead through the distribution engine
    const result = await routeLead(niche, city, {
      firstName,
      lastName,
      phone,
      email,
      message,
      provider,
      source: "erie-pro",
      timestamp: new Date().toISOString(),
      tcpaConsent: true,
      tcpaConsentText: parsed.data.tcpaConsentText,
      tcpaConsentAt: new Date().toISOString(),
      tcpaIpAddress,
    })

    const leadName = `${firstName ?? ""} ${lastName ?? ""}`.trim() || "New Lead"

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

        // Consumer confirmation
        tasks.push(
          sendConsumerConfirmation(
            email,
            leadName === "New Lead" ? "" : leadName,
            niche,
            result.routedTo?.businessName ?? null
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
          }).catch(() => {})
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
      message:
        "Your request has been received. A provider will contact you shortly.",
    })
  } catch (err) {
    logger.error("/api/lead", "Error:", err)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
