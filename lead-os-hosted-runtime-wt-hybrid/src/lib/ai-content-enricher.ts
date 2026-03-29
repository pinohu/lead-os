import { callLLM, isAIEnabled, type LLMMessage } from "./ai-client.ts";
import {
  getLandingPage,
  saveLandingPage,
  type GeneratedLandingPage,
  type LandingPageSection,
} from "./landing-page-generator.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnrichmentRequest {
  slug: string;
  sections: EnrichmentTarget[];
  nicheContext: {
    niche: string;
    industry: string;
    city: string;
    state: string;
  };
  businessName: string;
  tone?: "professional" | "friendly" | "authoritative" | "warm";
}

export interface EnrichmentTarget {
  sectionType: string;
  currentContent: Record<string, unknown>;
  instruction?: string;
}

export interface EnrichmentResult {
  slug: string;
  enrichments: SectionEnrichment[];
  tokensUsed: { input: number; output: number };
  durationMs: number;
  enrichedAt: string;
}

export interface SectionEnrichment {
  sectionType: string;
  original: Record<string, unknown>;
  enriched: Record<string, unknown>;
  changed: boolean;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Tone instructions
// ---------------------------------------------------------------------------

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: "Use a polished, authoritative tone. Sound trustworthy and expert.",
  friendly: "Use a warm, conversational tone. Be approachable and relatable.",
  authoritative: "Use a commanding, confident tone. Establish expertise and credibility.",
  warm: "Use a caring, empathetic tone. Make the reader feel understood and welcomed.",
};

// ---------------------------------------------------------------------------
// JSON parsing helper
// ---------------------------------------------------------------------------

export function parseJsonFromLLM(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Section enrichers
// ---------------------------------------------------------------------------

function buildToneDirective(tone?: string): string {
  if (!tone) return "";
  const instruction = TONE_INSTRUCTIONS[tone];
  return instruction ? ` ${instruction}` : "";
}

function mapTokens(usage: { inputTokens: number; outputTokens: number }): { input: number; output: number } {
  return { input: usage.inputTokens, output: usage.outputTokens };
}

function noOpEnrichment(
  sectionType: string,
  content: Record<string, unknown>,
): SectionEnrichment {
  return {
    sectionType,
    original: content,
    enriched: content,
    changed: false,
    confidence: 1.0,
  };
}

export async function enrichHeroSection(
  content: Record<string, unknown>,
  context: {
    businessName: string;
    niche: string;
    city: string;
    tone?: string;
  },
): Promise<{ enrichment: SectionEnrichment; tokens: { input: number; output: number } }> {
  if (!isAIEnabled()) {
    return { enrichment: noOpEnrichment("hero", content), tokens: { input: 0, output: 0 } };
  }

  const currentHeadline = typeof content.headline === "string" ? content.headline : "";
  const currentSubheadline = typeof content.subheadline === "string" ? content.subheadline : "";

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are an expert landing page copywriter. Write compelling, SEO-friendly headlines for local businesses.${buildToneDirective(context.tone)} Respond with JSON only: { "headline": "...", "subheadline": "..." }`,
    },
    {
      role: "user",
      content: `Improve the headline and subheadline for this local business landing page.\n\nBusiness: ${context.businessName}\nNiche: ${context.niche}\nCity: ${context.city}\nCurrent headline: "${currentHeadline}"\nCurrent subheadline: "${currentSubheadline}"\n\nReturn improved versions as JSON.`,
    },
  ];

  const response = await callLLM(messages, { maxTokens: 512, temperature: 0.7 });
  const parsed = parseJsonFromLLM(response.content);

  if (!parsed || typeof parsed !== "object") {
    return { enrichment: noOpEnrichment("hero", content), tokens: mapTokens(response.usage) };
  }

  const result = parsed as Record<string, unknown>;
  const enriched: Record<string, unknown> = { ...content };

  if (typeof result.headline === "string" && result.headline.length > 0) {
    enriched.headline = result.headline;
  }
  if (typeof result.subheadline === "string" && result.subheadline.length > 0) {
    enriched.subheadline = result.subheadline;
  }

  const changed = enriched.headline !== content.headline || enriched.subheadline !== content.subheadline;

  return {
    enrichment: {
      sectionType: "hero",
      original: content,
      enriched,
      changed,
      confidence: 0.8,
    },
    tokens: { input: response.usage.inputTokens, output: response.usage.outputTokens },
  };
}

export async function enrichAboutSection(
  content: Record<string, unknown>,
  context: {
    businessName: string;
    niche: string;
    city: string;
    tone?: string;
  },
): Promise<{ enrichment: SectionEnrichment; tokens: { input: number; output: number } }> {
  const description = typeof content.description === "string" ? content.description : "";

  if (description.length >= 200 || !isAIEnabled()) {
    return { enrichment: noOpEnrichment("about", content), tokens: { input: 0, output: 0 } };
  }

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are a professional copywriter for local businesses.${buildToneDirective(context.tone)} Respond with JSON only: { "description": "..." }`,
    },
    {
      role: "user",
      content: `Write a 2-3 sentence professional description for this business. Expand on the existing description if provided.\n\nBusiness: ${context.businessName}\nNiche: ${context.niche}\nCity: ${context.city}\nCurrent description: "${description}"\n\nReturn the improved description as JSON.`,
    },
  ];

  const response = await callLLM(messages, { maxTokens: 512, temperature: 0.7 });
  const parsed = parseJsonFromLLM(response.content);

  if (!parsed || typeof parsed !== "object") {
    return { enrichment: noOpEnrichment("about", content), tokens: mapTokens(response.usage) };
  }

  const result = parsed as Record<string, unknown>;
  const enriched: Record<string, unknown> = { ...content };

  if (typeof result.description === "string" && result.description.length > 0) {
    enriched.description = result.description;
  }

  const changed = enriched.description !== content.description;

  return {
    enrichment: {
      sectionType: "about",
      original: content,
      enriched,
      changed,
      confidence: 0.75,
    },
    tokens: { input: response.usage.inputTokens, output: response.usage.outputTokens },
  };
}

export async function enrichFaqSection(
  content: Record<string, unknown>,
  context: {
    businessName: string;
    niche: string;
    city: string;
    state: string;
    tone?: string;
  },
): Promise<{ enrichment: SectionEnrichment; tokens: { input: number; output: number } }> {
  if (!isAIEnabled()) {
    return { enrichment: noOpEnrichment("faq", content), tokens: { input: 0, output: 0 } };
  }

  const items = Array.isArray(content.items) ? content.items : [];
  const SHORT_ANSWER_THRESHOLD = 50;
  const shortItems = items.filter(
    (item: Record<string, unknown>) =>
      typeof item.answer === "string" && item.answer.length < SHORT_ANSWER_THRESHOLD,
  );

  if (shortItems.length === 0) {
    return { enrichment: noOpEnrichment("faq", content), tokens: { input: 0, output: 0 } };
  }

  const faqList = shortItems.map(
    (item: Record<string, unknown>) =>
      `Q: ${String(item.question ?? "")}\nA: ${String(item.answer ?? "")}`,
  ).join("\n\n");

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are an expert at writing helpful FAQ answers for local businesses.${buildToneDirective(context.tone)} Respond with JSON only: { "answers": { "<question>": "<improved answer>", ... } }`,
    },
    {
      role: "user",
      content: `Improve these short FAQ answers with more detailed, helpful responses relevant to a ${context.niche} business in ${context.city}, ${context.state}.\n\nBusiness: ${context.businessName}\n\n${faqList}\n\nReturn improved answers as JSON where keys are the questions.`,
    },
  ];

  const response = await callLLM(messages, { maxTokens: 512, temperature: 0.7 });
  const parsed = parseJsonFromLLM(response.content);

  if (!parsed || typeof parsed !== "object") {
    return { enrichment: noOpEnrichment("faq", content), tokens: mapTokens(response.usage) };
  }

  const result = parsed as { answers?: Record<string, string> };
  const answersMap = result.answers ?? {};

  let anyChanged = false;
  const enrichedItems = items.map((item: Record<string, unknown>) => {
    const question = String(item.question ?? "");
    const currentAnswer = String(item.answer ?? "");

    if (currentAnswer.length >= SHORT_ANSWER_THRESHOLD) {
      return item;
    }

    const improved = answersMap[question];
    if (typeof improved === "string" && improved.length > 0) {
      anyChanged = true;
      return { ...item, answer: improved };
    }
    return item;
  });

  const enriched: Record<string, unknown> = { ...content, items: enrichedItems };

  return {
    enrichment: {
      sectionType: "faq",
      original: content,
      enriched,
      changed: anyChanged,
      confidence: 0.7,
    },
    tokens: { input: response.usage.inputTokens, output: response.usage.outputTokens },
  };
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

const SECTION_ENRICHERS: Record<
  string,
  (
    content: Record<string, unknown>,
    context: { businessName: string; niche: string; city: string; state: string; tone?: string },
  ) => Promise<{ enrichment: SectionEnrichment; tokens: { input: number; output: number } }>
> = {
  hero: (content, ctx) => enrichHeroSection(content, ctx),
  about: (content, ctx) => enrichAboutSection(content, ctx),
  faq: (content, ctx) => enrichFaqSection(content, ctx),
};

export async function enrichSections(request: EnrichmentRequest): Promise<EnrichmentResult> {
  const start = Date.now();
  const totalTokens = { input: 0, output: 0 };
  const enrichments: SectionEnrichment[] = [];

  const context = {
    businessName: request.businessName,
    niche: request.nicheContext.niche,
    city: request.nicheContext.city,
    state: request.nicheContext.state,
    tone: request.tone,
  };

  for (const target of request.sections) {
    const enricher = SECTION_ENRICHERS[target.sectionType];

    if (!enricher) {
      enrichments.push(noOpEnrichment(target.sectionType, target.currentContent));
      continue;
    }

    const { enrichment, tokens } = await enricher(target.currentContent, context);
    enrichments.push(enrichment);
    totalTokens.input += tokens.input;
    totalTokens.output += tokens.output;
  }

  return {
    slug: request.slug,
    enrichments,
    tokensUsed: totalTokens,
    durationMs: Date.now() - start,
    enrichedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Convenience function
// ---------------------------------------------------------------------------

const MIN_DESCRIPTION_LENGTH = 200;
const ENRICHABLE_SECTION_TYPES = new Set(["hero", "about", "faq"]);

function shouldEnrichSection(section: LandingPageSection): boolean {
  if (!ENRICHABLE_SECTION_TYPES.has(section.type)) return false;

  if (section.type === "about") {
    const description = typeof section.content.description === "string"
      ? section.content.description
      : "";
    return description.length < MIN_DESCRIPTION_LENGTH;
  }

  if (section.type === "faq") {
    const items = Array.isArray(section.content.items) ? section.content.items : [];
    return items.some(
      (item: Record<string, unknown>) =>
        typeof item.answer === "string" && item.answer.length < 50,
    );
  }

  return true;
}

export async function enrichLandingPage(
  slug: string,
  tone?: string,
): Promise<EnrichmentResult | null> {
  const page = await getLandingPage(slug);
  if (!page) return null;

  const targets: EnrichmentTarget[] = page.sections
    .filter(shouldEnrichSection)
    .map((section) => ({
      sectionType: section.type,
      currentContent: section.content,
    }));

  if (targets.length === 0) {
    return {
      slug,
      enrichments: [],
      tokensUsed: { input: 0, output: 0 },
      durationMs: 0,
      enrichedAt: new Date().toISOString(),
    };
  }

  const result = await enrichSections({
    slug,
    sections: targets,
    nicheContext: {
      niche: page.niche,
      industry: page.industry,
      city: page.geo.city,
      state: page.geo.state,
    },
    businessName: page.businessName,
    tone: tone as EnrichmentRequest["tone"],
  });

  const enrichedSections = page.sections.map((section) => {
    const enrichment = result.enrichments.find(
      (e) => e.sectionType === section.type && e.changed,
    );
    if (!enrichment) return section;
    return { ...section, content: enrichment.enriched };
  });

  const updated: GeneratedLandingPage = {
    ...page,
    sections: enrichedSections,
    version: page.version + 1,
    updatedAt: new Date().toISOString(),
  };

  await saveLandingPage(updated);

  return result;
}
