import type { ScrapeResult } from "./integrations/web-scraper.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DesignTokens {
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    all: string[];
  };
  typography: {
    headingFont?: string;
    bodyFont?: string;
    fontSizes: string[];
  };
  spacing: {
    base?: string;
    scale: string[];
  };
  borderRadius: string[];
}

export interface LayoutSection {
  type:
    | "hero"
    | "features"
    | "testimonials"
    | "pricing"
    | "cta"
    | "faq"
    | "stats"
    | "gallery"
    | "form"
    | "footer"
    | "navigation"
    | "content"
    | "unknown";
  position: number;
  headingText?: string;
  subheadingText?: string;
  ctaLabels: string[];
  hasForm: boolean;
  hasImage: boolean;
  estimatedColumns: number;
}

export interface CopyInventory {
  headlines: string[];
  subheadlines: string[];
  valuePropositions: string[];
  ctaLabels: string[];
  socialProofClaims: string[];
  faqQuestions: string[];
}

export interface FunnelSignals {
  formFields: string[];
  hasChat: boolean;
  hasBooking: boolean;
  hasCheckout: boolean;
  hasPricing: boolean;
  hasTestimonials: boolean;
  hasVideo: boolean;
  hasFaq: boolean;
  detectedFamily: string;
}

export interface DesignIngestionResult {
  sourceUrl: string;
  scrapedAt: string;
  tokens: DesignTokens;
  layout: {
    sections: LayoutSection[];
    sectionCount: number;
    hasAboveFoldCta: boolean;
  };
  copy: CopyInventory;
  funnel: FunnelSignals;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Color extraction
// ---------------------------------------------------------------------------

export function extractColorsFromMarkdown(markdown: string): string[] {
  const found = new Set<string>();

  const hexPattern = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  for (const match of markdown.matchAll(hexPattern)) {
    found.add(match[0].toLowerCase());
  }

  const rgbPattern = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g;
  for (const match of markdown.matchAll(rgbPattern)) {
    found.add(match[0].toLowerCase());
  }

  const hslPattern = /hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)/g;
  for (const match of markdown.matchAll(hslPattern)) {
    found.add(match[0].toLowerCase());
  }

  return Array.from(found);
}

function assignColorRoles(colors: string[]): DesignTokens["colors"] {
  return {
    primary: colors[0],
    secondary: colors[1],
    accent: colors[2],
    background: colors[3],
    text: colors[4],
    all: colors,
  };
}

// ---------------------------------------------------------------------------
// Typography extraction
// ---------------------------------------------------------------------------

export function extractTypographyFromMarkdown(
  markdown: string,
): { fonts: string[]; sizes: string[] } {
  const fonts: string[] = [];
  const sizes: string[] = [];

  const fontFamilyPattern = /font-family\s*:\s*([^;}\n]+)/gi;
  for (const match of markdown.matchAll(fontFamilyPattern)) {
    const raw = match[1].trim().replace(/['"]/g, "");
    const primary = raw.split(",")[0].trim();
    if (primary.length > 0 && !fonts.includes(primary)) {
      fonts.push(primary);
    }
  }

  const fontSizePattern = /font-size\s*:\s*([\d.]+(?:px|rem|em|pt))/gi;
  for (const match of markdown.matchAll(fontSizePattern)) {
    const size = match[1].trim();
    if (!sizes.includes(size)) {
      sizes.push(size);
    }
  }

  return { fonts, sizes };
}

// ---------------------------------------------------------------------------
// Section classification
// ---------------------------------------------------------------------------

const HERO_SIGNALS = ["hero", "banner", "welcome", "above the fold", "headline"];
const FEATURE_SIGNALS = ["features", "benefits", "why choose", "what we offer", "capabilities", "how it works"];
const TESTIMONIAL_SIGNALS = ["testimonials", "reviews", "what clients say", "success stories", "case studies", "what our"];
const PRICING_SIGNALS = ["pricing", "plans", "packages", "cost", "investment", "get started for"];
const FAQ_SIGNALS = ["faq", "frequently asked", "common questions", "questions & answers", "q&a"];
const CTA_SIGNALS = ["get started", "sign up", "book", "schedule", "contact us", "claim", "join now", "try free"];
const STATS_SIGNALS = ["results", "impact", "numbers", "achievements", "by the numbers"];
const FORM_SIGNALS = ["contact form", "reach out", "send us", "submit", "fill out", "get in touch"];
const FOOTER_SIGNALS = ["footer", "copyright", "all rights reserved", "privacy policy", "terms of service"];
const NAV_SIGNALS = ["navigation", "menu", "home", "about", "services", "contact", "login"];

function classifySectionType(headingText: string, bodyText: string): LayoutSection["type"] {
  const combined = `${headingText} ${bodyText}`.toLowerCase();

  if (FOOTER_SIGNALS.some((s) => combined.includes(s))) return "footer";
  if (NAV_SIGNALS.filter((s) => combined.includes(s)).length >= 2) return "navigation";
  if (PRICING_SIGNALS.some((s) => combined.includes(s))) return "pricing";
  if (FAQ_SIGNALS.some((s) => combined.includes(s))) return "faq";
  if (TESTIMONIAL_SIGNALS.some((s) => combined.includes(s))) return "testimonials";
  if (STATS_SIGNALS.some((s) => combined.includes(s))) return "stats";
  if (FORM_SIGNALS.some((s) => combined.includes(s))) return "form";
  if (FEATURE_SIGNALS.some((s) => combined.includes(s))) return "features";
  if (HERO_SIGNALS.some((s) => combined.includes(s))) return "hero";
  if (CTA_SIGNALS.some((s) => combined.includes(s))) return "cta";

  return "content";
}

function extractCtaLabelsFromText(text: string): string[] {
  const ctaPattern = /\[([^\]]{2,40})\]\([^)]+\)/g;
  const labels: string[] = [];
  for (const match of text.matchAll(ctaPattern)) {
    const label = match[1].trim();
    const lowerLabel = label.toLowerCase();
    const isCta = CTA_SIGNALS.some((s) => lowerLabel.includes(s)) ||
      /^(get|start|try|book|schedule|sign|join|claim|buy|download|access)\b/i.test(label);
    if (isCta && !labels.includes(label)) {
      labels.push(label);
    }
  }
  return labels;
}

export function classifySections(markdown: string): LayoutSection[] {
  const headingPattern = /^(#{1,3})\s+(.+)$/gm;
  const headingMatches = Array.from(markdown.matchAll(headingPattern));

  if (headingMatches.length === 0) {
    return [{
      type: "content",
      position: 0,
      headingText: undefined,
      subheadingText: undefined,
      ctaLabels: extractCtaLabelsFromText(markdown),
      hasForm: /input|textarea|select|form/i.test(markdown),
      hasImage: /!\[.*?\]\(.*?\)/.test(markdown),
      estimatedColumns: 1,
    }];
  }

  return headingMatches.map((match, index) => {
    const level = match[1].length;
    const headingText = match[2].trim();
    const headingPos = match.index ?? 0;

    const nextMatchPos = headingMatches[index + 1]?.index ?? markdown.length;
    const bodyText = markdown.slice(headingPos + match[0].length, nextMatchPos).trim();

    const subheadingMatch = /^#{2,6}\s+(.+)$/m.exec(bodyText);
    const subheadingText = subheadingMatch?.[1]?.trim();

    const ctaLabels = extractCtaLabelsFromText(bodyText);
    const hasForm = /input|textarea|select|\bform\b/i.test(bodyText);
    const hasImage = /!\[.*?\]\(.*?\)/.test(bodyText);

    const listItemCount = (bodyText.match(/^[-*+]\s+/gm) ?? []).length;
    const estimatedColumns = listItemCount >= 6 ? 3 : listItemCount >= 3 ? 2 : 1;

    const type = level === 1 && index === 0
      ? "hero"
      : classifySectionType(headingText, bodyText);

    return {
      type,
      position: index,
      headingText,
      subheadingText,
      ctaLabels,
      hasForm,
      hasImage,
      estimatedColumns,
    };
  });
}

// ---------------------------------------------------------------------------
// Copy extraction
// ---------------------------------------------------------------------------

const SOCIAL_PROOF_PATTERNS = [
  /\d+[\d,]*\+?\s*(?:customers|clients|users|businesses|companies|members|subscribers)/i,
  /\d+(?:\.\d+)?(?:\/5|\s*stars?)\s*(?:rating|rated|reviews?)/i,
  /trusted\s+by\s+(?:over\s+)?\d+/i,
  /\d+%\s+(?:of\s+)?(?:customers|clients|users)/i,
  /(?:rated|awarded|certified)\s+#?\d*/i,
  /(?:over|more than)\s+\d+[\d,]*\s+(?:happy|satisfied)/i,
];

export function extractCopy(markdown: string): CopyInventory {
  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);

  const headlines: string[] = [];
  const subheadlines: string[] = [];
  const valuePropositions: string[] = [];
  const ctaLabels: string[] = [];
  const socialProofClaims: string[] = [];
  const faqQuestions: string[] = [];

  for (const line of lines) {
    if (/^#\s+/.test(line)) {
      const text = line.replace(/^#+\s+/, "").trim();
      if (text.length > 0) headlines.push(text);
    } else if (/^##\s+/.test(line)) {
      const text = line.replace(/^#+\s+/, "").trim();
      if (text.length > 0) subheadlines.push(text);
    } else if (/^###\s+/.test(line) && /\?$/.test(line)) {
      const text = line.replace(/^#+\s+/, "").trim();
      faqQuestions.push(text);
    }

    const ctaMatch = /\[([^\]]{2,60})\]\([^)]+\)/g;
    for (const match of line.matchAll(ctaMatch)) {
      const label = match[1].trim();
      const isCtaLike = CTA_SIGNALS.some((s) => label.toLowerCase().includes(s)) ||
        /^(get|start|try|book|schedule|sign|join|claim|buy|download|access)\b/i.test(label);
      if (isCtaLike && !ctaLabels.includes(label)) ctaLabels.push(label);
    }

    if (SOCIAL_PROOF_PATTERNS.some((p) => p.test(line))) {
      const cleaned = line.replace(/[*_`#[\]]/g, "").trim();
      if (!socialProofClaims.includes(cleaned)) socialProofClaims.push(cleaned);
    }

    const isValueProp = line.length > 20 &&
      line.length < 200 &&
      !/^[#\-*>]/.test(line) &&
      /(?:save|grow|increase|reduce|improve|transform|accelerate|boost|eliminate|automate|simplify|streamline)/i.test(line);
    if (isValueProp) {
      const cleaned = line.replace(/[*_`]/g, "").trim();
      if (!valuePropositions.includes(cleaned)) valuePropositions.push(cleaned);
    }
  }

  return {
    headlines: headlines.slice(0, 10),
    subheadlines: subheadlines.slice(0, 10),
    valuePropositions: valuePropositions.slice(0, 10),
    ctaLabels: ctaLabels.slice(0, 10),
    socialProofClaims: socialProofClaims.slice(0, 10),
    faqQuestions: faqQuestions.slice(0, 20),
  };
}

// ---------------------------------------------------------------------------
// Funnel signal detection
// ---------------------------------------------------------------------------

const CHAT_PATTERNS = [/intercom/i, /drift\.com/i, /crisp\.chat/i, /tawk\.to/i, /livechat/i, /zendesk/i];
const BOOKING_PATTERNS = [/calendly\.com/i, /acuityscheduling/i, /doodle\.com/i, /hubspot.*meeting/i, /book\s+a\s+(?:call|demo|meeting|appointment)/i];
const CHECKOUT_PATTERNS = [/stripe\.com/i, /checkout\.com/i, /paypal\.com/i, /payment/i, /buy\s+now/i, /add\s+to\s+cart/i];
const VIDEO_PATTERNS = [/youtube\.com\/embed/i, /youtu\.be\//i, /vimeo\.com/i, /wistia\.com/i, /loom\.com/i];
const FORM_FIELD_PATTERNS = [
  { name: "email", pattern: /(?:email|e-mail)\s*(?:address)?/i },
  { name: "name", pattern: /(?:full\s+)?name/i },
  { name: "phone", pattern: /(?:phone|mobile|cell)\s*(?:number)?/i },
  { name: "company", pattern: /company|business|organization/i },
  { name: "message", pattern: /message|comment|question|details/i },
  { name: "budget", pattern: /budget|investment/i },
  { name: "timeline", pattern: /timeline|when|start\s+date/i },
];

function detectFunnelFamily(markdown: string, hasPricing: boolean, hasBooking: boolean, hasFaq: boolean): string {
  const lower = markdown.toLowerCase();

  if (/quiz|assessment|calculator|score/i.test(lower)) return "quiz";
  if (/webinar|workshop|masterclass/i.test(lower)) return "webinar";
  if (/free\s+(?:guide|ebook|checklist|report|template)/i.test(lower)) return "lead-magnet";
  if (hasPricing && /compare|vs\.|versus|alternative/i.test(lower)) return "comparison";
  if (/apply\s+now|application\s+form|qualify/i.test(lower)) return "application";
  if (hasBooking) return "direct-conversion";
  if (hasPricing) return "direct-conversion";
  if (hasFaq) return "nurture";

  return "lead-magnet";
}

export function detectFunnelSignals(
  markdown: string,
  metadata: Record<string, unknown>,
): FunnelSignals {
  const combined = `${markdown} ${JSON.stringify(metadata)}`;

  const formFields: string[] = [];
  for (const { name, pattern } of FORM_FIELD_PATTERNS) {
    if (pattern.test(combined)) formFields.push(name);
  }

  const hasChat = CHAT_PATTERNS.some((p) => p.test(combined));
  const hasBooking = BOOKING_PATTERNS.some((p) => p.test(combined));
  const hasCheckout = CHECKOUT_PATTERNS.some((p) => p.test(combined));
  const hasPricing = /pricing|plans?|packages?|\$\d+|per\s+month/i.test(combined);
  const hasTestimonials = /testimonials?|reviews?|what\s+(?:clients?|customers?)\s+say/i.test(combined);
  const hasVideo = VIDEO_PATTERNS.some((p) => p.test(combined));
  const hasFaq = /faq|frequently\s+asked|common\s+questions/i.test(combined);

  const detectedFamily = detectFunnelFamily(markdown, hasPricing, hasBooking, hasFaq);

  return {
    formFields,
    hasChat,
    hasBooking,
    hasCheckout,
    hasPricing,
    hasTestimonials,
    hasVideo,
    hasFaq,
    detectedFamily,
  };
}

// ---------------------------------------------------------------------------
// Confidence scoring
// ---------------------------------------------------------------------------

function computeConfidence(
  colors: string[],
  sections: LayoutSection[],
  copy: CopyInventory,
  funnel: FunnelSignals,
): number {
  let score = 0;

  // Colors: up to 15 points
  score += Math.min(colors.length * 3, 15);

  // Sections: up to 20 points
  score += Math.min(sections.length * 4, 20);

  // Copy richness: up to 35 points
  score += Math.min(copy.headlines.length * 4, 16);
  score += Math.min(copy.ctaLabels.length * 3, 9);
  score += Math.min(copy.socialProofClaims.length * 2, 6);
  score += Math.min(copy.valuePropositions.length * 2, 4);

  // Funnel signals: up to 30 points
  const signals = [
    funnel.formFields.length > 0,
    funnel.hasPricing,
    funnel.hasTestimonials,
    funnel.hasBooking,
    funnel.hasVideo,
    funnel.hasFaq,
  ].filter(Boolean).length;
  score += Math.min(signals * 5, 30);

  return Math.min(Math.round(score), 100);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function ingestDesignFromScrape(scrapeResult: ScrapeResult): DesignIngestionResult {
  const { url, markdown, metadata, scrapedAt } = scrapeResult;

  const allColors = extractColorsFromMarkdown(markdown);
  const { fonts, sizes } = extractTypographyFromMarkdown(markdown);

  const tokens: DesignTokens = {
    colors: assignColorRoles(allColors),
    typography: {
      headingFont: fonts[0],
      bodyFont: fonts[1] ?? fonts[0],
      fontSizes: sizes,
    },
    spacing: {
      base: undefined,
      scale: [],
    },
    borderRadius: [],
  };

  const sections = classifySections(markdown);
  const hasAboveFoldCta = sections.slice(0, 2).some(
    (s) => s.ctaLabels.length > 0 || s.type === "hero" || s.type === "cta",
  );

  const copy = extractCopy(markdown);
  const metaRecord = metadata as Record<string, unknown>;
  const funnel = detectFunnelSignals(markdown, metaRecord);

  const confidence = computeConfidence(allColors, sections, copy, funnel);

  return {
    sourceUrl: url,
    scrapedAt,
    tokens,
    layout: {
      sections,
      sectionCount: sections.length,
      hasAboveFoldCta,
    },
    copy,
    funnel,
    confidence,
  };
}
