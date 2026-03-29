import { scrapeLocalBusinesses } from "./integrations/web-scraper.ts";
import { scrapePage, type ScrapeResult } from "./integrations/web-scraper.ts";
import { ingestDesignFromScrape } from "./design-ingestion.ts";
import { nicheCatalog } from "./catalog.ts";

export interface DiscoveredBusiness {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  niche: string;
  geo: string;
  discoveredAt: string;
}

export interface BusinessQualitySignals {
  hasWebsite: boolean;
  websiteQuality: number;
  hasPhone: boolean;
  hasEmail: boolean;
  reviewScore: number;
  reviewVolume: number;
  digitalPresenceGap: number;
  growthIndicators: string[];
  weaknesses: string[];
}

export interface ScoredBusiness extends DiscoveredBusiness {
  id: string;
  qualitySignals: BusinessQualitySignals;
  opportunityScore: number;
  digitalGapScore: number;
  affiliatePotential: number;
  partnerPotential: number;
  designIngestion?: ReturnType<typeof ingestDesignFromScrape>;
}

export interface ScoutConfig {
  niche: string;
  geo: string;
  tenantId: string;
  maxResults?: number;
  analyzeWebsites?: boolean;
}

export interface ScoutResult {
  config: ScoutConfig;
  scoutedAt: string;
  businessesFound: number;
  businessesScored: number;
  businesses: ScoredBusiness[];
  topProspects: ScoredBusiness[];
  topAffiliates: ScoredBusiness[];
  topPartners: ScoredBusiness[];
}

function generateProspectId(): string {
  return `prospect_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function scoreReviewQuality(rating?: number, reviewCount?: number): { score: number; volume: number } {
  if (!rating) return { score: 0, volume: 0 };

  const ratingScore = Math.min(100, (rating / 5) * 80);
  const volumeScore = Math.min(100, Math.sqrt(reviewCount ?? 0) * 10);

  return { score: ratingScore, volume: volumeScore };
}

function assessDigitalPresenceGap(
  hasWebsite: boolean,
  websiteQuality: number,
  reviewScore: number,
): number {
  if (!hasWebsite && reviewScore > 60) return 95;
  if (!hasWebsite) return 70;

  if (websiteQuality < 30 && reviewScore > 60) return 85;
  if (websiteQuality < 50 && reviewScore > 50) return 65;
  if (websiteQuality < 70) return 40;

  return Math.max(0, 30 - websiteQuality / 5);
}

function detectGrowthIndicators(business: DiscoveredBusiness): string[] {
  const indicators: string[] = [];

  if (business.rating && business.rating >= 4.5) {
    indicators.push("high-customer-satisfaction");
  }
  if (business.reviewCount && business.reviewCount > 50) {
    indicators.push("established-reputation");
  }
  if (business.reviewCount && business.reviewCount > 200) {
    indicators.push("high-volume-business");
  }
  if (business.website) {
    indicators.push("digital-aware");
  }
  if (!business.website && business.rating && business.rating >= 4.0) {
    indicators.push("strong-offline-weak-online");
  }

  return indicators;
}

function detectWeaknesses(
  hasWebsite: boolean,
  websiteQuality: number,
  designIngestion?: ReturnType<typeof ingestDesignFromScrape>,
): string[] {
  const weaknesses: string[] = [];

  if (!hasWebsite) {
    weaknesses.push("no-website");
    return weaknesses;
  }

  if (websiteQuality < 30) weaknesses.push("poor-website-quality");
  if (websiteQuality < 60) weaknesses.push("below-average-website");

  if (designIngestion) {
    if (!designIngestion.funnel.hasChat) weaknesses.push("no-live-chat");
    if (!designIngestion.funnel.hasBooking) weaknesses.push("no-online-booking");
    if (designIngestion.copy.ctaLabels.length < 2) weaknesses.push("weak-cta-presence");
    if (!designIngestion.funnel.hasTestimonials) weaknesses.push("no-social-proof");
    if (designIngestion.layout.sectionCount < 4) weaknesses.push("thin-website-content");
    if (!designIngestion.funnel.hasFaq) weaknesses.push("no-faq-section");
    if (designIngestion.tokens.colors.all.length < 3) weaknesses.push("limited-brand-design");
  }

  return weaknesses;
}

function computeWebsiteQuality(designIngestion?: ReturnType<typeof ingestDesignFromScrape>): number {
  if (!designIngestion) return 0;

  let score = 0;

  score += Math.min(20, designIngestion.layout.sectionCount * 3);
  score += Math.min(15, designIngestion.copy.headlines.length * 3);
  score += Math.min(10, designIngestion.copy.ctaLabels.length * 5);
  score += designIngestion.funnel.hasChat ? 8 : 0;
  score += designIngestion.funnel.hasBooking ? 8 : 0;
  score += designIngestion.funnel.hasPricing ? 5 : 0;
  score += designIngestion.funnel.hasTestimonials ? 8 : 0;
  score += designIngestion.funnel.hasVideo ? 5 : 0;
  score += designIngestion.funnel.hasFaq ? 5 : 0;
  score += Math.min(16, designIngestion.tokens.colors.all.length * 2);

  return Math.min(100, score);
}

function computeOpportunityScore(
  digitalGapScore: number,
  reviewScore: number,
  growthIndicators: string[],
): number {
  const gapWeight = 0.45;
  const qualityWeight = 0.35;
  const growthWeight = 0.20;

  const growthScore = Math.min(100, growthIndicators.length * 25);

  return Math.round(
    digitalGapScore * gapWeight +
    reviewScore * qualityWeight +
    growthScore * growthWeight,
  );
}

function computeAffiliatePotential(
  websiteQuality: number,
  reviewScore: number,
  hasWebsite: boolean,
  designIngestion?: ReturnType<typeof ingestDesignFromScrape>,
): number {
  if (!hasWebsite) return 5;

  let score = 0;

  score += Math.min(30, websiteQuality * 0.3);
  score += Math.min(25, reviewScore * 0.25);

  if (designIngestion) {
    if (designIngestion.funnel.hasPricing) score += 15;
    if (designIngestion.copy.ctaLabels.length >= 3) score += 10;
    if (designIngestion.layout.sectionCount >= 6) score += 10;
    if (designIngestion.funnel.hasTestimonials) score += 10;
  }

  return Math.min(100, Math.round(score));
}

function computePartnerPotential(
  niche: string,
  reviewScore: number,
  growthIndicators: string[],
): number {
  let score = 0;

  score += Math.min(30, reviewScore * 0.3);
  score += Math.min(25, growthIndicators.length * 12);

  const complementaryNiches = getComplementaryNiches(niche);
  if (complementaryNiches.length > 0) score += 20;

  if (growthIndicators.includes("established-reputation")) score += 15;
  if (growthIndicators.includes("high-volume-business")) score += 10;

  return Math.min(100, Math.round(score));
}

function getComplementaryNiches(niche: string): string[] {
  const complements: Record<string, string[]> = {
    "home-services": ["real-estate", "insurance", "moving"],
    legal: ["insurance", "finance", "real-estate"],
    coaching: ["marketing", "tech", "finance"],
    "real-estate": ["home-services", "legal", "insurance", "moving"],
    insurance: ["legal", "real-estate", "finance"],
    finance: ["legal", "insurance", "coaching"],
    dental: ["orthodontics", "cosmetic", "health"],
    health: ["dental", "coaching", "fitness"],
    fitness: ["health", "coaching", "nutrition"],
    roofing: ["home-services", "solar", "gutters"],
    plumbing: ["home-services", "hvac", "electrical"],
    hvac: ["home-services", "plumbing", "electrical"],
    electrical: ["home-services", "hvac", "plumbing", "solar"],
    solar: ["roofing", "electrical", "home-services"],
  };

  return complements[niche.toLowerCase()] ?? [];
}

async function analyzeWebsite(url: string): Promise<ReturnType<typeof ingestDesignFromScrape> | undefined> {
  try {
    const scrapeResult = await scrapePage(url);
    return ingestDesignFromScrape(scrapeResult);
  } catch {
    return undefined;
  }
}

function scoreBusiness(
  business: DiscoveredBusiness,
  designIngestion?: ReturnType<typeof ingestDesignFromScrape>,
): ScoredBusiness {
  const hasWebsite = !!business.website;
  const websiteQuality = computeWebsiteQuality(designIngestion);
  const { score: reviewScore, volume: reviewVolume } = scoreReviewQuality(business.rating, business.reviewCount);
  const digitalGapScore = assessDigitalPresenceGap(hasWebsite, websiteQuality, reviewScore);
  const growthIndicators = detectGrowthIndicators(business);
  const weaknesses = detectWeaknesses(hasWebsite, websiteQuality, designIngestion);
  const hasPhone = !!business.phone;
  const hasEmail = !!business.email;

  const opportunityScore = computeOpportunityScore(digitalGapScore, reviewScore, growthIndicators);
  const affiliatePotential = computeAffiliatePotential(websiteQuality, reviewScore, hasWebsite, designIngestion);
  const partnerPotential = computePartnerPotential(business.niche, reviewScore, growthIndicators);

  return {
    ...business,
    id: generateProspectId(),
    qualitySignals: {
      hasWebsite,
      websiteQuality,
      hasPhone,
      hasEmail,
      reviewScore,
      reviewVolume,
      digitalPresenceGap: digitalGapScore,
      growthIndicators,
      weaknesses,
    },
    opportunityScore,
    digitalGapScore,
    affiliatePotential,
    partnerPotential,
    designIngestion,
  };
}

export async function scoutNiche(config: ScoutConfig): Promise<ScoutResult> {
  const maxResults = config.maxResults ?? 10;

  const rawBusinesses = await scrapeLocalBusinesses(config.niche, config.geo);

  const discovered: DiscoveredBusiness[] = rawBusinesses.slice(0, maxResults).map((b) => ({
    name: b.name,
    address: b.address,
    phone: b.phone,
    website: b.website,
    rating: b.rating,
    niche: config.niche,
    geo: config.geo,
    discoveredAt: new Date().toISOString(),
  }));

  const scored: ScoredBusiness[] = [];

  for (const business of discovered) {
    let designIngestion: ReturnType<typeof ingestDesignFromScrape> | undefined;

    if (config.analyzeWebsites && business.website) {
      designIngestion = await analyzeWebsite(business.website);
    }

    scored.push(scoreBusiness(business, designIngestion));
  }

  scored.sort((a, b) => b.opportunityScore - a.opportunityScore);

  const topProspects = scored
    .filter((b) => b.opportunityScore >= 50)
    .slice(0, 5);

  const topAffiliates = [...scored]
    .sort((a, b) => b.affiliatePotential - a.affiliatePotential)
    .filter((b) => b.affiliatePotential >= 40)
    .slice(0, 5);

  const topPartners = [...scored]
    .sort((a, b) => b.partnerPotential - a.partnerPotential)
    .filter((b) => b.partnerPotential >= 40)
    .slice(0, 5);

  return {
    config,
    scoutedAt: new Date().toISOString(),
    businessesFound: rawBusinesses.length,
    businessesScored: scored.length,
    businesses: scored,
    topProspects,
    topAffiliates,
    topPartners,
  };
}

export async function scoutAllNiches(
  geo: string,
  tenantId: string,
  options?: { analyzeWebsites?: boolean; maxPerNiche?: number },
): Promise<ScoutResult[]> {
  const results: ScoutResult[] = [];

  for (const slug of Object.keys(nicheCatalog)) {
    if (slug === "general") continue;

    const result = await scoutNiche({
      niche: nicheCatalog[slug].label,
      geo,
      tenantId,
      maxResults: options?.maxPerNiche ?? 10,
      analyzeWebsites: options?.analyzeWebsites ?? false,
    });

    results.push(result);
  }

  return results;
}

export { generateProspectId, scoreBusiness, computeWebsiteQuality, assessDigitalPresenceGap, getComplementaryNiches };
