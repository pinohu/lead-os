import { createHash, randomBytes } from "crypto"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { logger } from "@/lib/logger"
import { getNicheBySlug } from "@/lib/niches"
import {
  automatedOffers,
  buildOfferVariantCopy,
  getOfferBySlug,
  inferServiceFamily,
} from "@/lib/automated-offers"
import {
  createSuiteDashContact,
  isSuiteDashConfigured,
  readSuiteDashRecordId,
} from "@/lib/suitedash"

type CustomerInput = {
  email: string
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  companyName?: string | null
  websiteUrl?: string | null
  googleBusinessUrl?: string | null
}

export type CreateOfferPurchaseInput = {
  offerSlug: string
  serviceSlug: string
  amountCents?: number
  currency?: string
  status?: "pending" | "paid"
  sourceSystem?: string
  sourcePage?: string | null
  sourcePageType?: string | null
  convertBoxId?: string | null
  convertBoxEventId?: string | null
  thriveCartOrderId?: string | null
  thriveCartProductId?: string | null
  checkoutSessionId?: string | null
  coupon?: string | null
  affiliate?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  gclid?: string | null
  rawPayload?: unknown
  normalizedPayload?: unknown
  customer: CustomerInput
}

function splitName(customer: CustomerInput) {
  if (customer.firstName || customer.lastName) {
    return {
      firstName: customer.firstName?.trim() || null,
      lastName: customer.lastName?.trim() || null,
      fullName: customer.fullName?.trim() || [customer.firstName, customer.lastName].filter(Boolean).join(" "),
    }
  }
  const parts = (customer.fullName ?? "").trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" ") || null,
    fullName: customer.fullName?.trim() || null,
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://erie.pro").replace(/\/$/, "")
}

function tokenForAsset(seed: string) {
  const secret = process.env.NEXTAUTH_SECRET || process.env.UNSUBSCRIBE_SECRET || "erie-pro-offer-assets"
  return createHash("sha256")
    .update(`${seed}:${randomBytes(16).toString("hex")}:${secret}`)
    .digest("hex")
    .slice(0, 40)
}

export async function createOfferPurchase(input: CreateOfferPurchaseInput) {
  const offerDefinition = getOfferBySlug(input.offerSlug) ?? automatedOffers[0]
  const niche = getNicheBySlug(input.serviceSlug) ?? getNicheBySlug("plumbing")
  if (!niche) throw new Error(`Unknown service slug: ${input.serviceSlug}`)

  const family = inferServiceFamily(niche.slug)
  const name = splitName(input.customer)
  const email = input.customer.email.toLowerCase().trim()

  const offer = await prisma.offer.upsert({
    where: { slug: offerDefinition.slug },
    create: {
      slug: offerDefinition.slug,
      title: offerDefinition.title,
      shortTitle: offerDefinition.shortTitle,
      description: offerDefinition.description,
      category: offerDefinition.category,
      fulfillmentType: offerDefinition.fulfillmentType,
      basePriceCents: offerDefinition.basePriceCents,
      checkoutProductId: offerDefinition.checkoutProductId,
      repoSource: offerDefinition.repoSource,
      sortOrder: offerDefinition.sortOrder,
      metadata: { primaryCta: offerDefinition.primaryCta },
    },
    update: {
      title: offerDefinition.title,
      shortTitle: offerDefinition.shortTitle,
      description: offerDefinition.description,
      category: offerDefinition.category,
      fulfillmentType: offerDefinition.fulfillmentType,
      basePriceCents: offerDefinition.basePriceCents,
      checkoutProductId: offerDefinition.checkoutProductId,
      repoSource: offerDefinition.repoSource,
      sortOrder: offerDefinition.sortOrder,
      metadata: { primaryCta: offerDefinition.primaryCta },
    },
  })

  const customer = await prisma.offerCustomer.upsert({
    where: { email },
    create: {
      email,
      firstName: name.firstName,
      lastName: name.lastName,
      fullName: name.fullName,
      phone: input.customer.phone ?? null,
      companyName: input.customer.companyName ?? null,
      websiteUrl: input.customer.websiteUrl ?? null,
      googleBusinessUrl: input.customer.googleBusinessUrl ?? null,
    },
    update: {
      firstName: name.firstName,
      lastName: name.lastName,
      fullName: name.fullName,
      phone: input.customer.phone ?? undefined,
      companyName: input.customer.companyName ?? undefined,
      websiteUrl: input.customer.websiteUrl ?? undefined,
      googleBusinessUrl: input.customer.googleBusinessUrl ?? undefined,
    },
  })

  const purchase = await prisma.offerPurchase.create({
    data: {
      offerId: offer.id,
      customerId: customer.id,
      serviceSlug: niche.slug,
      serviceLabel: niche.label,
      serviceFamily: family,
      status: input.status ?? (input.amountCents && input.amountCents > 0 ? "paid" : "pending"),
      amountCents: input.amountCents ?? offerDefinition.basePriceCents,
      currency: input.currency ?? "USD",
      sourceSystem: input.sourceSystem ?? "erie-pro",
      sourcePage: input.sourcePage ?? null,
      sourcePageType: input.sourcePageType ?? null,
      convertBoxId: input.convertBoxId ?? null,
      convertBoxEventId: input.convertBoxEventId ?? null,
      thriveCartOrderId: input.thriveCartOrderId ?? null,
      thriveCartProductId: input.thriveCartProductId ?? offerDefinition.checkoutProductId ?? null,
      checkoutSessionId: input.checkoutSessionId ?? null,
      coupon: input.coupon ?? null,
      affiliate: input.affiliate ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      gclid: input.gclid ?? null,
      rawPayload: (input.rawPayload ?? {}) as object,
      normalizedPayload: (input.normalizedPayload ?? {}) as object,
      paidAt: input.status === "paid" || (input.amountCents && input.amountCents > 0) ? new Date() : null,
    },
    include: { offer: true, customer: true },
  })

  const job = await prisma.fulfillmentJob.create({
    data: {
      purchaseId: purchase.id,
      jobType: offer.fulfillmentType,
      input: {
        offerSlug: offer.slug,
        serviceSlug: niche.slug,
        serviceFamily: family,
        sourceSystem: input.sourceSystem ?? "erie-pro",
      },
    },
  })

  return { purchase, job }
}

export async function fulfillOfferPurchase(purchaseId: string) {
  const purchase = await prisma.offerPurchase.findUnique({
    where: { id: purchaseId },
    include: {
      offer: true,
      customer: true,
      fulfillmentJobs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })
  if (!purchase) throw new Error(`Offer purchase not found: ${purchaseId}`)

  const job = purchase.fulfillmentJobs[0] ?? await prisma.fulfillmentJob.create({
    data: { purchaseId, jobType: purchase.offer.fulfillmentType },
  })

  await prisma.fulfillmentJob.update({
    where: { id: job.id },
    data: { status: "generating", attempts: { increment: 1 }, startedAt: new Date() },
  })

  try {
    const assetContent = buildGeneratedAsset(purchase)
    const token = tokenForAsset(purchase.id)
    const asset = await prisma.generatedAsset.create({
      data: {
        purchaseId: purchase.id,
        fulfillmentJobId: job.id,
        assetType: assetContent.assetType,
        title: assetContent.title,
        summary: assetContent.summary,
        contentHtml: assetContent.html,
        contentMarkdown: assetContent.markdown,
        publicToken: token,
        metadata: assetContent.metadata,
      },
    })

    await prisma.fulfillmentJob.update({
      where: { id: job.id },
      data: {
        status: "fulfilled",
        completedAt: new Date(),
        output: { generatedAssetId: asset.id, publicToken: token },
      },
    })

    const emailed = await sendOfferDeliveryEmail(purchase.id, asset.publicToken)

    await prisma.offerPurchase.update({
      where: { id: purchase.id },
      data: {
        status: "fulfilled",
        fulfilledAt: new Date(),
        emailDeliveryStatus: emailed ? "sent" : "failed",
      },
    })

    await Promise.allSettled([
      syncOfferPurchaseToBoostspace(purchase.id),
      syncOfferPurchaseToSuiteDash(purchase.id),
    ])

    return asset
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fulfillment error"
    logger.error("offer-fulfillment", "Offer fulfillment failed", error)
    await Promise.allSettled([
      prisma.fulfillmentJob.update({
        where: { id: job.id },
        data: { status: "failed", lastError: message },
      }),
      prisma.offerPurchase.update({
        where: { id: purchase.id },
        data: { status: "failed" },
      }),
    ])
    throw error
  }
}

type PurchaseForAsset = Awaited<ReturnType<typeof prisma.offerPurchase.findUnique>> & {
  offer: NonNullable<Awaited<ReturnType<typeof prisma.offer.findUnique>>>
  customer: NonNullable<Awaited<ReturnType<typeof prisma.offerCustomer.findUnique>>>
}

function buildGeneratedAsset(purchase: NonNullable<PurchaseForAsset>) {
  const niche = getNicheBySlug(purchase.serviceSlug)
  const offerDefinition = getOfferBySlug(purchase.offer.slug)
  const copy = niche && offerDefinition ? buildOfferVariantCopy(offerDefinition, niche) : null
  const service = purchase.serviceLabel
  const family = purchase.serviceFamily
  const company = purchase.customer.companyName || "your business"
  const website = purchase.customer.websiteUrl || "not provided"
  const gbp = purchase.customer.googleBusinessUrl || "not provided"

  const score = calculateLeadReadinessScore({
    hasWebsite: Boolean(purchase.customer.websiteUrl),
    hasGoogleBusinessProfile: Boolean(purchase.customer.googleBusinessUrl),
    family,
    paid: purchase.amountCents > 0,
  })

  const title = `${service} ${purchase.offer.shortTitle ?? purchase.offer.title}`
  const summary = `${company} receives a ${family.toLowerCase()} deliverable for ${service} in Erie County.`
  const sections = [
    {
      heading: "Lead readiness score",
      body: `Current score: ${score}/100. The highest leverage next step is to tighten the page promise, proof, intake, and follow-up path for Erie County buyers.`,
    },
    {
      heading: "Service psychology",
      body: copy?.deliverySummary ?? `${service} buyers need clarity, trust, speed, and a simple next step.`,
    },
    {
      heading: "County-focused positioning",
      body: `Lead with Erie County relevance, familiar local service needs, and specific ${service.toLowerCase()} outcomes. Avoid radius language; make the buyer feel this is built for their county and their situation.`,
    },
    {
      heading: "Conversion path",
      body: `Use a short provider-facing offer ladder: free scorecard, paid conversion blueprint, provider launch kit, then monthly growth intelligence. The visitor should never need to wonder what to do next.`,
    },
    {
      heading: "Follow-up sequence",
      body: `Send an immediate confirmation, a same-day value email, a 24-hour proof email, and a 72-hour next-step reminder. For urgent categories, add missed-call and SMS recovery prompts.`,
    },
    {
      heading: "Input reviewed",
      body: `Website: ${website}. Google Business Profile: ${gbp}. Service family: ${family}.`,
    },
  ]

  const html = `
    <article style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#12213a;max-width:840px;margin:0 auto;padding:32px">
      <p style="text-transform:uppercase;letter-spacing:.08em;color:#0f766e;font-size:12px;font-weight:700;margin:0 0 8px">Erie.Pro Automated Fulfillment</p>
      <h1 style="font-size:32px;line-height:1.15;margin:0 0 12px;color:#0f172a">${escapeHtml(title)}</h1>
      <p style="font-size:16px;color:#475569;margin:0 0 28px">${escapeHtml(summary)}</p>
      <div style="border:1px solid #dbeafe;background:#eff6ff;border-radius:8px;padding:18px;margin-bottom:24px">
        <strong>Recommended next move:</strong> ${escapeHtml(getNextMove(purchase.offer.slug, family))}
      </div>
      ${sections.map((section) => `
        <section style="border-top:1px solid #e2e8f0;padding-top:18px;margin-top:18px">
          <h2 style="font-size:18px;margin:0 0 8px;color:#0f172a">${escapeHtml(section.heading)}</h2>
          <p style="margin:0;color:#334155">${escapeHtml(section.body)}</p>
        </section>
      `).join("")}
    </article>
  `

  const markdown = [
    `# ${title}`,
    "",
    summary,
    "",
    `Recommended next move: ${getNextMove(purchase.offer.slug, family)}`,
    "",
    ...sections.flatMap((section) => [`## ${section.heading}`, section.body, ""]),
  ].join("\n")

  const assetType =
    purchase.offer.fulfillmentType === "scorecard"
      ? "html_report"
      : purchase.offer.fulfillmentType === "blueprint"
        ? "pdf_blueprint"
        : purchase.offer.fulfillmentType === "subscription_report"
          ? "dashboard_link"
          : "template_pack"

  return {
    assetType,
    title,
    summary,
    html,
    markdown,
    metadata: {
      score,
      service,
      family,
      offerSlug: purchase.offer.slug,
      company,
      generatedBy: "Erie.Pro automated offer engine",
    },
  } as const
}

function calculateLeadReadinessScore(input: {
  hasWebsite: boolean
  hasGoogleBusinessProfile: boolean
  family: string
  paid: boolean
}) {
  let score = 42
  if (input.hasWebsite) score += 18
  if (input.hasGoogleBusinessProfile) score += 18
  if (input.paid) score += 7
  if (input.family === "Emergency Home Response") score += 5
  return Math.min(score, 92)
}

function getNextMove(offerSlug: string, family: string) {
  if (offerSlug === "erie-lead-readiness-scorecard") return "Use the scorecard gaps to choose the paid conversion blueprint."
  if (offerSlug === "service-page-conversion-blueprint") return "Implement the service-page promise, proof, CTA, and follow-up sequence."
  if (offerSlug === "provider-launch-kit") return "Publish the offer stack and connect intake, follow-up, and review requests."
  if (offerSlug === "growth-intelligence-subscription") return "Review monthly demand signals and adjust the active campaign."
  if (family === "Emergency Home Response") return "Prioritize missed-call recovery and fast-contact CTAs."
  return "Start with the highest-friction conversion gap and keep the next step simple."
}

export async function sendOfferDeliveryEmail(purchaseId: string, publicToken: string) {
  const purchase = await prisma.offerPurchase.findUnique({
    where: { id: purchaseId },
    include: { offer: true, customer: true },
  })
  if (!purchase) return false

  const assetUrl = `${getSiteUrl()}/offer-assets/${publicToken}`
  const name = purchase.customer.firstName || purchase.customer.fullName || "there"
  return sendEmail({
    to: purchase.customer.email,
    subject: `${purchase.offer.shortTitle ?? purchase.offer.title} is ready`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#12213a">
        <h2 style="margin:0 0 12px;color:#0f172a">Your Erie.Pro deliverable is ready</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your ${escapeHtml(purchase.serviceLabel)} ${escapeHtml(purchase.offer.shortTitle ?? purchase.offer.title)} has been generated for Erie County.</p>
        <p><a href="${escapeHtml(assetUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700">Open your deliverable</a></p>
        <p style="color:#64748b;font-size:13px">This was generated automatically from your service, offer, and Erie.Pro lead system context.</p>
      </div>
    `,
    replyTo: "hello@erie.pro",
  })
}

export async function syncOfferPurchaseToBoostspace(purchaseId: string) {
  const webhookUrl = process.env.BOOST_SPACE_OFFER_WEBHOOK_URL || process.env.BOOSTSPACE_OFFER_WEBHOOK_URL
  if (!webhookUrl) {
    await prisma.offerPurchase.update({
      where: { id: purchaseId },
      data: { boostspaceSyncStatus: "not_configured" },
    }).catch(() => {})
    return
  }

  const purchase = await prisma.offerPurchase.findUnique({
    where: { id: purchaseId },
    include: { offer: true, customer: true, generatedAssets: { orderBy: { createdAt: "desc" }, take: 1 } },
  })
  if (!purchase) return

  const payload = {
    event: "offer.purchase_fulfilled",
    eventVersion: "1.0",
    sentAt: new Date().toISOString(),
    purchase: {
      id: purchase.id,
      offerSlug: purchase.offer.slug,
      offerTitle: purchase.offer.title,
      serviceSlug: purchase.serviceSlug,
      serviceLabel: purchase.serviceLabel,
      serviceFamily: purchase.serviceFamily,
      amountCents: purchase.amountCents,
      status: purchase.status,
      sourceSystem: purchase.sourceSystem,
      sourcePage: purchase.sourcePage,
      assetUrl: purchase.generatedAssets[0] ? `${getSiteUrl()}/offer-assets/${purchase.generatedAssets[0].publicToken}` : null,
    },
    customer: {
      email: purchase.customer.email,
      name: purchase.customer.fullName,
      phone: purchase.customer.phone,
      companyName: purchase.customer.companyName,
      websiteUrl: purchase.customer.websiteUrl,
      googleBusinessUrl: purchase.customer.googleBusinessUrl,
    },
  }

  await prisma.offerPurchase.update({
    where: { id: purchaseId },
    data: { boostspaceSyncStatus: "pending" },
  })

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "EriePro-OfferSync/1.0" },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(`Boost.space offer webhook failed: ${response.status} ${await response.text().catch(() => "")}`)
    await prisma.offerPurchase.update({
      where: { id: purchaseId },
      data: { boostspaceSyncStatus: "synced", boostspaceSyncedAt: new Date(), boostspaceLastError: null },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Boost.space offer sync error"
    await prisma.offerPurchase.update({
      where: { id: purchaseId },
      data: { boostspaceSyncStatus: "failed", boostspaceLastError: message },
    }).catch(() => {})
  }
}

export async function syncOfferPurchaseToSuiteDash(purchaseId: string) {
  const purchase = await prisma.offerPurchase.findUnique({
    where: { id: purchaseId },
    include: { offer: true, customer: true, generatedAssets: { orderBy: { createdAt: "desc" }, take: 1 } },
  })
  if (!purchase) return

  if (!isSuiteDashConfigured()) {
    await prisma.offerPurchase.update({
      where: { id: purchaseId },
      data: { suitedashSyncStatus: "not_configured" },
    }).catch(() => {})
    return
  }

  await prisma.offerPurchase.update({
    where: { id: purchaseId },
    data: { suitedashSyncStatus: "pending" },
  })

  try {
    const names = splitName({
      email: purchase.customer.email,
      firstName: purchase.customer.firstName,
      lastName: purchase.customer.lastName,
      fullName: purchase.customer.fullName,
    })
    const assetUrl = purchase.generatedAssets[0] ? `${getSiteUrl()}/offer-assets/${purchase.generatedAssets[0].publicToken}` : null
    const response = await createSuiteDashContact({
      first_name: names.firstName || "Erie.Pro",
      last_name: names.lastName || "Offer Buyer",
      email: purchase.customer.email,
      phone: purchase.customer.phone ?? undefined,
      role: "Offer Buyer",
      company_name: purchase.customer.companyName ?? `${purchase.serviceLabel} Provider`,
      tags: [
        "erie-pro",
        "automated-offer",
        `offer:${purchase.offer.slug}`,
        `service:${purchase.serviceSlug}`,
        `family:${purchase.serviceFamily}`,
      ],
      notes: [
        `Erie.Pro offer purchase ID: ${purchase.id}`,
        `Offer: ${purchase.offer.title}`,
        `Service: ${purchase.serviceLabel}`,
        `Amount: ${(purchase.amountCents / 100).toFixed(2)} ${purchase.currency}`,
        assetUrl ? `Asset: ${assetUrl}` : "Asset: pending",
      ],
      send_welcome_email: false,
    })
    await prisma.offerPurchase.update({
      where: { id: purchaseId },
      data: { suitedashSyncStatus: "synced", suitedashRecordId: readSuiteDashRecordId(response) },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SuiteDash offer sync error"
    await prisma.offerPurchase.update({
      where: { id: purchaseId },
      data: { suitedashSyncStatus: "failed", boostspaceLastError: message },
    }).catch(() => {})
  }
}
