import type { MarketingArtifact } from "./marketing-ingestion.ts";
import type { DesignIngestionResult, LayoutSection } from "./design-ingestion.ts";

// ---------------------------------------------------------------------------
// Layout mapping
// ---------------------------------------------------------------------------

function buildLayoutSections(artifact: MarketingArtifact): LayoutSection[] {
  const sections: LayoutSection[] = [];

  sections.push({
    type: "hero",
    position: 0,
    headingText: artifact.headline,
    subheadingText: artifact.subheadline,
    ctaLabels: artifact.ctaLabels.slice(0, 3),
    hasForm: artifact.contactInfo.emails.length > 0 || artifact.ctaLabels.some((c) => /schedule|book|contact/i.test(c)),
    hasImage: false,
    estimatedColumns: artifact.layoutType === "two-column" || artifact.layoutType === "grid" ? 2 : 1,
  });

  if (artifact.trustSignals.length > 0) {
    sections.push({
      type: "testimonials",
      position: 1,
      headingText: "Why Choose Us",
      ctaLabels: [],
      hasForm: false,
      hasImage: false,
      estimatedColumns: 1,
    });
  }

  if (artifact.offer?.pricing.length) {
    sections.push({
      type: "pricing",
      position: sections.length,
      headingText: "Pricing",
      ctaLabels: artifact.ctaLabels.filter((c) => /order|buy|get|claim/i.test(c)).slice(0, 2),
      hasForm: false,
      hasImage: false,
      estimatedColumns: artifact.offer.pricing.length >= 3 ? 3 : 1,
    });
  }

  if (artifact.ctaLabels.length > 0) {
    sections.push({
      type: "cta",
      position: sections.length,
      headingText: artifact.ctaLabels[0],
      ctaLabels: artifact.ctaLabels.slice(0, 3),
      hasForm: artifact.contactInfo.phones.length > 0,
      hasImage: false,
      estimatedColumns: 1,
    });
  }

  if (artifact.contactInfo.addresses.length > 0 || artifact.contactInfo.phones.length > 0) {
    sections.push({
      type: "footer",
      position: sections.length,
      ctaLabels: [],
      hasForm: false,
      hasImage: false,
      estimatedColumns: 1,
    });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Funnel signal mapping
// ---------------------------------------------------------------------------

function buildFunnelSignals(artifact: MarketingArtifact): DesignIngestionResult["funnel"] {
  const hasBooking = artifact.ctaLabels.some((c) => /schedule|book|appointment/i.test(c));
  const hasPricing = (artifact.offer?.pricing.length ?? 0) > 0;
  const hasChat = artifact.contactInfo.socialHandles.length > 0;
  const hasTestimonials = artifact.trustSignals.length > 0;

  const formFields: string[] = [];
  if (artifact.contactInfo.phones.length > 0) formFields.push("phone");
  if (artifact.contactInfo.emails.length > 0) formFields.push("email");
  if (artifact.contactInfo.addresses.length > 0) formFields.push("address");

  const detectedFamily = hasBooking
    ? "direct-conversion"
    : hasPricing
      ? "direct-conversion"
      : "lead-magnet";

  return {
    formFields,
    hasChat,
    hasBooking,
    hasCheckout: hasPricing && artifact.ctaLabels.some((c) => /order|buy|pay/i.test(c)),
    hasPricing,
    hasTestimonials,
    hasVideo: false,
    hasFaq: false,
    detectedFamily,
  };
}

// ---------------------------------------------------------------------------
// Main converter
// ---------------------------------------------------------------------------

export function convertArtifactToIngestion(artifact: MarketingArtifact): DesignIngestionResult {
  const allColors = artifact.colors;
  const [primary, secondary, accent, background, text] = allColors;

  const sections = buildLayoutSections(artifact);
  const hasAboveFoldCta = sections.slice(0, 2).some(
    (s) => s.ctaLabels.length > 0 || s.type === "hero" || s.type === "cta",
  );

  const valuePropositions: string[] = [];
  if (artifact.offer?.primaryOffer) valuePropositions.push(artifact.offer.primaryOffer);
  for (const g of artifact.offer?.guarantees ?? []) {
    if (!valuePropositions.includes(g)) valuePropositions.push(g);
  }
  for (const b of artifact.offer?.bonuses ?? []) {
    if (!valuePropositions.includes(b)) valuePropositions.push(b);
  }

  const funnel = buildFunnelSignals(artifact);

  return {
    sourceUrl: `artifact://${artifact.id}`,
    scrapedAt: artifact.createdAt,
    tokens: {
      colors: {
        primary,
        secondary,
        accent,
        background,
        text,
        all: allColors,
      },
      typography: {
        headingFont: undefined,
        bodyFont: undefined,
        fontSizes: [],
      },
      spacing: {
        base: undefined,
        scale: [],
      },
      borderRadius: [],
    },
    layout: {
      sections,
      sectionCount: sections.length,
      hasAboveFoldCta,
    },
    copy: {
      headlines: artifact.headline ? [artifact.headline] : [],
      subheadlines: artifact.subheadline ? [artifact.subheadline] : [],
      valuePropositions: valuePropositions.slice(0, 10),
      ctaLabels: artifact.ctaLabels,
      socialProofClaims: artifact.trustSignals,
      faqQuestions: [],
    },
    funnel,
    confidence: artifact.confidence,
  };
}
