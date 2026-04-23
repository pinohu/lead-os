import { type IndustryCategory } from "./niche-templates.ts";
import { assessDigitalPresenceGap } from "./discovery-scout.ts";
import { SLUG_PATTERN, LIMITS } from "./constants.ts";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface GMBPhoto {
  url: string;
  width?: number;
  height?: number;
  category?: "cover" | "interior" | "exterior" | "product" | "team" | "logo" | "other";
}

export interface GMBReview {
  /** First name only or initials for privacy. */
  author?: string;
  /** Star rating 1-5. */
  rating: number;
  text?: string;
  /** Human-readable relative time, e.g. "2 months ago". */
  relativeTime?: string;
  /** ISO 8601 date string if available. */
  publishedAt?: string;
}

export interface BusinessHours {
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  /** 24-hour time string, e.g. "09:00". */
  open: string;
  /** 24-hour time string, e.g. "17:00". */
  close: string;
  closed?: boolean;
}

export interface GMBAttribute {
  /** Machine-readable key, e.g. "wheelchair_accessible". */
  key: string;
  /** Human-readable label, e.g. "Wheelchair Accessible". */
  label: string;
  value: boolean;
}

export interface GMBQandA {
  question: string;
  answer?: string;
}

export interface GMBListingData {
  placeId?: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  website?: string;
  /** Google category string, e.g. "Plumber", "Hair Salon". */
  primaryCategory?: string;
  additionalCategories?: string[];
  description?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: GMBReview[];
  photos?: GMBPhoto[];
  hours?: BusinessHours[];
  attributes?: GMBAttribute[];
  qAndA?: GMBQandA[];
  geo?: { lat: number; lng: number };
  serviceArea?: string;
}

export interface IngestedBusinessProfile {
  slug: string;
  businessName: string;
  placeId?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  website?: string;
  niche: string;
  industry: IndustryCategory;
  /** Original listing description or generated fallback. */
  description: string;
  primaryCategory: string;
  additionalCategories: string[];
  rating?: number;
  reviewCount?: number;
  /** Up to 5 reviews filtered for quality, with privacy sanitization applied. */
  topReviews: GMBReview[];
  photos: GMBPhoto[];
  hours: BusinessHours[];
  attributes: GMBAttribute[];
  /** Q&A from the listing, or generated category-specific FAQs as fallback. */
  faq: GMBQandA[];
  geo?: { lat: number; lng: number };
  serviceArea?: string;
  /** 0-100 score based on how many listing fields are populated. */
  listingCompleteness: number;
  /** 0-100 score based on rating, volume, and review text depth. */
  reviewQuality: number;
  /** 0-100 score from discovery-scout indicating digital presence gap. */
  digitalPresenceGap: number;
  ingestedAt: string;
}

// ---------------------------------------------------------------------------
// Internal category map
// ---------------------------------------------------------------------------

const GMB_CATEGORY_MAP: Record<string, { niche: string; industry: IndustryCategory }> = {
  // Construction / Trades
  "plumber": { niche: "plumbing", industry: "construction" },
  "electrician": { niche: "electrical", industry: "construction" },
  "hvac contractor": { niche: "hvac", industry: "construction" },
  "roofing contractor": { niche: "roofing", industry: "construction" },
  "general contractor": { niche: "general-contracting", industry: "construction" },
  "painter": { niche: "painting", industry: "construction" },

  // Service
  "landscaper": { niche: "landscaping", industry: "service" },
  "landscaping company": { niche: "landscaping", industry: "service" },
  "lawn care service": { niche: "lawn-care", industry: "service" },
  "cleaning service": { niche: "cleaning", industry: "service" },
  "house cleaning service": { niche: "cleaning", industry: "service" },
  "carpet cleaning service": { niche: "carpet-cleaning", industry: "service" },
  "pest control service": { niche: "pest-control", industry: "service" },
  "locksmith": { niche: "locksmith", industry: "service" },
  "moving company": { niche: "moving", industry: "service" },
  "auto repair shop": { niche: "auto-repair", industry: "service" },
  "car wash": { niche: "car-wash", industry: "service" },
  "towing service": { niche: "towing", industry: "service" },
  "restaurant": { niche: "restaurant", industry: "service" },
  "cafe": { niche: "cafe", industry: "service" },
  "bakery": { niche: "bakery", industry: "service" },
  "catering service": { niche: "catering", industry: "service" },

  // Health
  "dentist": { niche: "dental", industry: "health" },
  "dental clinic": { niche: "dental", industry: "health" },
  "orthodontist": { niche: "orthodontics", industry: "health" },
  "chiropractor": { niche: "chiropractic", industry: "health" },
  "physical therapist": { niche: "physical-therapy", industry: "health" },
  "medical spa": { niche: "med-spa", industry: "health" },
  "spa": { niche: "spa", industry: "health" },
  "veterinarian": { niche: "veterinary", industry: "health" },
  "optometrist": { niche: "optometry", industry: "health" },
  "dermatologist": { niche: "dermatology", industry: "health" },
  "psychologist": { niche: "mental-health", industry: "health" },
  "counselor": { niche: "counseling", industry: "health" },
  "gym": { niche: "fitness", industry: "health" },
  "personal trainer": { niche: "personal-training", industry: "health" },
  "yoga studio": { niche: "yoga", industry: "health" },

  // Legal
  "lawyer": { niche: "legal", industry: "legal" },
  "attorney": { niche: "legal", industry: "legal" },
  "law firm": { niche: "legal", industry: "legal" },
  "immigration lawyer": { niche: "immigration-law", industry: "legal" },
  "personal injury attorney": { niche: "personal-injury", industry: "legal" },
  "criminal justice attorney": { niche: "criminal-defense", industry: "legal" },
  "divorce lawyer": { niche: "family-law", industry: "legal" },
  "family law attorney": { niche: "family-law", industry: "legal" },
  "real estate attorney": { niche: "real-estate-law", industry: "legal" },
  "bankruptcy attorney": { niche: "bankruptcy-law", industry: "legal" },
  "estate planning attorney": { niche: "estate-planning", industry: "legal" },
  "notary public": { niche: "notary", industry: "legal" },

  // Real estate
  "real estate agency": { niche: "real-estate", industry: "real-estate" },
  "real estate agent": { niche: "real-estate", industry: "real-estate" },
  "property management company": { niche: "property-management", industry: "real-estate" },
  "mortgage broker": { niche: "mortgage", industry: "real-estate" },

  // Education
  "school": { niche: "education", industry: "education" },
  "tutoring service": { niche: "tutoring", industry: "education" },
  "driving school": { niche: "driving-school", industry: "education" },
  "dance school": { niche: "dance-school", industry: "education" },
  "martial arts school": { niche: "martial-arts", industry: "education" },

  // Finance
  "accountant": { niche: "accounting", industry: "finance" },
  "tax preparation service": { niche: "tax-preparation", industry: "finance" },
  "insurance agency": { niche: "insurance", industry: "finance" },
  "financial planner": { niche: "financial-planning", industry: "finance" },

  // Creative / Beauty
  "photographer": { niche: "photography", industry: "creative" },
  "hair salon": { niche: "hair-salon", industry: "creative" },
  "barber shop": { niche: "barber", industry: "creative" },
  "beauty salon": { niche: "beauty", industry: "creative" },
  "nail salon": { niche: "nail-salon", industry: "creative" },
  "tattoo shop": { niche: "tattoo", industry: "creative" },
  "florist": { niche: "florist", industry: "creative" },
  "wedding planner": { niche: "wedding-planning", industry: "creative" },
};

const FALLBACK_NICHE: { niche: string; industry: IndustryCategory } = {
  niche: "general",
  industry: "general",
};

// ---------------------------------------------------------------------------
// Internal FAQ templates
// ---------------------------------------------------------------------------

/**
 * Per-industry FAQ question templates. Each entry contains a question that
 * is populated with a generic answer by `generateFallbackFAQ`.
 */
const FAQ_TEMPLATES: Record<IndustryCategory, Array<{ question: string }>> = {
  service: [
    { question: "What areas do you serve?" },
    { question: "Do you provide free estimates?" },
    { question: "Are you licensed and insured?" },
    { question: "What are your hours of operation?" },
    { question: "Do you offer emergency services?" },
  ],
  construction: [
    { question: "Are you licensed and bonded?" },
    { question: "Do you provide written estimates?" },
    { question: "What is your warranty policy?" },
    { question: "How long will the project take?" },
    { question: "Do you handle permits and inspections?" },
  ],
  health: [
    { question: "Do you accept insurance?" },
    { question: "How do I schedule an appointment?" },
    { question: "What should I bring to my first visit?" },
    { question: "Do you offer telehealth appointments?" },
    { question: "What are your office hours?" },
  ],
  legal: [
    { question: "Do you offer free consultations?" },
    { question: "What areas of law do you practice?" },
    { question: "How are your fees structured?" },
    { question: "What should I bring to my first meeting?" },
    { question: "How long does the process typically take?" },
  ],
  "real-estate": [
    { question: "What areas do you specialize in?" },
    { question: "How do I get started buying or selling?" },
    { question: "What are your fees or commission rates?" },
    { question: "How long does a typical transaction take?" },
    { question: "Do you work with first-time buyers?" },
  ],
  education: [
    { question: "What age groups do you work with?" },
    { question: "How do I enroll?" },
    { question: "What is the typical class size?" },
    { question: "Do you offer trial sessions?" },
    { question: "What are your hours and schedule?" },
  ],
  finance: [
    { question: "What services do you offer?" },
    { question: "How do your fees work?" },
    { question: "Are you a fiduciary?" },
    { question: "How do I get started?" },
    { question: "What documents do I need for my first appointment?" },
  ],
  creative: [
    { question: "Do you offer consultations before booking?" },
    { question: "What styles or techniques do you specialize in?" },
    { question: "How far in advance should I book?" },
    { question: "What is your pricing?" },
    { question: "Do you travel for bookings or events?" },
  ],
  tech: [
    { question: "What technologies and platforms do you work with?" },
    { question: "Do you offer ongoing support or maintenance?" },
    { question: "How do you price your services?" },
    { question: "What is your typical project timeline?" },
    { question: "Do you sign NDAs or confidentiality agreements?" },
  ],
  franchise: [
    { question: "What franchise opportunities are available?" },
    { question: "What is the initial investment range?" },
    { question: "What support do you provide to franchisees?" },
    { question: "How do I qualify to become a franchisee?" },
    { question: "What territories are currently available?" },
  ],
  staffing: [
    { question: "What industries do you staff for?" },
    { question: "Do you offer temporary and permanent placements?" },
    { question: "How quickly can you fill an open position?" },
    { question: "What is your candidate screening process?" },
    { question: "How are your fees structured?" },
  ],
  faith: [
    { question: "When are your services or gatherings held?" },
    { question: "How do I get involved with the community?" },
    { question: "Do you offer programs for children or youth?" },
    { question: "Is parking available at your location?" },
    { question: "How can I contact the leadership team?" },
  ],
  general: [
    { question: "What are your hours?" },
    { question: "How can I contact you?" },
    { question: "What services do you offer?" },
    { question: "Do you serve my area?" },
    { question: "Do you offer free consultations or estimates?" },
  ],
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Lowercases and trims a Google category string for consistent map lookup.
 */
function normalizeCategory(category: string): string {
  return category.toLowerCase().trim();
}

/**
 * Attempts an exact match then a substring match against GMB_CATEGORY_MAP.
 * Returns undefined when neither succeeds.
 */
function lookupCategory(
  normalized: string,
): { niche: string; industry: IndustryCategory } | undefined {
  if (GMB_CATEGORY_MAP[normalized]) {
    return GMB_CATEGORY_MAP[normalized];
  }

  for (const key of Object.keys(GMB_CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return GMB_CATEGORY_MAP[key];
    }
  }

  return undefined;
}

/**
 * Sanitizes a review author to first-name-only.
 * Names of 2 characters or fewer (initials) are kept as-is.
 */
function sanitizeAuthorName(author: string | undefined): string | undefined {
  if (!author) return undefined;
  const trimmed = author.trim();
  if (trimmed.length <= 2) return trimmed;
  return trimmed.split(/\s+/)[0];
}

/**
 * Truncates review text to a maximum of 280 characters, appending "…" when cut.
 */
function truncateReviewText(text: string | undefined): string | undefined {
  if (!text) return undefined;
  if (text.length <= 280) return text;
  return `${text.slice(0, 279)}…`;
}

/**
 * Converts a relative-time string to a numeric recency weight for sorting.
 * Higher values indicate more recent activity.
 */
function recencyWeight(relativeTime: string | undefined): number {
  if (!relativeTime) return 0;
  const lower = relativeTime.toLowerCase();
  if (lower.includes("day") || lower.includes("week")) return 4;
  if (lower.includes("month")) return 3;
  if (lower.includes("year")) return 2;
  return 1;
}

/**
 * Constructs a minimal description when the listing has none of its own.
 */
function buildFallbackDescription(listing: GMBListingData, niche: string): string {
  const city = listing.city ?? "";
  const state = listing.state ?? "";
  const location = [city, state].filter(Boolean).join(", ");
  const locationPart = location ? ` in ${location}` : "";
  return `${listing.name} is a professional ${niche} business${locationPart}. Contact us to learn more about our services.`;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Creates a URL-safe slug from a business name and optional city.
 *
 * The result is lowercased, non-alphanumeric characters are replaced with
 * hyphens, consecutive hyphens are collapsed, and leading/trailing hyphens
 * are removed. The slug is capped at `LIMITS.MAX_SLUG_LENGTH` characters and
 * guaranteed to satisfy `SLUG_PATTERN`.
 *
 * @param name - Business name (required).
 * @param city - Optional city appended after a hyphen.
 * @returns A slug satisfying SLUG_PATTERN, at most MAX_SLUG_LENGTH chars.
 */
export function generateBusinessSlug(name: string, city?: string): string {
  const combined = city ? `${name} ${city}` : name;

  let slug = combined
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length > LIMITS.MAX_SLUG_LENGTH) {
    slug = slug.slice(0, LIMITS.MAX_SLUG_LENGTH).replace(/-+$/, "");
  }

  // SLUG_PATTERN requires at least 2 characters (start and end alnum)
  if (slug.length < 2) {
    slug = slug.padEnd(2, "0");
  }

  if (!SLUG_PATTERN.test(slug)) {
    slug = `biz-${slug}`.slice(0, LIMITS.MAX_SLUG_LENGTH);
  }

  return slug;
}

/**
 * Maps Google Business Profile category strings to our internal niche and
 * IndustryCategory system.
 *
 * The primary category is evaluated first; additional categories serve as
 * fallback. Each candidate undergoes exact match then substring match against
 * `GMB_CATEGORY_MAP`. When nothing matches, returns the general fallback.
 *
 * @param primaryCategory      - Main Google category string.
 * @param additionalCategories - Secondary Google category strings.
 * @returns Resolved niche slug and IndustryCategory.
 */
export function detectNicheFromCategories(
  primaryCategory?: string,
  additionalCategories?: string[],
): { niche: string; industry: IndustryCategory } {
  if (primaryCategory) {
    const match = lookupCategory(normalizeCategory(primaryCategory));
    if (match) return match;
  }

  for (const cat of additionalCategories ?? []) {
    const match = lookupCategory(normalizeCategory(cat));
    if (match) return match;
  }

  return FALLBACK_NICHE;
}

/**
 * Scores listing completeness on a 0-100 scale based on field population.
 *
 * Field weights:
 * - name (10), address (10), phone (10), description (10), categories (10),
 *   hours (10), photos (15), reviews (15), attributes (5), website (5)
 *
 * @param listing - Raw GMB listing data.
 * @returns Integer in [0, 100].
 */
export function computeListingCompleteness(listing: GMBListingData): number {
  let score = 0;

  if (listing.name?.trim()) score += 10;
  if (listing.address?.trim()) score += 10;
  if (listing.phone?.trim()) score += 10;
  if (listing.description?.trim()) score += 10;

  const hasCategories =
    Boolean(listing.primaryCategory?.trim()) ||
    (listing.additionalCategories?.length ?? 0) > 0;
  if (hasCategories) score += 10;

  if ((listing.hours?.length ?? 0) > 0) score += 10;

  const photoCount = listing.photos?.length ?? 0;
  if (photoCount >= 3) {
    score += 15;
  } else if (photoCount > 0) {
    score += Math.round((photoCount / 3) * 15);
  }

  const reviewCount = listing.reviewCount ?? listing.reviews?.length ?? 0;
  if (reviewCount >= 10) {
    score += 15;
  } else if (reviewCount > 0) {
    score += Math.round((reviewCount / 10) * 15);
  }

  if ((listing.attributes?.length ?? 0) > 0) score += 5;
  if (listing.website?.trim()) score += 5;

  return Math.min(100, score);
}

/**
 * Scores the quality of a business's reviews on a 0-100 scale.
 *
 * Scoring breakdown:
 * - Average rating (40%): linear scale across the 1-5 star range.
 * - Review volume (30%): logarithmic scale, saturates around 50 reviews.
 * - Text depth (30%): proportion of reviews with text longer than 40 characters.
 *
 * @param reviews     - Individual review objects.
 * @param rating      - Aggregate star rating (1-5).
 * @param reviewCount - Total published review count.
 * @returns Integer in [0, 100].
 */
export function computeReviewQuality(
  reviews?: GMBReview[],
  rating?: number,
  reviewCount?: number,
): number {
  // Rating component — 40 points maximum
  let ratingScore = 0;
  if (rating !== undefined) {
    const clamped = Math.max(1, Math.min(5, rating));
    ratingScore = ((clamped - 1) / 4) * 40;
  }

  // Volume component — 30 points maximum, log scale saturating at ~50 reviews
  const count = reviewCount ?? reviews?.length ?? 0;
  const volumeScore =
    count > 0 ? Math.min(30, (Math.log(count + 1) / Math.log(51)) * 30) : 0;

  // Text depth component — 30 points maximum
  let textScore = 0;
  if (reviews && reviews.length > 0) {
    const withSubstantiveText = reviews.filter((r) => (r.text?.length ?? 0) > 40).length;
    textScore = (withSubstantiveText / reviews.length) * 30;
  }

  return Math.min(100, Math.round(ratingScore + volumeScore + textScore));
}

/**
 * Returns the top N reviews sorted by quality signals.
 *
 * Sort priority (descending):
 * 1. Has any text at all
 * 2. Higher star rating
 * 3. Longer review text
 * 4. More recent (heuristic from relativeTime)
 *
 * Privacy: author names are stripped to first name only; review text is
 * truncated to 280 characters.
 *
 * @param reviews  - Raw review array.
 * @param maxCount - Maximum number of reviews to return (default 5).
 */
export function selectTopReviews(reviews: GMBReview[], maxCount = 5): GMBReview[] {
  return [...reviews]
    .sort((a, b) => {
      const aHasText = (a.text?.length ?? 0) > 0 ? 1 : 0;
      const bHasText = (b.text?.length ?? 0) > 0 ? 1 : 0;
      if (bHasText !== aHasText) return bHasText - aHasText;

      if (b.rating !== a.rating) return b.rating - a.rating;

      const aLen = a.text?.length ?? 0;
      const bLen = b.text?.length ?? 0;
      if (bLen !== aLen) return bLen - aLen;

      return recencyWeight(b.relativeTime) - recencyWeight(a.relativeTime);
    })
    .slice(0, maxCount)
    .map((review) => ({
      ...review,
      author: sanitizeAuthorName(review.author),
      text: truncateReviewText(review.text),
    }));
}

/**
 * Generates 3-5 category-appropriate FAQ entries when no Q&A data exists on
 * the listing. Each question is paired with a generic contact prompt that
 * includes the business name.
 *
 * @param niche        - Resolved niche slug (e.g. "plumbing").
 * @param industry     - Resolved IndustryCategory for template selection.
 * @param businessName - Business name used to personalize answers.
 * @returns Array of GMBQandA objects with questions and placeholder answers.
 */
export function generateFallbackFAQ(
  niche: string,
  industry: IndustryCategory,
  businessName: string,
): GMBQandA[] {
  void niche; // niche reserved for future template granularity
  const templates = FAQ_TEMPLATES[industry] ?? FAQ_TEMPLATES.general;

  return templates.slice(0, 5).map(({ question }) => ({
    question,
    answer: `Contact ${businessName} directly for more information.`,
  }));
}

/**
 * Ingests a raw Google Business Profile listing and produces a fully enriched
 * `IngestedBusinessProfile` ready for the landing page generator.
 *
 * Processing steps:
 * 1. Validates that name and address are present.
 * 2. Detects niche and industry from Google categories.
 * 3. Generates a URL-safe slug from business name + city.
 * 4. Computes listing completeness, review quality, and digital presence gap.
 * 5. Selects top reviews with privacy sanitization applied.
 * 6. Falls back to generated FAQ when no Q&A data is provided.
 * 7. Generates a description fallback when none exists on the listing.
 *
 * This function is pure and has no side effects.
 *
 * @param listing - Raw data from a Google Business Profile API response or scrape.
 * @throws {Error} When `listing.name` or `listing.address` is missing or blank.
 */
export function ingestGMBListing(listing: GMBListingData): IngestedBusinessProfile {
  const name = listing.name?.trim();
  const address = listing.address?.trim();

  if (!name) {
    throw new Error("GMB listing must have a non-empty name");
  }
  if (!address) {
    throw new Error("GMB listing must have a non-empty address");
  }

  const { niche, industry } = detectNicheFromCategories(
    listing.primaryCategory,
    listing.additionalCategories,
  );

  const slug = generateBusinessSlug(name, listing.city);

  const listingCompleteness = computeListingCompleteness(listing);
  const reviewQuality = computeReviewQuality(
    listing.reviews,
    listing.rating,
    listing.reviewCount,
  );

  const hasWebsite = Boolean(listing.website?.trim());
  // websiteQuality is unknown without a scrape; use 50 as a neutral mid-value
  // so the gap score is driven primarily by the review signal when no scrape
  // data is available.
  const websiteQuality = hasWebsite ? 50 : 0;
  const digitalPresenceGap = assessDigitalPresenceGap(
    hasWebsite,
    websiteQuality,
    reviewQuality,
  );

  const topReviews = selectTopReviews(listing.reviews ?? []);

  const faq =
    listing.qAndA && listing.qAndA.length > 0
      ? listing.qAndA
      : generateFallbackFAQ(niche, industry, name);

  const description =
    listing.description?.trim() || buildFallbackDescription(listing, niche);

  return {
    slug,
    businessName: name,
    placeId: listing.placeId,
    address,
    city: listing.city?.trim() ?? "",
    state: listing.state?.trim() ?? "",
    postalCode: listing.postalCode?.trim() ?? "",
    country: listing.country?.trim() ?? "",
    phone: listing.phone?.trim() || undefined,
    website: listing.website?.trim() || undefined,
    niche,
    industry,
    description,
    primaryCategory: listing.primaryCategory?.trim() ?? "",
    additionalCategories: listing.additionalCategories ?? [],
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    topReviews,
    photos: listing.photos ?? [],
    hours: listing.hours ?? [],
    attributes: listing.attributes ?? [],
    faq,
    geo: listing.geo,
    serviceArea: listing.serviceArea,
    listingCompleteness,
    reviewQuality,
    digitalPresenceGap,
    ingestedAt: new Date().toISOString(),
  };
}
