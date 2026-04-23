// ---------------------------------------------------------------------------
// Dynamic Customer Intelligence Generator
//
// For niches that weren't pre-anticipated, this module generates a complete
// CustomerIntelligenceProfile by:
//
// 1. Detecting the closest industry category via keyword matching
// 2. Using the base category's intelligence as a scaffold
// 3. Interpolating niche-specific language into every field
// 4. Optionally enriching with AI if API key is available
// 5. Caching the result for future requests
//
// This means "mobile dog grooming" or "solar panel installation" or
// "yacht charter management" all get full intelligence profiles automatically.
// ---------------------------------------------------------------------------

import { detectIndustryCategory } from "./niche-generator.ts";
import {
  CUSTOMER_INTELLIGENCE,
  type CustomerIntelligenceProfile,
  type BuyingTrigger,
  type ObjectionEntry,
  type DecisionJourney,
  type TrustSignalProfile,
  type ConversionPsychology,
  type CompetitorAwareness,
  type ContentConversionMap,
  type IdealCustomerProfile,
} from "./customer-intelligence.ts";
import { LruCache } from "./lru-cache.ts";

// Cache generated profiles so we don't regenerate on every request
const profileCache = new LruCache<string, CustomerIntelligenceProfile>({
  maxSize: 500,
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
});

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function interpolate(template: string, niche: string): string {
  return template
    .replace(/\{\{niche\}\}/g, niche)
    .replace(/\{\{Niche\}\}/g, titleCase(niche));
}

function interpolateIcp(base: IdealCustomerProfile, nicheName: string): IdealCustomerProfile {
  return {
    ...base,
    title: base.title.includes("{{") ? interpolate(base.title, nicheName) : base.title,
    role: base.role.includes("{{") ? interpolate(base.role, nicheName) : `Manages operations and growth for ${nicheName} businesses`,
    industries: [titleCase(nicheName), ...base.industries.slice(0, 3)],
  };
}

function interpolateTriggers(base: BuyingTrigger[], nicheName: string): BuyingTrigger[] {
  return base.map((trigger) => ({
    ...trigger,
    event: trigger.event.includes("{{")
      ? interpolate(trigger.event, nicheName)
      : trigger.event.replace(
          /service|legal|health|tech|construction|real estate|education|finance|franchise|staffing|faith|creative/gi,
          nicheName,
        ),
    searchBehavior: trigger.searchBehavior.replace(
      /service|legal|health|tech|construction|real estate|education|finance|franchise|staffing|faith|creative/gi,
      nicheName,
    ),
    emotionalState: trigger.emotionalState,
  }));
}

function interpolateObjections(base: ObjectionEntry[], nicheName: string): ObjectionEntry[] {
  return base.map((obj) => ({
    ...obj,
    objection: obj.objection,
    underlyingFear: obj.underlyingFear,
    evidenceBasedResponse: obj.evidenceBasedResponse.replace(
      /{{niche}}/g,
      nicheName,
    ),
  }));
}

function interpolateJourney(base: DecisionJourney, nicheName: string): DecisionJourney {
  return {
    ...base,
    stages: base.stages.map((stage) => ({
      ...stage,
      contentNeeded: stage.contentNeeded.replace(
        /service|legal|health|tech|construction|real estate|education|finance|franchise|staffing|faith|creative/gi,
        nicheName,
      ),
      dropOffRisk: stage.dropOffRisk.replace(
        /service|legal|health|tech|construction|real estate|education|finance|franchise|staffing|faith|creative/gi,
        nicheName,
      ),
    })),
  };
}

function interpolateTrust(base: TrustSignalProfile, nicheName: string): TrustSignalProfile {
  const replace = (s: string) =>
    s.replace(
      /contractors|attorneys|practices|agents|companies|agencies|firms|churches|studios/gi,
      `${nicheName} businesses`,
    );
  return {
    ...base,
    primary: base.primary.map(replace),
    secondary: base.secondary.map(replace),
    dealbreakers: base.dealbreakers,
    certificationsThatMatter: base.certificationsThatMatter,
    socialProofPreference: base.socialProofPreference,
  };
}

function interpolateCompetitors(base: CompetitorAwareness, nicheName: string): CompetitorAwareness {
  return {
    ...base,
    differentiators: [
      `Multi-niche support — handles ${nicheName} alongside any other vertical`,
      "AI-powered lead scoring (4 dimensions: intent, fit, engagement, urgency)",
      `Niche auto-config — deploy a complete ${nicheName} system from one keyword`,
      "Lead marketplace for buying/selling scored leads",
      ...base.differentiators.slice(0, 2),
    ],
    switchingCosts: base.switchingCosts || "Low — most businesses in this niche use scattered tools",
  };
}

function interpolateContentMap(base: ContentConversionMap[], nicheName: string): ContentConversionMap[] {
  return base.map((entry) => ({
    ...entry,
    topic: entry.topic.replace(/\{\{niche\}\}/g, nicheName).replace(/\{\{Niche\}\}/g, titleCase(nicheName)),
  }));
}

// ---------------------------------------------------------------------------
// Core: Generate intelligence for ANY niche
// ---------------------------------------------------------------------------

export function generateDynamicIntelligence(
  nicheName: string,
  keywords?: string[],
): CustomerIntelligenceProfile {
  const slug = nicheName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  // Check cache first
  const cached = profileCache.get(slug);
  if (cached) return cached;

  // Check if we have an exact match in pre-built profiles
  if (CUSTOMER_INTELLIGENCE[slug]) {
    return CUSTOMER_INTELLIGENCE[slug]!;
  }

  // Detect closest industry category
  const category = detectIndustryCategory(nicheName, keywords);
  const base = CUSTOMER_INTELLIGENCE[category] ?? CUSTOMER_INTELLIGENCE.general!;

  // Generate interpolated profile
  const profile: CustomerIntelligenceProfile = {
    niche: slug,
    nicheLabel: titleCase(nicheName),
    lastUpdated: new Date().toISOString().split("T")[0]!,
    icp: interpolateIcp(base.icp, nicheName),
    buyingTriggers: interpolateTriggers(base.buyingTriggers, nicheName),
    decisionJourney: interpolateJourney(base.decisionJourney, nicheName),
    objections: interpolateObjections(base.objections, nicheName),
    trustSignals: interpolateTrust(base.trustSignals, nicheName),
    conversionPsychology: {
      ...base.conversionPsychology,
      priceAnchor: `Compare the cost of the platform to the value of one new ${nicheName} customer. If one customer covers the monthly fee, you're profitable from month one.`,
    },
    competitors: interpolateCompetitors(base.competitors, nicheName),
    contentMap: interpolateContentMap(base.contentMap, nicheName),
  };

  // Cache the generated profile
  profileCache.set(slug, profile);

  return profile;
}

// ---------------------------------------------------------------------------
// AI-Enhanced Intelligence (when API key is available)
// ---------------------------------------------------------------------------

export interface AiEnrichmentResult {
  enriched: boolean;
  source: "ai" | "template" | "cached";
  profile: CustomerIntelligenceProfile;
}

export async function enrichWithAi(
  nicheName: string,
  baseProfile: CustomerIntelligenceProfile,
): Promise<AiEnrichmentResult> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;

  if (!apiKey) {
    return { enriched: false, source: "template", profile: baseProfile };
  }

  try {
    const prompt = buildAiPrompt(nicheName, baseProfile);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a B2B customer research analyst. Generate factual, specific buyer intelligence for the given business niche. Return valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return { enriched: false, source: "template", profile: baseProfile };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { enriched: false, source: "template", profile: baseProfile };
    }

    const aiData = JSON.parse(content) as Partial<{
      buyingTriggers: Array<{ event: string; urgency: string; searchBehavior: string; emotionalState: string }>;
      objections: Array<{ objection: string; underlyingFear: string; response: string }>;
      competitors: string[];
      differentiators: string[];
    }>;

    // Merge AI data into base profile
    const enrichedProfile: CustomerIntelligenceProfile = {
      ...baseProfile,
      buyingTriggers: aiData.buyingTriggers
        ? aiData.buyingTriggers.map((t) => ({
            event: t.event,
            urgency: (t.urgency as BuyingTrigger["urgency"]) ?? "this-quarter",
            searchBehavior: t.searchBehavior,
            emotionalState: t.emotionalState,
          }))
        : baseProfile.buyingTriggers,
      objections: aiData.objections
        ? aiData.objections.map((o) => ({
            objection: o.objection,
            underlyingFear: o.underlyingFear,
            evidenceBasedResponse: o.response,
            proofType: "case-study" as const,
          }))
        : baseProfile.objections,
      competitors: {
        ...baseProfile.competitors,
        alternatives: aiData.competitors ?? baseProfile.competitors.alternatives,
        differentiators: aiData.differentiators ?? baseProfile.competitors.differentiators,
      },
    };

    // Cache the enriched profile
    profileCache.set(baseProfile.niche, enrichedProfile);

    return { enriched: true, source: "ai", profile: enrichedProfile };
  } catch {
    return { enriched: false, source: "template", profile: baseProfile };
  }
}

function buildAiPrompt(nicheName: string, baseProfile: CustomerIntelligenceProfile): string {
  return `Generate customer intelligence for the "${nicheName}" business niche.

The base industry category is "${baseProfile.niche}" but I need SPECIFIC data for "${nicheName}".

Return a JSON object with these fields:

{
  "buyingTriggers": [
    {
      "event": "A specific event that causes a ${nicheName} business owner to search for a solution RIGHT NOW",
      "urgency": "immediate" or "this-quarter" or "this-year",
      "searchBehavior": "What they actually Google when this happens",
      "emotionalState": "How they feel when this trigger hits (be specific and empathetic)"
    }
  ],
  "objections": [
    {
      "objection": "The exact words a ${nicheName} business owner says when hesitating",
      "underlyingFear": "The real fear behind the objection",
      "response": "An evidence-based response that addresses the fear, not just the surface objection"
    }
  ],
  "competitors": ["List 4-6 actual tools or services that ${nicheName} businesses currently use"],
  "differentiators": ["List 3-4 specific reasons LeadOS is better for ${nicheName} than the alternatives"]
}

Generate 4-5 buying triggers, 3-4 objections, 4-6 competitors, and 3-4 differentiators.
Be factual and specific to ${nicheName}. Use real search terms and real competitor names where possible.`;
}

// ---------------------------------------------------------------------------
// Unified accessor: handles both pre-built and dynamic niches
// ---------------------------------------------------------------------------

export function getIntelligenceForAnyNiche(
  nicheName: string,
  keywords?: string[],
): CustomerIntelligenceProfile {
  const slug = nicheName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  // 1. Exact match in pre-built profiles
  if (CUSTOMER_INTELLIGENCE[slug]) {
    return CUSTOMER_INTELLIGENCE[slug]!;
  }

  // 2. Generate dynamically
  return generateDynamicIntelligence(nicheName, keywords);
}

export async function getEnrichedIntelligenceForAnyNiche(
  nicheName: string,
  keywords?: string[],
): Promise<AiEnrichmentResult> {
  const base = getIntelligenceForAnyNiche(nicheName, keywords);

  // If it's a pre-built profile, return as-is (already high quality)
  if (CUSTOMER_INTELLIGENCE[base.niche]) {
    return { enriched: false, source: "cached", profile: base };
  }

  // For dynamic profiles, try AI enrichment
  return enrichWithAi(nicheName, base);
}

// ---------------------------------------------------------------------------
// Cache management
// ---------------------------------------------------------------------------

export function getCacheSize(): number {
  return profileCache.size;
}

export function clearCache(): void {
  profileCache.clear();
}

export function getCachedNiches(): string[] {
  return [...profileCache.keys()];
}
