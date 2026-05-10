import { prisma } from "@/lib/db"
import {
  automatedOffers,
  buildOfferVariantCopy,
  getAllServiceOfferRecommendations,
} from "@/lib/automated-offers"
import { niches } from "@/lib/niches"

export async function syncAutomatedOfferCatalog() {
  const offerRecords = new Map<string, { id: string }>()

  for (const offer of automatedOffers) {
    const record = await prisma.offer.upsert({
      where: { slug: offer.slug },
      create: {
        slug: offer.slug,
        title: offer.title,
        shortTitle: offer.shortTitle,
        description: offer.description,
        category: offer.category,
        fulfillmentType: offer.fulfillmentType,
        basePriceCents: offer.basePriceCents,
        checkoutProductId: offer.checkoutProductId,
        checkoutUrl: offer.checkoutUrl ?? null,
        repoSource: offer.repoSource,
        sortOrder: offer.sortOrder,
        metadata: {
          primaryCta: offer.primaryCta,
          seededFrom: "src/lib/automated-offers.ts",
        },
      },
      update: {
        title: offer.title,
        shortTitle: offer.shortTitle,
        description: offer.description,
        category: offer.category,
        fulfillmentType: offer.fulfillmentType,
        basePriceCents: offer.basePriceCents,
        checkoutProductId: offer.checkoutProductId,
        checkoutUrl: offer.checkoutUrl ?? null,
        repoSource: offer.repoSource,
        sortOrder: offer.sortOrder,
        autoFulfillable: true,
        metadata: {
          primaryCta: offer.primaryCta,
          seededFrom: "src/lib/automated-offers.ts",
        },
      },
      select: { id: true },
    })
    offerRecords.set(offer.slug, record)
  }

  for (const niche of niches) {
    for (const offer of automatedOffers) {
      const offerRecord = offerRecords.get(offer.slug)
      if (!offerRecord) continue
      const copy = buildOfferVariantCopy(offer, niche)
      await prisma.offerVariant.upsert({
        where: {
          offerId_serviceSlug_serviceFamily: {
            offerId: offerRecord.id,
            serviceSlug: niche.slug,
            serviceFamily: copy.deliverableConfig.serviceFamily,
          },
        },
        create: {
          offerId: offerRecord.id,
          serviceSlug: niche.slug,
          serviceFamily: copy.deliverableConfig.serviceFamily,
          headline: copy.headline,
          subheadline: copy.subheadline,
          painPoint: copy.painPoint,
          promise: copy.promise,
          primaryCta: copy.primaryCta,
          deliverySummary: copy.deliverySummary,
          deliverableConfig: copy.deliverableConfig,
        },
        update: {
          headline: copy.headline,
          subheadline: copy.subheadline,
          painPoint: copy.painPoint,
          promise: copy.promise,
          primaryCta: copy.primaryCta,
          deliverySummary: copy.deliverySummary,
          deliverableConfig: copy.deliverableConfig,
        },
      })
    }
  }

  for (const recommendation of getAllServiceOfferRecommendations()) {
    const offerRecord = offerRecords.get(recommendation.offerSlug)
    if (!offerRecord) continue
    await prisma.serviceOfferMap.upsert({
      where: {
        serviceSlug_offerId_visitorSegment: {
          serviceSlug: recommendation.serviceSlug,
          offerId: offerRecord.id,
          visitorSegment: recommendation.visitorSegment,
        },
      },
      create: {
        serviceSlug: recommendation.serviceSlug,
        serviceLabel: recommendation.serviceLabel,
        serviceFamily: recommendation.serviceFamily,
        offerId: offerRecord.id,
        priority: recommendation.priority,
        visitorSegment: recommendation.visitorSegment,
        urgency: recommendation.urgency,
        conversionAngle: recommendation.conversionAngle,
        painPoint: recommendation.painPoint,
        recommendedPriceCents: recommendation.recommendedPriceCents,
        isPrimary: recommendation.isPrimary,
        metadata: {
          offerSlug: recommendation.offerSlug,
          seededFrom: "src/lib/automated-offers.ts",
        },
      },
      update: {
        serviceLabel: recommendation.serviceLabel,
        serviceFamily: recommendation.serviceFamily,
        priority: recommendation.priority,
        urgency: recommendation.urgency,
        conversionAngle: recommendation.conversionAngle,
        painPoint: recommendation.painPoint,
        recommendedPriceCents: recommendation.recommendedPriceCents,
        isPrimary: recommendation.isPrimary,
        metadata: {
          offerSlug: recommendation.offerSlug,
          seededFrom: "src/lib/automated-offers.ts",
        },
      },
    })
  }

  return {
    offers: automatedOffers.length,
    services: niches.length,
    recommendations: getAllServiceOfferRecommendations().length,
  }
}
