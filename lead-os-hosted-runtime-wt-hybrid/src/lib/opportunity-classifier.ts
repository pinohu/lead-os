import type { ScoredBusiness } from "./discovery-scout.ts";

export type OpportunityType = "managed-service" | "white-label" | "implementation" | "marketplace" | "affiliate" | "referral-partner";

export type OpportunityPriority = "hot" | "warm" | "cool" | "cold";

export interface ClassifiedOpportunity {
  businessId: string;
  businessName: string;
  type: OpportunityType;
  priority: OpportunityPriority;
  confidence: number;
  reasoning: string[];
  suggestedAction: string;
  suggestedRevenueModel: 1 | 2 | 3 | 4;
  estimatedMonthlyValue: number;
  outreachTemplate: string;
}

export interface ClassificationResult {
  business: ScoredBusiness;
  opportunities: ClassifiedOpportunity[];
  primaryOpportunity: ClassifiedOpportunity;
  totalEstimatedValue: number;
}

const REVENUE_MODEL_LABELS: Record<number, string> = {
  1: "Managed service ($2K-10K/mo)",
  2: "White-label SaaS ($99-499/mo)",
  3: "Implementation + retainer ($5K-25K setup + $1K-5K/mo)",
  4: "Lead marketplace (per-lead pricing)",
};

function classifyAsManagedService(business: ScoredBusiness): ClassifiedOpportunity | null {
  const { qualitySignals, opportunityScore } = business;

  if (qualitySignals.digitalPresenceGap < 50) return null;
  if (qualitySignals.reviewScore < 40) return null;

  const reasoning: string[] = [];
  let confidence = 0;

  if (!qualitySignals.hasWebsite) {
    reasoning.push("No website — needs full digital presence buildout");
    confidence += 30;
  } else if (qualitySignals.websiteQuality < 40) {
    reasoning.push("Poor website quality — needs complete overhaul");
    confidence += 25;
  }

  if (qualitySignals.reviewScore >= 60) {
    reasoning.push("Strong reviews indicate real demand and satisfied customers");
    confidence += 20;
  }

  if (qualitySignals.growthIndicators.includes("strong-offline-weak-online")) {
    reasoning.push("Strong offline but weak online — classic managed service candidate");
    confidence += 25;
  }

  if (qualitySignals.weaknesses.length >= 3) {
    reasoning.push(`${qualitySignals.weaknesses.length} digital weaknesses identified`);
    confidence += 15;
  }

  if (confidence < 40) return null;

  const estimatedValue = qualitySignals.reviewScore > 70 ? 5000 : qualitySignals.reviewScore > 50 ? 3000 : 2000;

  return {
    businessId: business.id,
    businessName: business.name,
    type: "managed-service",
    priority: confidence >= 70 ? "hot" : confidence >= 55 ? "warm" : "cool",
    confidence: Math.min(100, confidence),
    reasoning,
    suggestedAction: `Outreach with digital audit showing ${qualitySignals.weaknesses.length} improvement areas`,
    suggestedRevenueModel: 1,
    estimatedMonthlyValue: estimatedValue,
    outreachTemplate: buildManagedServiceOutreach(business),
  };
}

function classifyAsWhiteLabel(business: ScoredBusiness): ClassifiedOpportunity | null {
  const { qualitySignals } = business;

  if (!qualitySignals.hasWebsite) return null;
  if (qualitySignals.websiteQuality < 50) return null;

  const reasoning: string[] = [];
  let confidence = 0;

  if (qualitySignals.websiteQuality >= 60) {
    reasoning.push("Decent website — already digitally literate, self-service candidate");
    confidence += 25;
  }

  if (qualitySignals.weaknesses.includes("no-live-chat")) {
    reasoning.push("Missing live chat — Lead OS widget adds immediate value");
    confidence += 15;
  }

  if (qualitySignals.weaknesses.includes("no-online-booking")) {
    reasoning.push("No booking system — qualification funnel fills this gap");
    confidence += 15;
  }

  if (qualitySignals.weaknesses.includes("weak-cta-presence")) {
    reasoning.push("Weak CTAs — conversion optimization opportunity");
    confidence += 10;
  }

  if (qualitySignals.reviewScore >= 50) {
    reasoning.push("Moderate reputation — business is viable and growing");
    confidence += 10;
  }

  if (confidence < 35) return null;

  const tier = qualitySignals.websiteQuality >= 70 ? 499 : qualitySignals.websiteQuality >= 50 ? 249 : 99;

  return {
    businessId: business.id,
    businessName: business.name,
    type: "white-label",
    priority: confidence >= 60 ? "warm" : "cool",
    confidence: Math.min(100, confidence),
    reasoning,
    suggestedAction: `Demo showing widget integration on their existing site`,
    suggestedRevenueModel: 2,
    estimatedMonthlyValue: tier,
    outreachTemplate: buildWhiteLabelOutreach(business),
  };
}

function classifyAsAffiliate(business: ScoredBusiness): ClassifiedOpportunity | null {
  if (business.affiliatePotential < 45) return null;

  const reasoning: string[] = [];
  let confidence = 0;

  if (business.qualitySignals.websiteQuality >= 60) {
    reasoning.push("Strong web presence — can drive referral traffic");
    confidence += 20;
  }

  if (business.qualitySignals.reviewScore >= 60) {
    reasoning.push("High credibility — endorsement carries weight");
    confidence += 20;
  }

  if (business.qualitySignals.growthIndicators.includes("high-volume-business")) {
    reasoning.push("High volume — large potential referral base");
    confidence += 15;
  }

  if (business.qualitySignals.growthIndicators.includes("established-reputation")) {
    reasoning.push("Established reputation — trusted referral source");
    confidence += 10;
  }

  if (confidence < 30) return null;

  return {
    businessId: business.id,
    businessName: business.name,
    type: "affiliate",
    priority: confidence >= 50 ? "warm" : "cool",
    confidence: Math.min(100, confidence),
    reasoning,
    suggestedAction: "Propose affiliate partnership with per-lead commission",
    suggestedRevenueModel: 4,
    estimatedMonthlyValue: Math.round(business.affiliatePotential * 5),
    outreachTemplate: buildAffiliateOutreach(business),
  };
}

function classifyAsPartner(business: ScoredBusiness): ClassifiedOpportunity | null {
  if (business.partnerPotential < 45) return null;

  const reasoning: string[] = [];
  let confidence = 0;

  if (business.qualitySignals.growthIndicators.includes("established-reputation")) {
    reasoning.push("Established business — reliable partner candidate");
    confidence += 20;
  }

  if (business.qualitySignals.reviewScore >= 50) {
    reasoning.push("Solid reputation — customers trust their recommendations");
    confidence += 15;
  }

  if (business.partnerPotential >= 60) {
    reasoning.push("High complementary niche alignment — natural referral flow");
    confidence += 20;
  }

  if (business.qualitySignals.growthIndicators.includes("high-volume-business")) {
    reasoning.push("High-volume operation — large referral potential");
    confidence += 15;
  }

  if (confidence < 30) return null;

  return {
    businessId: business.id,
    businessName: business.name,
    type: "referral-partner",
    priority: confidence >= 55 ? "warm" : "cool",
    confidence: Math.min(100, confidence),
    reasoning,
    suggestedAction: "Propose mutual referral agreement with shared lead pipeline",
    suggestedRevenueModel: 4,
    estimatedMonthlyValue: Math.round(business.partnerPotential * 8),
    outreachTemplate: buildPartnerOutreach(business),
  };
}

function buildManagedServiceOutreach(business: ScoredBusiness): string {
  const weaknessCount = business.qualitySignals.weaknesses.length;
  return [
    `Subject: ${business.name} — ${weaknessCount} ways to get more customers from your website`,
    "",
    `Hi,`,
    "",
    `I analyzed ${business.name}'s online presence and found ${weaknessCount} specific areas where you're leaving customers on the table.`,
    "",
    business.qualitySignals.weaknesses.includes("no-website")
      ? "You have no website — your competitors are getting the customers searching for your services online."
      : `Your current site is missing ${business.qualitySignals.weaknesses.slice(0, 3).join(", ").replace(/-/g, " ")}.`,
    "",
    `With your ${business.rating ? business.rating + "-star" : "strong"} reputation, these fixes would turn your existing traffic into booked appointments.`,
    "",
    "Would a 15-minute walkthrough of what I found be useful?",
  ].join("\n");
}

function buildWhiteLabelOutreach(business: ScoredBusiness): string {
  const missing = business.qualitySignals.weaknesses.filter((w) =>
    ["no-live-chat", "no-online-booking", "weak-cta-presence"].includes(w),
  );
  return [
    `Subject: Add instant lead capture to ${business.name}'s website`,
    "",
    `Hi,`,
    "",
    `I noticed ${business.name}'s site ${missing.length > 0 ? `is missing ${missing.join(", ").replace(/-/g, " ")}` : "could capture more leads with a simple widget"}.`,
    "",
    `We have a plug-and-play tool that adds lead capture, qualification, and automated follow-up to your existing site — no redesign needed.`,
    "",
    `Want to see a quick demo with your actual site?`,
  ].join("\n");
}

function buildAffiliateOutreach(business: ScoredBusiness): string {
  return [
    `Subject: Partnership opportunity for ${business.name}`,
    "",
    `Hi,`,
    "",
    `${business.name} clearly has a strong customer base${business.rating ? ` (${business.rating} stars)` : ""}.`,
    "",
    `We help businesses in complementary industries generate leads. When your customers need related services, we'd love to be your referral partner — and pay you a commission for every lead that converts.`,
    "",
    `Would you be open to a quick call to discuss how this could work?`,
  ].join("\n");
}

function buildPartnerOutreach(business: ScoredBusiness): string {
  return [
    `Subject: Mutual referral idea for ${business.name}`,
    "",
    `Hi,`,
    "",
    `I work with businesses in your area that serve overlapping customer bases. The idea is simple: when your customers need services you don't offer, you refer them to us — and vice versa.`,
    "",
    `No cost, no contracts. Just a shared pipeline where we both win.`,
    "",
    `Worth a 10-minute conversation?`,
  ].join("\n");
}

export function classifyBusiness(business: ScoredBusiness): ClassificationResult {
  const opportunities: ClassifiedOpportunity[] = [];

  const managed = classifyAsManagedService(business);
  if (managed) opportunities.push(managed);

  const whiteLabel = classifyAsWhiteLabel(business);
  if (whiteLabel) opportunities.push(whiteLabel);

  const affiliate = classifyAsAffiliate(business);
  if (affiliate) opportunities.push(affiliate);

  const partner = classifyAsPartner(business);
  if (partner) opportunities.push(partner);

  if (opportunities.length === 0) {
    opportunities.push({
      businessId: business.id,
      businessName: business.name,
      type: "white-label",
      priority: "cold",
      confidence: 10,
      reasoning: ["No strong signals — low priority prospect"],
      suggestedAction: "Monitor for changes in online presence or reviews",
      suggestedRevenueModel: 2,
      estimatedMonthlyValue: 0,
      outreachTemplate: "",
    });
  }

  opportunities.sort((a, b) => b.confidence - a.confidence);

  return {
    business,
    opportunities,
    primaryOpportunity: opportunities[0],
    totalEstimatedValue: opportunities.reduce((sum, o) => sum + o.estimatedMonthlyValue, 0),
  };
}

export function classifyAll(businesses: ScoredBusiness[]): ClassificationResult[] {
  return businesses
    .map(classifyBusiness)
    .sort((a, b) => b.primaryOpportunity.confidence - a.primaryOpportunity.confidence);
}

export { REVENUE_MODEL_LABELS };
