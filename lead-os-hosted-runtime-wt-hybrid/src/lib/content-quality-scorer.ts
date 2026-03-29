import type {
  GeneratedLandingPage,
  LandingPageSection,
} from "./landing-page-generator.ts";
import type { IngestedBusinessProfile } from "./gmb-ingestor.ts";

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type QualityGrade = "excellent" | "good" | "fair" | "poor";

export interface QualityFactor {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

export interface SectionQualityScore {
  sectionType: string;
  score: number;
  grade: QualityGrade;
  factors: QualityFactor[];
}

export interface QualityRecommendation {
  priority: "critical" | "high" | "medium" | "low";
  section: string;
  issue: string;
  suggestion: string;
}

export interface ContentQualityReport {
  slug: string;
  overallScore: number;
  overallGrade: QualityGrade;
  sectionScores: SectionQualityScore[];
  recommendations: QualityRecommendation[];
  dataCompleteness: number;
  reviewQuality: number;
  seoScore: number;
  accessibilityFlags: string[];
  scoredAt: string;
}

// ---------------------------------------------------------------------------
// Grade helpers
// ---------------------------------------------------------------------------

function gradeFromScore(score: number): QualityGrade {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function weightedScore(factors: QualityFactor[]): number {
  const raw = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return clampScore(raw);
}

function buildSectionScore(
  sectionType: string,
  factors: QualityFactor[],
): SectionQualityScore {
  const score = weightedScore(factors);
  return { sectionType, score, grade: gradeFromScore(score), factors };
}

// ---------------------------------------------------------------------------
// Content accessor helpers
// ---------------------------------------------------------------------------

function str(content: Record<string, unknown>, key: string): string {
  const val = content[key];
  return typeof val === "string" ? val : "";
}

function num(content: Record<string, unknown>, key: string): number {
  const val = content[key];
  return typeof val === "number" ? val : 0;
}

function bool(content: Record<string, unknown>, key: string): boolean {
  return Boolean(content[key]);
}

function arr(content: Record<string, unknown>, key: string): unknown[] {
  const val = content[key];
  return Array.isArray(val) ? val : [];
}

// ---------------------------------------------------------------------------
// Section scoring functions
// ---------------------------------------------------------------------------

/**
 * Scores the hero section based on headline length, CTA presence, background
 * image, and rating badge visibility.
 */
export function scoreHeroSection(content: Record<string, unknown>): SectionQualityScore {
  const headline = str(content, "headline");
  const headlineLen = headline.length;

  let headlineScore: number;
  if (headlineLen >= 30 && headlineLen <= 70) {
    headlineScore = 100;
  } else if (headlineLen === 0) {
    headlineScore = 0;
  } else if (headlineLen < 30) {
    headlineScore = (headlineLen / 30) * 80;
  } else {
    headlineScore = Math.max(0, 100 - (headlineLen - 70) * 2);
  }

  const factors: QualityFactor[] = [
    {
      name: "headlineLength",
      score: clampScore(headlineScore),
      weight: 0.3,
      detail: `Headline is ${headlineLen} chars (ideal: 30-70)`,
    },
    {
      name: "hasCta",
      score: bool(content, "ctaText") ? 100 : 0,
      weight: 0.3,
      detail: bool(content, "ctaText") ? "CTA text present" : "Missing CTA text",
    },
    {
      name: "hasBackgroundImage",
      score: bool(content, "backgroundImage") ? 100 : 0,
      weight: 0.2,
      detail: bool(content, "backgroundImage") ? "Background image set" : "No background image",
    },
    {
      name: "hasRatingBadge",
      score: num(content, "rating") > 0 ? 100 : 0,
      weight: 0.2,
      detail: num(content, "rating") > 0 ? "Rating badge visible" : "No rating badge",
    },
  ];

  return buildSectionScore("hero", factors);
}

/**
 * Scores the trust bar section based on badge count, rating presence, and
 * review count.
 */
export function scoreTrustBarSection(content: Record<string, unknown>): SectionQualityScore {
  const badges = arr(content, "badges");
  const badgeCount = badges.length;

  let badgeScore: number;
  if (badgeCount >= 3) {
    badgeScore = 100;
  } else if (badgeCount === 0) {
    badgeScore = 0;
  } else {
    badgeScore = (badgeCount / 3) * 100;
  }

  const hasRating = num(content, "rating") > 0;
  const reviewCount = num(content, "reviewCount");

  let reviewCountScore: number;
  if (reviewCount >= 10) {
    reviewCountScore = 100;
  } else if (reviewCount === 0) {
    reviewCountScore = 0;
  } else {
    reviewCountScore = (reviewCount / 10) * 100;
  }

  const factors: QualityFactor[] = [
    {
      name: "badgeCount",
      score: clampScore(badgeScore),
      weight: 0.3,
      detail: `${badgeCount} badge(s) (ideal: 3+)`,
    },
    {
      name: "hasRating",
      score: hasRating ? 100 : 0,
      weight: 0.4,
      detail: hasRating ? "Rating displayed" : "No rating displayed",
    },
    {
      name: "reviewCount",
      score: clampScore(reviewCountScore),
      weight: 0.3,
      detail: `${reviewCount} review(s) (ideal: 10+)`,
    },
  ];

  return buildSectionScore("trust-bar", factors);
}

/**
 * Scores the services section based on service count, description presence,
 * and primary service highlighting.
 */
export function scoreServicesSection(content: Record<string, unknown>): SectionQualityScore {
  const services = arr(content, "services");
  const serviceCount = services.length;

  let serviceCountScore: number;
  if (serviceCount >= 3 && serviceCount <= 8) {
    serviceCountScore = 100;
  } else if (serviceCount === 0) {
    serviceCountScore = 0;
  } else if (serviceCount < 3) {
    serviceCountScore = (serviceCount / 3) * 80;
  } else {
    serviceCountScore = Math.max(40, 100 - (serviceCount - 8) * 10);
  }

  const hasDescriptions = services.some(
    (s) => typeof s === "object" && s !== null && "description" in s && Boolean((s as Record<string, unknown>).description),
  );

  const hasPrimaryService = bool(content, "primaryService");

  const factors: QualityFactor[] = [
    {
      name: "serviceCount",
      score: clampScore(serviceCountScore),
      weight: 0.4,
      detail: `${serviceCount} service(s) (ideal: 3-8)`,
    },
    {
      name: "hasDescriptions",
      score: hasDescriptions ? 100 : 0,
      weight: 0.3,
      detail: hasDescriptions ? "Services have descriptions" : "Services lack descriptions",
    },
    {
      name: "hasPrimaryService",
      score: hasPrimaryService ? 100 : 0,
      weight: 0.3,
      detail: hasPrimaryService ? "Primary service highlighted" : "No primary service highlighted",
    },
  ];

  return buildSectionScore("services", factors);
}

/**
 * Scores the social proof section based on review count, average text length,
 * and attribution presence.
 */
export function scoreSocialProofSection(content: Record<string, unknown>): SectionQualityScore {
  const reviews = arr(content, "reviews");
  const reviewCount = reviews.length;

  let reviewCountScore: number;
  if (reviewCount >= 3 && reviewCount <= 5) {
    reviewCountScore = 100;
  } else if (reviewCount === 0) {
    reviewCountScore = 0;
  } else if (reviewCount < 3) {
    reviewCountScore = (reviewCount / 3) * 80;
  } else {
    reviewCountScore = Math.max(60, 100 - (reviewCount - 5) * 5);
  }

  const textLengths = reviews.map((r) => {
    if (typeof r === "object" && r !== null && "text" in r) {
      const text = (r as Record<string, unknown>).text;
      return typeof text === "string" ? text.length : 0;
    }
    return 0;
  });
  const avgTextLength = textLengths.length > 0
    ? textLengths.reduce((a, b) => a + b, 0) / textLengths.length
    : 0;

  let avgTextScore: number;
  if (avgTextLength >= 50) {
    avgTextScore = 100;
  } else if (avgTextLength === 0) {
    avgTextScore = 0;
  } else {
    avgTextScore = (avgTextLength / 50) * 100;
  }

  const hasAttribution = bool(content, "attribution");

  const factors: QualityFactor[] = [
    {
      name: "reviewCount",
      score: clampScore(reviewCountScore),
      weight: 0.3,
      detail: `${reviewCount} review(s) displayed (ideal: 3-5)`,
    },
    {
      name: "avgTextLength",
      score: clampScore(avgTextScore),
      weight: 0.4,
      detail: `Avg review text ${Math.round(avgTextLength)} chars (ideal: 50+)`,
    },
    {
      name: "hasAttribution",
      score: hasAttribution ? 100 : 0,
      weight: 0.3,
      detail: hasAttribution ? "Attribution present" : "No attribution",
    },
  ];

  return buildSectionScore("social-proof", factors);
}

/**
 * Scores the about section based on description length, phone, address, and
 * website presence.
 */
export function scoreAboutSection(content: Record<string, unknown>): SectionQualityScore {
  const description = str(content, "description");
  const descLen = description.length;

  let descScore: number;
  if (descLen >= 100 && descLen <= 500) {
    descScore = 100;
  } else if (descLen === 0) {
    descScore = 0;
  } else if (descLen < 100) {
    descScore = (descLen / 100) * 80;
  } else {
    descScore = Math.max(50, 100 - (descLen - 500) * 0.5);
  }

  const hasPhone = bool(content, "phone");
  const hasAddress = bool(content, "address");
  const hasWebsite = bool(content, "website");

  const factors: QualityFactor[] = [
    {
      name: "descriptionLength",
      score: clampScore(descScore),
      weight: 0.3,
      detail: `Description is ${descLen} chars (ideal: 100-500)`,
    },
    {
      name: "hasPhone",
      score: hasPhone ? 100 : 0,
      weight: 0.2,
      detail: hasPhone ? "Phone number present" : "No phone number",
    },
    {
      name: "hasAddress",
      score: hasAddress ? 100 : 0,
      weight: 0.2,
      detail: hasAddress ? "Address present" : "No address",
    },
    {
      name: "hasWebsite",
      score: hasWebsite ? 100 : 0,
      weight: 0.3,
      detail: hasWebsite ? "Website link present" : "No website link",
    },
  ];

  return buildSectionScore("about", factors);
}

/**
 * Scores the hours section based on number of days covered and whether all
 * entries have values.
 */
export function scoreHoursSection(content: Record<string, unknown>): SectionQualityScore {
  const hours = arr(content, "hours");
  const daysCovered = hours.length;

  let daysScore: number;
  if (daysCovered >= 5) {
    daysScore = 100;
  } else if (daysCovered === 0) {
    daysScore = 0;
  } else {
    daysScore = (daysCovered / 5) * 100;
  }

  const hasEmptyValues = hours.some((h) => {
    if (typeof h !== "object" || h === null) return true;
    const entry = h as Record<string, unknown>;
    if (entry.closed) return false;
    return !entry.open || !entry.close;
  });

  const factors: QualityFactor[] = [
    {
      name: "daysCovered",
      score: clampScore(daysScore),
      weight: 0.6,
      detail: `${daysCovered} day(s) covered (ideal: 5+)`,
    },
    {
      name: "noEmptyValues",
      score: hasEmptyValues ? 0 : 100,
      weight: 0.4,
      detail: hasEmptyValues ? "Some hours entries are incomplete" : "All hours entries complete",
    },
  ];

  return buildSectionScore("hours", factors);
}

/**
 * Scores the FAQ section based on item count, average answer length, and
 * whether all questions have answers.
 */
export function scoreFaqSection(content: Record<string, unknown>): SectionQualityScore {
  const items = arr(content, "items");
  const itemCount = items.length;

  let itemCountScore: number;
  if (itemCount >= 3 && itemCount <= 7) {
    itemCountScore = 100;
  } else if (itemCount === 0) {
    itemCountScore = 0;
  } else if (itemCount < 3) {
    itemCountScore = (itemCount / 3) * 80;
  } else {
    itemCountScore = Math.max(60, 100 - (itemCount - 7) * 5);
  }

  const answerLengths = items.map((item) => {
    if (typeof item === "object" && item !== null && "answer" in item) {
      const answer = (item as Record<string, unknown>).answer;
      return typeof answer === "string" ? answer.length : 0;
    }
    return 0;
  });
  const avgAnswerLength = answerLengths.length > 0
    ? answerLengths.reduce((a, b) => a + b, 0) / answerLengths.length
    : 0;

  let avgAnswerScore: number;
  if (avgAnswerLength >= 50) {
    avgAnswerScore = 100;
  } else if (avgAnswerLength === 0) {
    avgAnswerScore = 0;
  } else {
    avgAnswerScore = (avgAnswerLength / 50) * 100;
  }

  const allHaveAnswers = items.every((item) => {
    if (typeof item !== "object" || item === null || !("answer" in item)) return false;
    const answer = (item as Record<string, unknown>).answer;
    return typeof answer === "string" && answer.length > 0;
  });

  const factors: QualityFactor[] = [
    {
      name: "itemCount",
      score: clampScore(itemCountScore),
      weight: 0.3,
      detail: `${itemCount} FAQ item(s) (ideal: 3-7)`,
    },
    {
      name: "avgAnswerLength",
      score: clampScore(avgAnswerScore),
      weight: 0.4,
      detail: `Avg answer length ${Math.round(avgAnswerLength)} chars (ideal: 50+)`,
    },
    {
      name: "allAnswered",
      score: allHaveAnswers ? 100 : 0,
      weight: 0.3,
      detail: allHaveAnswers ? "All questions answered" : "Some questions unanswered",
    },
  ];

  return buildSectionScore("faq", factors);
}

/**
 * Scores the lead magnet section based on required form fields, submit label,
 * and source tracking presence.
 */
export function scoreLeadMagnetSection(content: Record<string, unknown>): SectionQualityScore {
  const formFields = arr(content, "formFields") as string[];

  const requiredFields = ["email", "phone"];
  const hasNameField = formFields.some(
    (f) => typeof f === "string" && (f === "name" || f === "firstName" || f === "lastName"),
  );
  const hasEmailField = formFields.some(
    (f) => typeof f === "string" && f === "email",
  );
  const hasPhoneField = formFields.some(
    (f) => typeof f === "string" && f === "phone",
  );
  const requiredPresent = [hasNameField, hasEmailField, hasPhoneField].filter(Boolean).length;
  const requiredScore = (requiredPresent / 3) * 100;

  const hasSubmitLabel = Boolean(str(content, "submitLabel"));
  const hasSource = Boolean(str(content, "source"));

  const factors: QualityFactor[] = [
    {
      name: "hasRequiredFields",
      score: clampScore(requiredScore),
      weight: 0.4,
      detail: `${requiredPresent}/3 required fields present (name, email, phone)`,
    },
    {
      name: "hasSubmitLabel",
      score: hasSubmitLabel ? 100 : 0,
      weight: 0.3,
      detail: hasSubmitLabel ? "Submit label set" : "No submit label",
    },
    {
      name: "hasSourceTracking",
      score: hasSource ? 100 : 0,
      weight: 0.3,
      detail: hasSource ? "Source tracking active" : "No source tracking",
    },
  ];

  return buildSectionScore("lead-magnet", factors);
}

/**
 * Scores the CTA banner section based on heading, CTA text, and phone/URL
 * presence.
 */
export function scoreCtaBannerSection(content: Record<string, unknown>): SectionQualityScore {
  const hasHeading = Boolean(str(content, "heading"));
  const hasCtaText = Boolean(str(content, "ctaText"));
  const hasPhoneOrUrl = Boolean(str(content, "phone")) || Boolean(str(content, "ctaUrl"));

  const factors: QualityFactor[] = [
    {
      name: "hasHeading",
      score: hasHeading ? 100 : 0,
      weight: 0.3,
      detail: hasHeading ? "Heading present" : "No heading",
    },
    {
      name: "hasCtaText",
      score: hasCtaText ? 100 : 0,
      weight: 0.3,
      detail: hasCtaText ? "CTA text present" : "No CTA text",
    },
    {
      name: "hasPhoneOrUrl",
      score: hasPhoneOrUrl ? 100 : 0,
      weight: 0.4,
      detail: hasPhoneOrUrl ? "Phone or URL available" : "No phone or URL",
    },
  ];

  return buildSectionScore("cta-banner", factors);
}

// ---------------------------------------------------------------------------
// Section scorer dispatch
// ---------------------------------------------------------------------------

const SECTION_SCORERS: Record<
  string,
  (content: Record<string, unknown>) => SectionQualityScore
> = {
  "hero": scoreHeroSection,
  "trust-bar": scoreTrustBarSection,
  "services": scoreServicesSection,
  "social-proof": scoreSocialProofSection,
  "about": scoreAboutSection,
  "hours": scoreHoursSection,
  "faq": scoreFaqSection,
  "lead-magnet": scoreLeadMagnetSection,
  "cta-banner": scoreCtaBannerSection,
};

function scoreSection(section: LandingPageSection): SectionQualityScore | null {
  const scorer = SECTION_SCORERS[section.type];
  if (!scorer) return null;
  return scorer(section.content);
}

// ---------------------------------------------------------------------------
// SEO scoring
// ---------------------------------------------------------------------------

/**
 * Scores SEO readiness of a landing page on a 0-100 scale.
 *
 * - metaTitle exists and 30-60 chars (25 pts)
 * - metaDescription exists and 120-160 chars (25 pts)
 * - JSON-LD has @context + @type (25 pts)
 * - canonicalUrl exists (15 pts)
 * - ogImage exists (10 pts)
 */
export function scoreSEO(page: GeneratedLandingPage): number {
  let score = 0;

  if (page.metaTitle) {
    const len = page.metaTitle.length;
    if (len >= 30 && len <= 60) {
      score += 25;
    } else {
      score += 10;
    }
  }

  if (page.metaDescription) {
    const len = page.metaDescription.length;
    if (len >= 120 && len <= 160) {
      score += 25;
    } else {
      score += 10;
    }
  }

  if (page.jsonLd && page.jsonLd["@context"] && page.jsonLd["@type"]) {
    score += 25;
  }

  if (page.canonicalUrl) {
    score += 15;
  }

  if (page.ogImage) {
    score += 10;
  }

  return clampScore(score);
}

// ---------------------------------------------------------------------------
// Accessibility flag detection
// ---------------------------------------------------------------------------

function detectAccessibilityFlags(page: GeneratedLandingPage): string[] {
  const flags: string[] = [];

  const heroSection = page.sections.find((s) => s.type === "hero");
  if (heroSection) {
    const bgImage = str(heroSection.content, "backgroundImage");
    if (bgImage) {
      flags.push("Hero background image needs alt text or aria-label for screen readers");
    }
  }

  const socialProof = page.sections.find((s) => s.type === "social-proof");
  if (socialProof) {
    const reviews = arr(socialProof.content, "reviews");
    const ratingsWithoutText = reviews.filter((r) => {
      if (typeof r !== "object" || r === null) return false;
      const entry = r as Record<string, unknown>;
      return typeof entry.rating === "number" && !entry.text;
    });
    if (ratingsWithoutText.length > 0) {
      flags.push("Star ratings require aria-label describing the rating value");
    }
  }

  const leadMagnet = page.sections.find((s) => s.type === "lead-magnet");
  if (leadMagnet) {
    const formFields = arr(leadMagnet.content, "formFields");
    if (formFields.length > 0) {
      flags.push("Form fields require associated label elements for accessibility");
    }
  }

  return flags;
}

// ---------------------------------------------------------------------------
// Recommendation generation
// ---------------------------------------------------------------------------

const RECOMMENDATION_THRESHOLD = 60;

function priorityFromScore(score: number): QualityRecommendation["priority"] {
  if (score < 20) return "critical";
  if (score < 40) return "high";
  if (score < 50) return "medium";
  return "low";
}

function generateRecommendations(
  sectionScores: SectionQualityScore[],
): QualityRecommendation[] {
  const recommendations: QualityRecommendation[] = [];

  for (const section of sectionScores) {
    if (section.score >= RECOMMENDATION_THRESHOLD) continue;

    const weakFactors = section.factors
      .filter((f) => f.score < RECOMMENDATION_THRESHOLD)
      .sort((a, b) => a.score - b.score);

    for (const factor of weakFactors) {
      recommendations.push({
        priority: priorityFromScore(factor.score),
        section: section.sectionType,
        issue: factor.detail,
        suggestion: buildSuggestion(section.sectionType, factor.name),
      });
    }
  }

  return recommendations.sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}

function buildSuggestion(sectionType: string, factorName: string): string {
  const suggestions: Record<string, Record<string, string>> = {
    hero: {
      headlineLength: "Adjust the headline to 30-70 characters for optimal readability",
      hasCta: "Add a clear call-to-action button to drive conversions",
      hasBackgroundImage: "Add a high-quality background image to create visual impact",
      hasRatingBadge: "Display the business rating to build trust with visitors",
    },
    "trust-bar": {
      badgeCount: "Add at least 3 trust badges (e.g. Licensed, Insured, BBB Accredited)",
      hasRating: "Display the aggregate star rating prominently",
      reviewCount: "Encourage customers to leave reviews to reach 10+ total",
    },
    services: {
      serviceCount: "List 3-8 services for comprehensive coverage without overwhelming visitors",
      hasDescriptions: "Add brief descriptions to each service for better engagement",
      hasPrimaryService: "Highlight the primary service to guide visitor attention",
    },
    "social-proof": {
      reviewCount: "Display 3-5 reviews for social proof without cluttering the page",
      avgTextLength: "Feature reviews with substantive text (50+ characters) for credibility",
      hasAttribution: "Add attribution (e.g. 'Reviews from Google') for transparency",
    },
    about: {
      descriptionLength: "Write a description between 100-500 characters for optimal engagement",
      hasPhone: "Include a phone number so visitors can contact the business directly",
      hasAddress: "Add the business address for local SEO and trust",
      hasWebsite: "Link to the business website for additional credibility",
    },
    hours: {
      daysCovered: "Include operating hours for at least 5 days of the week",
      noEmptyValues: "Ensure all hours entries have complete open/close times",
    },
    faq: {
      itemCount: "Include 3-7 FAQ items to address common customer questions",
      avgAnswerLength: "Provide answers of at least 50 characters for helpful content",
      allAnswered: "Ensure every question has a corresponding answer",
    },
    "lead-magnet": {
      hasRequiredFields: "Include name, email, and phone fields for complete lead capture",
      hasSubmitLabel: "Add a descriptive submit button label (e.g. 'Get Free Quote')",
      hasSourceTracking: "Add source tracking to attribute leads to this landing page",
    },
    "cta-banner": {
      hasHeading: "Add a compelling heading to the CTA banner",
      hasCtaText: "Add clear call-to-action text (e.g. 'Call Now', 'Get Started')",
      hasPhoneOrUrl: "Include a phone number or URL for the CTA action",
    },
  };

  return suggestions[sectionType]?.[factorName] ?? "Improve this factor to increase the section score";
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

/**
 * Scores the overall content quality of a generated landing page.
 *
 * Evaluates each section independently, computes an SEO score, checks
 * accessibility concerns, and produces actionable recommendations for any
 * section scoring below 60.
 *
 * @param page    - The generated landing page to evaluate.
 * @param profile - The ingested business profile used to generate the page.
 * @returns A complete quality report with per-section and overall scores.
 */
export function scoreContentQuality(
  page: GeneratedLandingPage,
  profile: IngestedBusinessProfile,
): ContentQualityReport {
  const sectionScores: SectionQualityScore[] = [];

  for (const section of page.sections) {
    const result = scoreSection(section);
    if (result) {
      sectionScores.push(result);
    }
  }

  const seoScore = scoreSEO(page);
  const accessibilityFlags = detectAccessibilityFlags(page);
  const recommendations = generateRecommendations(sectionScores);

  let overallScore: number;
  if (sectionScores.length > 0) {
    const totalSectionScore = sectionScores.reduce((sum, s) => sum + s.score, 0);
    overallScore = clampScore(totalSectionScore / sectionScores.length);
  } else {
    overallScore = 0;
  }

  return {
    slug: page.slug,
    overallScore,
    overallGrade: gradeFromScore(overallScore),
    sectionScores,
    recommendations,
    dataCompleteness: profile.listingCompleteness,
    reviewQuality: profile.reviewQuality,
    seoScore,
    accessibilityFlags,
    scoredAt: new Date().toISOString(),
  };
}
