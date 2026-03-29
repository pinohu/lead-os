// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketingArtifact {
  id: string;
  tenantId: string;
  sourceType: "flyer" | "mailer" | "billboard" | "business-card" | "ad" | "brochure" | "other";
  extractedText: string;
  headline: string | undefined;
  subheadline: string | undefined;
  offer: OfferExtraction | undefined;
  urgencySignals: string[];
  trustSignals: string[];
  ctaLabels: string[];
  contactInfo: ContactExtraction;
  colors: string[];
  layoutType: "single-column" | "two-column" | "grid" | "hero-cta" | "unknown";
  audience: AudienceSignals;
  geoContext: GeoContext | undefined;
  confidence: number;
  createdAt: string;
}

export interface OfferExtraction {
  primaryOffer: string;
  pricing: string[];
  discounts: string[];
  guarantees: string[];
  bonuses: string[];
}

export interface ContactExtraction {
  phones: string[];
  emails: string[];
  websites: string[];
  addresses: string[];
  socialHandles: string[];
}

export interface AudienceSignals {
  targetIndustry: string | undefined;
  targetRole: string | undefined;
  painPoints: string[];
  keywords: string[];
}

export interface GeoContext {
  city: string | undefined;
  state: string | undefined;
  zipCode: string | undefined;
  region: string | undefined;
}

// ---------------------------------------------------------------------------
// Headline extraction
// ---------------------------------------------------------------------------

export function extractHeadline(text: string): { headline: string | undefined; subheadline: string | undefined } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const headingPattern = /^[A-Z0-9\s!.,\-–—:]{6,80}$/;
  const allCapsPattern = /^[A-Z0-9\s!.,\-–—:?]{4,}$/;

  const candidates: string[] = [];
  for (const line of lines) {
    if (line.length < 4 || line.length > 100) continue;
    if (headingPattern.test(line) || allCapsPattern.test(line)) {
      candidates.push(line);
    }
  }

  if (candidates.length === 0 && lines.length > 0) {
    candidates.push(lines[0]);
  }

  const headline = candidates[0];
  const subheadline = candidates[1] ?? lines.find((l) => l !== headline && l.length > 10 && l.length < 120);

  return { headline, subheadline };
}

// ---------------------------------------------------------------------------
// Offer extraction
// ---------------------------------------------------------------------------

const PRICING_PATTERN = /\$[\d,]+(?:\.\d{2})?(?:\s*\/\s*(?:mo(?:nth)?|yr|year|week|day|hr|hour))?|\d+\s*%\s*(?:off|discount|savings?)|free\s+\w+|bogo/gi;
const DISCOUNT_PATTERN = /\b(?:save|off|discount|special(?:\s+price)?|reduced|cut(?:\s+price)?|deal|bargain|\d+\s*%\s*off)\b[^.!\n]{0,60}/gi;
const GUARANTEE_PATTERN = /\b(?:money[\s-]back|satisfaction\s+guaranteed?|guarantee[ds]?|warranty|warrantied?|risk[\s-]free|no[\s-]questions[\s-]asked|100\s*%\s+satisfaction)\b[^.!\n]{0,60}/gi;
const BONUS_PATTERN = /\b(?:free\s+\w+(?:\s+\w+)?(?:\s+with)?|includes?|bonus(?:es)?|get\s+a\s+free|complimentary|gift)\b[^.!\n]{0,60}/gi;

export function extractOffer(text: string): OfferExtraction {
  const pricing = Array.from(new Set(
    (text.match(PRICING_PATTERN) ?? []).map((m) => m.trim()).filter((m) => m.length > 0),
  )).slice(0, 10);

  const discounts = Array.from(new Set(
    (text.match(DISCOUNT_PATTERN) ?? []).map((m) => m.trim()).filter((m) => m.length > 3),
  )).slice(0, 6);

  const guarantees = Array.from(new Set(
    (text.match(GUARANTEE_PATTERN) ?? []).map((m) => m.trim()).filter((m) => m.length > 3),
  )).slice(0, 6);

  const bonuses = Array.from(new Set(
    (text.match(BONUS_PATTERN) ?? []).map((m) => m.trim()).filter((m) => m.length > 3),
  )).slice(0, 6);

  const primaryOffer = discounts[0] ?? pricing[0] ?? bonuses[0] ?? "";

  return { primaryOffer, pricing, discounts, guarantees, bonuses };
}

// ---------------------------------------------------------------------------
// Urgency signal extraction
// ---------------------------------------------------------------------------

const URGENCY_PHRASES = [
  /limited[\s-]time\b[^.!\n]{0,40}/gi,
  /act\s+now\b[^.!\n]{0,40}/gi,
  /expires?\b[^.!\n]{0,40}/gi,
  /today\s+only\b[^.!\n]{0,40}/gi,
  /while\s+supplies?\s+last\b[^.!\n]{0,40}/gi,
  /hurry\b[^.!\n]{0,40}/gi,
  /deadline\b[^.!\n]{0,40}/gi,
  /don'?t\s+wait\b[^.!\n]{0,40}/gi,
  /(?:valid|offer)\s+(?:through|until|expires?)\s+[A-Za-z]+\s+\d{1,2}(?:,\s*\d{4})?\b/gi,
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s*\d{4})?\b/gi,
  /schedule\b[^.!\n]{0,30}today\b/gi,
  /call\s+today\b[^.!\n]{0,30}/gi,
];

export function extractUrgencySignals(text: string): string[] {
  const found = new Set<string>();

  for (const pattern of URGENCY_PHRASES) {
    for (const match of text.matchAll(pattern)) {
      const cleaned = match[0].trim();
      if (cleaned.length > 3) found.add(cleaned);
    }
  }

  return Array.from(found).slice(0, 10);
}

// ---------------------------------------------------------------------------
// Trust signal extraction
// ---------------------------------------------------------------------------

const TRUST_PHRASES = [
  /\d+\+?\s+years?\s+(?:of\s+)?(?:experience|in\s+business|serving)[^.!\n]{0,40}/gi,
  /licensed(?:[,\s]+(?:bonded|insured|certified))*[^.!\n]{0,40}/gi,
  /bonded(?:\s+(?:and|&)\s+insured)?[^.!\n]{0,20}/gi,
  /insured[^.!\n]{0,20}/gi,
  /bbb\s+[a-z+]+\s+rated?[^.!\n]{0,30}/gi,
  /\d+(?:[,.]\d+)?\s*(?:\*|stars?)[^.!\n]{0,30}/gi,
  /\d{1,3}(?:,\d{3})*\+?\s+(?:happy\s+)?(?:customers?|clients?|homes?|businesses?|jobs?|projects?)\s+(?:served?|helped?|completed?|satisfied?)?[^.!\n]{0,30}/gi,
  /(?:award|awarded|certified|certification|accredited|accreditation)[^.!\n]{0,40}/gi,
  /100\s*%\s+satisfaction[^.!\n]{0,40}/gi,
  /money[\s-]back\s+guarantee[^.!\n]{0,40}/gi,
  /trusted\s+by\s+(?:over\s+)?\d+[^.!\n]{0,40}/gi,
  /rated\s+#?1\b[^.!\n]{0,40}/gi,
];

export function extractTrustSignals(text: string): string[] {
  const found = new Set<string>();

  for (const pattern of TRUST_PHRASES) {
    for (const match of text.matchAll(pattern)) {
      const cleaned = match[0].trim();
      if (cleaned.length > 3) found.add(cleaned);
    }
  }

  return Array.from(found).slice(0, 10);
}

// ---------------------------------------------------------------------------
// CTA label extraction
// ---------------------------------------------------------------------------

const CTA_PATTERNS = [
  /call\s+now\b[^.!\n]{0,30}/gi,
  /visit\s+(?:us|our\s+\w+)?[^.!\n]{0,30}/gi,
  /(?:schedule|book)\s+(?:your\s+)?(?:an?\s+)?(?:appointment|consultation|estimate|call|service|demo|tour)?[^.!\n]{0,30}/gi,
  /order\s+(?:now|today)[^.!\n]{0,30}/gi,
  /claim\s+(?:your\s+)?(?:free\s+)?[^.!\n]{0,30}/gi,
  /get\s+your\s+(?:free\s+)?[^.!\n]{0,30}/gi,
  /sign\s+up\b[^.!\n]{0,30}/gi,
  /learn\s+more\b[^.!\n]{0,30}/gi,
  /contact\s+us\b[^.!\n]{0,30}/gi,
  /request\s+(?:a\s+)?(?:free\s+)?(?:quote|estimate)[^.!\n]{0,30}/gi,
];

export function extractCtaLabels(text: string): string[] {
  const found = new Set<string>();

  for (const pattern of CTA_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const cleaned = match[0].trim().replace(/\s+/g, " ");
      if (cleaned.length > 3) found.add(cleaned);
    }
  }

  return Array.from(found).slice(0, 10);
}

// ---------------------------------------------------------------------------
// Contact info extraction
// ---------------------------------------------------------------------------

const PHONE_PATTERN = /(?:\+?1[\s.-]?)?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})\b/g;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const URL_PATTERN = /(?:https?:\/\/)?(?:www\.)[a-zA-Z0-9\-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)*/g;
const ADDRESS_PATTERN = /\d{1,5}\s+[A-Z][a-zA-Z0-9\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Wy|Court|Ct|Place|Pl|Suite|Ste)[.,\s]*/g;
const SOCIAL_HANDLE_PATTERN = /@[A-Za-z0-9_]{2,30}\b/g;

export function extractContactInfo(text: string): ContactExtraction {
  const phones = Array.from(new Set((text.match(PHONE_PATTERN) ?? []).map((m) => m.trim()))).slice(0, 5);
  const emails = Array.from(new Set((text.match(EMAIL_PATTERN) ?? []).map((m) => m.trim()))).slice(0, 5);
  const websites = Array.from(new Set((text.match(URL_PATTERN) ?? []).map((m) => m.trim()))).slice(0, 5);
  const addresses = Array.from(new Set((text.match(ADDRESS_PATTERN) ?? []).map((m) => m.trim()))).slice(0, 5);
  const socialHandles = Array.from(new Set((text.match(SOCIAL_HANDLE_PATTERN) ?? []).map((m) => m.trim()))).slice(0, 5);

  return { phones, emails, websites, addresses, socialHandles };
}

// ---------------------------------------------------------------------------
// Audience signal extraction
// ---------------------------------------------------------------------------

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  plumbing: ["plumb", "drain", "pipe", "sewer", "water heater", "faucet", "leak"],
  hvac: ["hvac", "heating", "cooling", "air condition", "furnace", "duct", "heat pump"],
  roofing: ["roof", "shingle", "gutter", "soffit", "fascia", "attic"],
  electrical: ["electrician", "electrical", "wiring", "circuit", "panel", "outlet"],
  landscaping: ["landscap", "lawn", "mowing", "garden", "irrigation", "tree"],
  cleaning: ["clean", "janitor", "maid", "house cleaning", "carpet clean"],
  dental: ["dental", "dentist", "teeth", "orthodon", "braces", "implant"],
  medical: ["medical", "doctor", "clinic", "health", "patient", "physician"],
  legal: ["attorney", "lawyer", "legal", "law firm", "counsel"],
  realestate: ["real estate", "realtor", "property", "home buyer", "seller", "mortgage"],
  construction: ["construct", "contractor", "build", "renovation", "remodel", "foundation"],
  moving: ["moving", "mover", "relocation", "storage", "packing"],
  pest: ["pest", "exterminator", "termite", "rodent", "insect", "bug"],
  auto: ["auto", "car", "vehicle", "mechanic", "tire", "oil change", "transmission"],
};

const ROLE_PATTERNS = [
  /\b(?:homeowner|home\s+owner)s?\b/gi,
  /\b(?:business\s+owner|entrepreneur)s?\b/gi,
  /\b(?:property\s+manager|landlord)s?\b/gi,
  /\b(?:contractor|builder)s?\b/gi,
  /\b(?:manager|director|executive|ceo|president)\b/gi,
];

const PAIN_POINT_PATTERNS = [
  /\b(?:emergency|urgent|immediate|fast|quick|same[\s-]day|24\/7|24\s+hour)\b[^.!\n]{0,40}/gi,
  /\b(?:affordable|budget|fair\s+price|competitive\s+price|low\s+cost)\b[^.!\n]{0,40}/gi,
  /\b(?:reliable|dependable|trusted|professional|licensed|expert)\b[^.!\n]{0,30}/gi,
  /\b(?:broken|damaged|leaking|failing|not\s+working|repair|fix)\b[^.!\n]{0,40}/gi,
];

export function extractAudienceSignals(text: string): AudienceSignals {
  const lower = text.toLowerCase();

  let targetIndustry: string | undefined;
  let bestScore = 0;
  const MIN_INDUSTRY_MATCHES = 2;
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score >= MIN_INDUSTRY_MATCHES && score > bestScore) {
      bestScore = score;
      targetIndustry = industry;
    }
  }

  let targetRole: string | undefined;
  for (const pattern of ROLE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      targetRole = match[0].trim().toLowerCase();
      break;
    }
  }

  const painPoints: string[] = [];
  for (const pattern of PAIN_POINT_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const cleaned = match[0].trim();
      if (cleaned.length > 3 && !painPoints.includes(cleaned)) {
        painPoints.push(cleaned);
      }
    }
  }

  const keywords = targetIndustry
    ? INDUSTRY_KEYWORDS[targetIndustry].filter((kw) => lower.includes(kw)).slice(0, 8)
    : [];

  return {
    targetIndustry: bestScore > 0 ? targetIndustry : undefined,
    targetRole,
    painPoints: painPoints.slice(0, 6),
    keywords,
  };
}

// ---------------------------------------------------------------------------
// Geo context extraction
// ---------------------------------------------------------------------------

const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

const STATE_ABBR_PATTERN = new RegExp(`\\b(${Object.keys(US_STATES).join("|")})\\b`, "g");
const ZIP_PATTERN = /\b(\d{5})(?:-\d{4})?\b/g;
const CITY_STATE_PATTERN = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z]{2})\b/g;

export function extractGeoContext(text: string, hint?: string): GeoContext | undefined {
  const source = hint ? `${text} ${hint}` : text;

  const zipMatch = source.match(ZIP_PATTERN);
  const zipCode = zipMatch?.[0];

  let city: string | undefined;
  let state: string | undefined;

  const cityStateMatch = CITY_STATE_PATTERN.exec(source);
  if (cityStateMatch) {
    city = cityStateMatch[1];
    state = cityStateMatch[2];
  } else {
    const stateMatch = STATE_ABBR_PATTERN.exec(source);
    if (stateMatch) state = stateMatch[1];
  }

  if (!city && hint) {
    const hintParts = hint.split(/[,/]/).map((p) => p.trim());
    city = hintParts[0] || undefined;
    if (!state && hintParts[1]) state = hintParts[1];
  }

  if (!city && !state && !zipCode) return undefined;

  return { city, state, zipCode, region: undefined };
}

// ---------------------------------------------------------------------------
// Color extraction (supplementary — from text tokens only)
// ---------------------------------------------------------------------------

const HEX_COLOR_PATTERN = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

function extractColors(text: string): string[] {
  return Array.from(new Set(
    (text.match(HEX_COLOR_PATTERN) ?? []).map((c) => c.toLowerCase()),
  ));
}

// ---------------------------------------------------------------------------
// Layout type inference
// ---------------------------------------------------------------------------

function inferLayoutType(text: string): MarketingArtifact["layoutType"] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const bulletCount = lines.filter((l) => /^[★•*\-–—►▶]/.test(l.trim())).length;
  const columnSeparatorCount = (text.match(/\|{2,}|\t{2,}/g) ?? []).length;
  const hasHeroCta = /(?:call now|schedule|book|visit)[^!.]{0,30}(?:today|now|free)/i.test(text);

  if (columnSeparatorCount >= 3) return "two-column";
  if (bulletCount >= 6 && lines.length >= 12) return "grid";
  if (hasHeroCta && lines.length < 15) return "hero-cta";
  if (lines.length < 20 && bulletCount < 3) return "single-column";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Confidence scoring
// ---------------------------------------------------------------------------

function computeArtifactConfidence(artifact: Omit<MarketingArtifact, "confidence" | "id" | "createdAt">): number {
  let score = 0;

  if (artifact.headline) score += 10;
  if (artifact.subheadline) score += 5;
  if (artifact.offer?.pricing.length) score += Math.min(artifact.offer.pricing.length * 5, 15);
  if (artifact.offer?.discounts.length) score += Math.min(artifact.offer.discounts.length * 3, 9);
  if (artifact.offer?.guarantees.length) score += Math.min(artifact.offer.guarantees.length * 3, 9);
  if (artifact.urgencySignals.length) score += Math.min(artifact.urgencySignals.length * 4, 12);
  if (artifact.trustSignals.length) score += Math.min(artifact.trustSignals.length * 4, 16);
  if (artifact.ctaLabels.length) score += Math.min(artifact.ctaLabels.length * 3, 9);
  if (artifact.contactInfo.phones.length) score += 5;
  if (artifact.contactInfo.emails.length) score += 3;
  if (artifact.contactInfo.websites.length) score += 3;
  if (artifact.geoContext) score += 5;
  if (artifact.audience.targetIndustry) score += 5;

  return Math.min(Math.round(score), 100);
}

// ---------------------------------------------------------------------------
// Main extraction function
// ---------------------------------------------------------------------------

export function extractMarketingArtifact(input: {
  text: string;
  tenantId: string;
  sourceType: MarketingArtifact["sourceType"];
  geoHint?: string;
}): MarketingArtifact {
  const { text, tenantId, sourceType, geoHint } = input;

  const { headline, subheadline } = extractHeadline(text);
  const offer = extractOffer(text);
  const urgencySignals = extractUrgencySignals(text);
  const trustSignals = extractTrustSignals(text);
  const ctaLabels = extractCtaLabels(text);
  const contactInfo = extractContactInfo(text);
  const colors = extractColors(text);
  const layoutType = inferLayoutType(text);
  const audience = extractAudienceSignals(text);
  const geoContext = extractGeoContext(text, geoHint);

  const partial = {
    tenantId,
    sourceType,
    extractedText: text,
    headline,
    subheadline,
    offer: offer.primaryOffer || offer.pricing.length || offer.discounts.length || offer.guarantees.length || offer.bonuses.length
      ? offer
      : undefined,
    urgencySignals,
    trustSignals,
    ctaLabels,
    contactInfo,
    colors,
    layoutType,
    audience,
    geoContext,
  };

  const confidence = computeArtifactConfidence(partial);

  return {
    id: `artifact_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ...partial,
    confidence,
    createdAt: new Date().toISOString(),
  };
}
