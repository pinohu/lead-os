import { queryPostgres, getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Review {
  id: string;
  tenantId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  source: "google" | "yelp" | "internal" | "manual";
  reviewerName: string;
  date: string;
  verified: boolean;
}

export interface ReviewSummary {
  tenantId: string;
  avgRating: number;
  totalCount: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
}

export interface Guarantee {
  type: "money-back" | "satisfaction" | "performance" | "time-based";
  title: string;
  description: string;
  niche: string;
}

export interface SocialProofElement {
  type: "counter" | "live-activity" | "recommendation" | "recent-activity";
  message: string;
  value: number;
  html: string;
}

export interface SocialProofEvent {
  id: string;
  tenantId: string;
  eventType: string;
  customerName: string;
  location: string;
  action: string;
  timestamp: string;
}

export interface TrustScore {
  tenantId: string;
  score: number;
  components: {
    reviewScore: number;
    guaranteeScore: number;
    certificationScore: number;
    socialProofScore: number;
    responseTimeScore: number;
    yearsInBusinessScore: number;
  };
  calculatedAt: string;
}

export interface TrustRecommendation {
  priority: "high" | "medium" | "low";
  category: string;
  recommendation: string;
  expectedImpact: number;
}

export interface Certification {
  id: string;
  tenantId: string;
  type: "bbb" | "industry" | "insurance" | "license" | "other";
  name: string;
  issuedBy: string;
  validUntil: string;
  verificationUrl: string;
}

export interface TrustBadge {
  type: string;
  label: string;
  html: string;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

import { EvictableMap } from "./evictable-map.ts";

const reviewStore: Map<string, Review> = new EvictableMap();
const certificationStore: Map<string, Certification> = new EvictableMap();
const socialProofEvents: SocialProofEvent[] = [];
const tenantMeta: Map<string, { yearsInBusiness: number; avgResponseTimeHours: number }> = new EvictableMap();

let reviewIdCounter = 0;
let certIdCounter = 0;
let proofEventIdCounter = 0;

function generateReviewId(): string {
  reviewIdCounter += 1;
  return `rev_${Date.now()}_${reviewIdCounter}`;
}

function generateCertId(): string {
  certIdCounter += 1;
  return `cert_${Date.now()}_${certIdCounter}`;
}

function generateProofEventId(): string {
  proofEventIdCounter += 1;
  return `spe_${Date.now()}_${proofEventIdCounter}`;
}

// ---------------------------------------------------------------------------
// Review & Testimonial System
// ---------------------------------------------------------------------------

export async function recordReview(
  tenantId: string,
  review: Omit<Review, "id" | "tenantId">,
): Promise<Review> {
  const entry: Review = {
    id: generateReviewId(),
    tenantId,
    rating: review.rating,
    text: review.text,
    source: review.source,
    reviewerName: review.reviewerName,
    date: review.date,
    verified: review.verified,
  };

  reviewStore.set(entry.id, entry);

  if (getPool()) {
    await queryPostgres(
      `INSERT INTO trust_reviews (id, tenant_id, rating, text, source, reviewer_name, date, verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO NOTHING`,
      [entry.id, tenantId, entry.rating, entry.text, entry.source, entry.reviewerName, entry.date, entry.verified],
    );
  }

  return entry;
}

export function getReviewSummary(tenantId: string): ReviewSummary {
  const reviews: Review[] = [];
  for (const r of Array.from(reviewStore.values())) {
    if (r.tenantId === tenantId) reviews.push(r);
  }

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  for (const r of reviews) {
    distribution[r.rating] += 1;
    totalRating += r.rating;
  }

  const avgRating = reviews.length > 0 ? Math.round((totalRating / reviews.length) * 100) / 100 : 0;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;
  const neutral = reviews.length - positive - negative;

  return {
    tenantId,
    avgRating,
    totalCount: reviews.length,
    ratingDistribution: distribution,
    sentimentBreakdown: { positive, neutral, negative },
  };
}

export function generateTestimonialSnippet(
  reviews: Review[],
  targetEmotion: "trust" | "urgency" | "quality" | "value",
): Review | null {
  if (reviews.length === 0) return null;

  const keywords: Record<string, string[]> = {
    trust: ["trust", "reliable", "honest", "transparent", "professional", "dependable"],
    urgency: ["fast", "quick", "immediate", "responsive", "same day", "right away"],
    quality: ["quality", "excellent", "outstanding", "amazing", "best", "perfect", "thorough"],
    value: ["value", "worth", "affordable", "price", "cost", "budget", "deal", "savings"],
  };

  const emotionKeywords = keywords[targetEmotion] ?? keywords.trust;

  const scored = reviews
    .filter((r) => r.rating >= 4)
    .map((r) => {
      const textLower = r.text.toLowerCase();
      const matchCount = emotionKeywords.filter((kw) => textLower.includes(kw)).length;
      const lengthBonus = r.text.length > 50 && r.text.length < 300 ? 1 : 0;
      const verifiedBonus = r.verified ? 2 : 0;
      return { review: r, score: matchCount + lengthBonus + verifiedBonus };
    })
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].review : null;
}

export function generateStarRating(avg: number, count: number): string {
  const rounded = Math.round(avg * 2) / 2;
  const fullStars = Math.floor(rounded);
  const halfStar = rounded % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  const starSpans = [
    ...Array.from({ length: fullStars }, () => '<span aria-hidden="true" style="color:#f59e0b">&#9733;</span>'),
    ...(halfStar ? ['<span aria-hidden="true" style="color:#f59e0b">&#9734;</span>'] : []),
    ...Array.from({ length: emptyStars }, () => '<span aria-hidden="true" style="color:#d1d5db">&#9734;</span>'),
  ].join("");

  return `<div itemscope itemtype="https://schema.org/AggregateRating" role="img" aria-label="${avg} out of 5 stars based on ${count} reviews">
  <meta itemprop="ratingValue" content="${avg}">
  <meta itemprop="reviewCount" content="${count}">
  <meta itemprop="bestRating" content="5">
  ${starSpans}
  <span style="margin-left:4px;font-size:14px;color:#6b7280">${avg} (${count} reviews)</span>
</div>`;
}

// ---------------------------------------------------------------------------
// Guarantee System
// ---------------------------------------------------------------------------

const GUARANTEE_TEMPLATES: Record<string, Guarantee[]> = {
  construction: [
    { type: "satisfaction", title: "Workmanship Guarantee", description: "We stand behind every project. If the workmanship does not meet agreed specifications, we will fix it at no additional cost.", niche: "construction" },
    { type: "time-based", title: "On-Time Completion", description: "Your project will be completed by the agreed deadline or we will discount 5% for each week of delay.", niche: "construction" },
    { type: "money-back", title: "Free Estimate Guarantee", description: "If our estimate is not competitive, your consultation is completely free with no obligation.", niche: "construction" },
  ],
  legal: [
    { type: "money-back", title: "Free Consultation Guarantee", description: "Your initial consultation is 100% free. If we cannot help, you owe nothing.", niche: "legal" },
    { type: "performance", title: "No Win, No Fee", description: "You only pay if we win your case. No hidden charges, no surprise fees.", niche: "legal" },
    { type: "satisfaction", title: "Communication Guarantee", description: "We return all calls within 24 hours or your next billing hour is free.", niche: "legal" },
  ],
  dental: [
    { type: "satisfaction", title: "Smile Satisfaction", description: "If you are not happy with your results, we will redo the treatment at no charge.", niche: "dental" },
    { type: "money-back", title: "Price Match Guarantee", description: "Found a lower price for the same treatment? We will match it.", niche: "dental" },
    { type: "time-based", title: "No Wait Guarantee", description: "If your appointment starts more than 15 minutes late, your next cleaning is free.", niche: "dental" },
  ],
  hvac: [
    { type: "satisfaction", title: "Comfort Guarantee", description: "If your system does not maintain the desired temperature, we will make it right at no cost.", niche: "hvac" },
    { type: "time-based", title: "Same-Day Service", description: "We arrive within 4 hours of your call or the diagnostic fee is waived.", niche: "hvac" },
    { type: "performance", title: "Efficiency Guarantee", description: "Your new system will reduce energy costs by at least 20% or we refund the difference.", niche: "hvac" },
  ],
  roofing: [
    { type: "performance", title: "Leak-Free Guarantee", description: "If your new roof leaks within 10 years, we repair it free of charge.", niche: "roofing" },
    { type: "satisfaction", title: "Workmanship Warranty", description: "Our craftsmanship is guaranteed for 25 years, covering materials and labor.", niche: "roofing" },
    { type: "money-back", title: "Free Storm Inspection", description: "Every storm damage inspection is free with zero obligation to proceed.", niche: "roofing" },
  ],
};

const DEFAULT_GUARANTEES: Guarantee[] = [
  { type: "satisfaction", title: "Satisfaction Guarantee", description: "We are not satisfied until you are. If the work does not meet your expectations, we will make it right.", niche: "default" },
  { type: "money-back", title: "Money-Back Guarantee", description: "If you are not completely satisfied within 30 days, we will provide a full refund.", niche: "default" },
  { type: "time-based", title: "Response Time Guarantee", description: "We respond to all inquiries within 2 business hours or your first service is discounted.", niche: "default" },
];

export function generateGuarantee(niche: string, offerType: Guarantee["type"]): Guarantee {
  const templates = GUARANTEE_TEMPLATES[niche.toLowerCase()] ?? DEFAULT_GUARANTEES;
  const match = templates.find((t) => t.type === offerType);
  return match ?? templates[0];
}

export function getGuaranteeTemplates(niche: string): Guarantee[] {
  return GUARANTEE_TEMPLATES[niche.toLowerCase()] ?? DEFAULT_GUARANTEES;
}

// ---------------------------------------------------------------------------
// Social Proof
// ---------------------------------------------------------------------------

export function recordSocialProofEvent(
  tenantId: string,
  event: Omit<SocialProofEvent, "id" | "tenantId" | "timestamp">,
): SocialProofEvent {
  const entry: SocialProofEvent = {
    id: generateProofEventId(),
    tenantId,
    eventType: event.eventType,
    customerName: event.customerName,
    location: event.location,
    action: event.action,
    timestamp: new Date().toISOString(),
  };
  socialProofEvents.push(entry);
  return entry;
}

export function generateSocialProof(
  tenantId: string,
  type: "counter" | "live-activity" | "recommendation" | "recent-activity",
): SocialProofElement {
  const tenantEvents = socialProofEvents.filter((e) => e.tenantId === tenantId);
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentEvents = tenantEvents.filter((e) => new Date(e.timestamp).getTime() > thirtyDaysAgo);

  const reviews: Review[] = [];
  for (const r of Array.from(reviewStore.values())) {
    if (r.tenantId === tenantId) reviews.push(r);
  }

  switch (type) {
    case "counter": {
      const count = recentEvents.length;
      return {
        type: "counter",
        message: `${count} customers served this month`,
        value: count,
        html: `<div role="status" aria-live="polite" style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:#ecfdf5;border-radius:8px;font-size:14px;font-weight:600;color:#065f46"><span style="font-size:20px">&#9989;</span> <strong>${count}</strong> customers served this month</div>`,
      };
    }
    case "live-activity": {
      const viewing = Math.max(1, Math.floor(recentEvents.length * 0.1) + 1);
      return {
        type: "live-activity",
        message: `${viewing} people viewing this right now`,
        value: viewing,
        html: `<div role="status" aria-live="polite" style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:#fef3c7;border-radius:8px;font-size:14px;font-weight:600;color:#92400e"><span style="font-size:16px;animation:pulse 2s infinite">&#128308;</span> <strong>${viewing}</strong> people viewing right now</div>`,
      };
    }
    case "recommendation": {
      const positiveCount = reviews.filter((r) => r.rating >= 4).length;
      const pct = reviews.length > 0 ? Math.round((positiveCount / reviews.length) * 100) : 0;
      return {
        type: "recommendation",
        message: `${pct}% of customers recommend us`,
        value: pct,
        html: `<div role="status" aria-live="polite" style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:#eff6ff;border-radius:8px;font-size:14px;font-weight:600;color:#1e40af"><span style="font-size:18px">&#128077;</span> <strong>${pct}%</strong> of customers recommend us</div>`,
      };
    }
    case "recent-activity": {
      const latest = tenantEvents[tenantEvents.length - 1];
      const message = latest
        ? `${latest.customerName} from ${latest.location} just ${latest.action}`
        : "Someone nearby just booked a service";
      return {
        type: "recent-activity",
        message,
        value: tenantEvents.length,
        html: `<div role="status" aria-live="polite" style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:#f5f3ff;border-radius:8px;font-size:14px;font-weight:600;color:#5b21b6"><span style="font-size:16px">&#127881;</span> ${message}</div>`,
      };
    }
  }
}

const NICHE_PROOF_CONFIG: Record<string, { bestTypes: SocialProofElement["type"][]; emphasis: string }> = {
  construction: { bestTypes: ["counter", "recent-activity"], emphasis: "Project count builds authority" },
  legal: { bestTypes: ["recommendation", "counter"], emphasis: "Recommendation rate signals credibility" },
  dental: { bestTypes: ["recommendation", "recent-activity"], emphasis: "Patient satisfaction drives bookings" },
  hvac: { bestTypes: ["live-activity", "counter"], emphasis: "Urgency and volume drive emergency calls" },
  roofing: { bestTypes: ["counter", "recent-activity"], emphasis: "Volume signals reliability for large projects" },
};

export function getSocialProofConfig(niche: string): { bestTypes: SocialProofElement["type"][]; emphasis: string } {
  return NICHE_PROOF_CONFIG[niche.toLowerCase()] ?? {
    bestTypes: ["counter", "recommendation"],
    emphasis: "Volume and satisfaction are universal trust signals",
  };
}

// ---------------------------------------------------------------------------
// Trust Score
// ---------------------------------------------------------------------------

export function calculateTrustScore(tenantId: string): TrustScore {
  const summary = getReviewSummary(tenantId);
  const certs: Certification[] = [];
  for (const c of Array.from(certificationStore.values())) {
    if (c.tenantId === tenantId) certs.push(c);
  }
  const tenantEvents = socialProofEvents.filter((e) => e.tenantId === tenantId);
  const meta = tenantMeta.get(tenantId);

  const reviewScore = Math.min(25, (summary.avgRating / 5) * 15 + Math.min(10, summary.totalCount * 0.5));
  const guaranteePresent = true;
  const guaranteeScore = guaranteePresent ? 15 : 0;
  const certificationScore = Math.min(20, certs.length * 5);
  const socialProofScore = Math.min(15, tenantEvents.length * 0.5);
  const responseTimeScore = meta ? Math.min(15, Math.max(0, 15 - meta.avgResponseTimeHours * 2)) : 5;
  const yearsInBusinessScore = meta ? Math.min(10, meta.yearsInBusiness * 2) : 0;

  const total = Math.min(
    100,
    Math.round(reviewScore + guaranteeScore + certificationScore + socialProofScore + responseTimeScore + yearsInBusinessScore),
  );

  return {
    tenantId,
    score: total,
    components: {
      reviewScore: Math.round(reviewScore * 100) / 100,
      guaranteeScore,
      certificationScore,
      socialProofScore: Math.round(socialProofScore * 100) / 100,
      responseTimeScore: Math.round(responseTimeScore * 100) / 100,
      yearsInBusinessScore,
    },
    calculatedAt: new Date().toISOString(),
  };
}

export function getTrustRecommendations(tenantId: string): TrustRecommendation[] {
  const score = calculateTrustScore(tenantId);
  const recommendations: TrustRecommendation[] = [];

  if (score.components.reviewScore < 15) {
    recommendations.push({
      priority: "high",
      category: "reviews",
      recommendation: "Collect more customer reviews. Aim for at least 20 verified reviews with a 4.5+ average rating.",
      expectedImpact: 15 - score.components.reviewScore,
    });
  }

  if (score.components.certificationScore < 10) {
    recommendations.push({
      priority: "medium",
      category: "certifications",
      recommendation: "Add industry certifications, BBB accreditation, or insurance verification to build credibility.",
      expectedImpact: 10 - score.components.certificationScore,
    });
  }

  if (score.components.socialProofScore < 10) {
    recommendations.push({
      priority: "medium",
      category: "social-proof",
      recommendation: "Increase social proof by logging customer interactions and displaying recent activity on your pages.",
      expectedImpact: 10 - score.components.socialProofScore,
    });
  }

  if (score.components.responseTimeScore < 10) {
    recommendations.push({
      priority: "high",
      category: "response-time",
      recommendation: "Reduce average response time to under 2 hours. Fast responses significantly increase conversion.",
      expectedImpact: 10 - score.components.responseTimeScore,
    });
  }

  if (score.components.yearsInBusinessScore < 5) {
    recommendations.push({
      priority: "low",
      category: "business-history",
      recommendation: "Highlight your team experience and company history to compensate for fewer years in business.",
      expectedImpact: 5,
    });
  }

  return recommendations.sort((a, b) => b.expectedImpact - a.expectedImpact);
}

// ---------------------------------------------------------------------------
// Certification & Badge System
// ---------------------------------------------------------------------------

export async function addCertification(
  tenantId: string,
  cert: Omit<Certification, "id" | "tenantId">,
): Promise<Certification> {
  const entry: Certification = {
    id: generateCertId(),
    tenantId,
    type: cert.type,
    name: cert.name,
    issuedBy: cert.issuedBy,
    validUntil: cert.validUntil,
    verificationUrl: cert.verificationUrl,
  };

  certificationStore.set(entry.id, entry);

  if (getPool()) {
    await queryPostgres(
      `INSERT INTO trust_certifications (id, tenant_id, type, name, issued_by, valid_until, verification_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO NOTHING`,
      [entry.id, tenantId, entry.type, entry.name, entry.issuedBy, entry.validUntil, entry.verificationUrl],
    );
  }

  return entry;
}

export function generateTrustBadges(tenantId: string): TrustBadge[] {
  const certs: Certification[] = [];
  for (const c of Array.from(certificationStore.values())) {
    if (c.tenantId === tenantId) certs.push(c);
  }

  const summary = getReviewSummary(tenantId);
  const badges: TrustBadge[] = [];

  if (summary.totalCount >= 5 && summary.avgRating >= 4) {
    badges.push({
      type: "top-rated",
      label: "Top Rated",
      html: `<div role="img" aria-label="Top Rated: ${summary.avgRating} stars from ${summary.totalCount} reviews" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#fef3c7;border:1px solid #f59e0b;border-radius:20px;font-size:12px;font-weight:700;color:#92400e">&#9733; Top Rated (${summary.avgRating})</div>`,
    });
  }

  if (summary.totalCount >= 10) {
    badges.push({
      type: "verified-reviews",
      label: `${summary.totalCount}+ Verified Reviews`,
      html: `<div role="img" aria-label="${summary.totalCount} verified reviews" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#ecfdf5;border:1px solid #10b981;border-radius:20px;font-size:12px;font-weight:700;color:#065f46">&#9989; ${summary.totalCount}+ Reviews</div>`,
    });
  }

  for (const cert of certs) {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      bbb: { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
      insurance: { bg: "#f0fdf4", border: "#22c55e", text: "#166534" },
      license: { bg: "#faf5ff", border: "#a855f7", text: "#6b21a8" },
      industry: { bg: "#fff7ed", border: "#f97316", text: "#9a3412" },
      other: { bg: "#f8fafc", border: "#94a3b8", text: "#475569" },
    };
    const c = colors[cert.type] ?? colors.other;

    badges.push({
      type: cert.type,
      label: cert.name,
      html: `<div role="img" aria-label="${cert.name} certified by ${cert.issuedBy}" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:${c.bg};border:1px solid ${c.border};border-radius:20px;font-size:12px;font-weight:700;color:${c.text}">&#128737; ${cert.name}</div>`,
    });
  }

  return badges;
}

const NICHE_BADGE_CONFIG: Record<string, { priorityBadges: string[]; reason: string }> = {
  construction: { priorityBadges: ["license", "insurance", "bbb"], reason: "Licensing and insurance are top concerns for homeowners" },
  legal: { priorityBadges: ["license", "industry", "top-rated"], reason: "Bar membership and specialization badges drive confidence" },
  dental: { priorityBadges: ["license", "top-rated", "verified-reviews"], reason: "Patients value verified credentials and peer reviews" },
  hvac: { priorityBadges: ["license", "insurance", "industry"], reason: "Homeowners need assurance of licensed, insured technicians" },
  roofing: { priorityBadges: ["insurance", "license", "bbb"], reason: "Insurance and licensing are non-negotiable for roof work" },
};

export function getTrustBadgeConfig(niche: string): { priorityBadges: string[]; reason: string } {
  return NICHE_BADGE_CONFIG[niche.toLowerCase()] ?? {
    priorityBadges: ["top-rated", "verified-reviews", "license"],
    reason: "Ratings and credentials are universal trust signals",
  };
}

// ---------------------------------------------------------------------------
// Tenant metadata helpers
// ---------------------------------------------------------------------------

export function setTenantMeta(tenantId: string, meta: { yearsInBusiness: number; avgResponseTimeHours: number }): void {
  tenantMeta.set(tenantId, meta);
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function _resetStores(): void {
  reviewStore.clear();
  certificationStore.clear();
  socialProofEvents.length = 0;
  tenantMeta.clear();
  reviewIdCounter = 0;
  certIdCounter = 0;
  proofEventIdCounter = 0;
}
