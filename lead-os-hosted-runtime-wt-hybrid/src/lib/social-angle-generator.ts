import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TargetEmotion =
  | "fear"
  | "desire"
  | "curiosity"
  | "anger"
  | "hope"
  | "shame"
  | "pride"
  | "urgency"
  | "fomo"
  | "relief";

export interface ContentAngle {
  id: string;
  hook: string;
  bodyOutline: string[];
  cta: string;
  targetEmotion: TargetEmotion;
  controversyScore: number;
  shareabilityScore: number;
  topic: string;
  niche: string;
  generatedAt: string;
}

export interface AngleGeneratorConfig {
  topic: string;
  niche: string;
  count?: number;
  minControversy?: number;
  maxControversy?: number;
}

// ---------------------------------------------------------------------------
// Niche psychology profiles
// ---------------------------------------------------------------------------

interface NicheProfile {
  painPoints: string[];
  desires: string[];
  objections: string[];
  triggerWords: string[];
}

const NICHE_PROFILES: Record<string, NicheProfile> = {
  "pest-control": {
    painPoints: ["infestations spreading despite treatment", "children exposed to harmful chemicals", "landlord ignoring pest complaints"],
    desires: ["pest-free home guaranteed", "safe and non-toxic solutions", "sleep without fear of bugs"],
    objections: ["too expensive", "DIY works fine", "pests always come back"],
    triggerWords: ["infestation", "health hazard", "guaranteed", "family-safe"],
  },
  "real-estate": {
    painPoints: ["house sitting on market for months", "losing bidding wars", "hidden fees at closing"],
    desires: ["sell fast above asking", "find dream home", "build wealth through property"],
    objections: ["agent fees too high", "bad market timing", "can sell without an agent"],
    triggerWords: ["equity", "appreciation", "off-market", "pre-approved"],
  },
  "dental": {
    painPoints: ["dental anxiety preventing care", "insurance gaps", "embarrassed to smile"],
    desires: ["confident smile", "pain-free experience", "affordable treatment"],
    objections: ["too expensive", "fear of pain", "no time"],
    triggerWords: ["painless", "affordable", "smile transformation", "same-day"],
  },
  "immigration-law": {
    painPoints: ["visa denial after months of waiting", "family separation", "deportation fear"],
    desires: ["permanent residency", "work authorization", "family reunification"],
    objections: ["lawyers cost too much", "process takes forever", "can file myself"],
    triggerWords: ["approved", "reunited", "legal status", "path to citizenship"],
  },
  "roofing": {
    painPoints: ["leaks after every storm", "insurance claim denied", "contractor ghosted"],
    desires: ["leak-free warranty", "insurance claim paid", "reliable contractor"],
    objections: ["too expensive", "can patch it myself", "all roofers are scammers"],
    triggerWords: ["warranty", "free inspection", "storm damage", "insurance covered"],
  },
};

const FALLBACK_PROFILE: NicheProfile = {
  painPoints: ["wasting money on bad solutions", "overwhelmed by choices", "not seeing results"],
  desires: ["proven results", "clear path forward", "trusted expert"],
  objections: ["too expensive", "tried before and failed", "can figure it out alone"],
  triggerWords: ["guaranteed", "proven", "results", "free"],
};

function getNicheProfile(niche: string): NicheProfile {
  const normalized = niche.toLowerCase().replace(/\s+/g, "-");
  return NICHE_PROFILES[normalized] ?? FALLBACK_PROFILE;
}

// ---------------------------------------------------------------------------
// Angle templates
// ---------------------------------------------------------------------------

interface AngleTemplate {
  hookTemplate: string;
  bodyTemplate: string[];
  ctaTemplate: string;
  emotion: TargetEmotion;
  baseControversy: number;
  baseShareability: number;
}

const ANGLE_TEMPLATES: AngleTemplate[] = [
  {
    hookTemplate: "The {niche} industry does NOT want you to know this about {topic}",
    bodyTemplate: ["Expose the hidden truth", "Show evidence with real examples", "Explain why insiders keep quiet", "Reveal the alternative approach"],
    ctaTemplate: "Comment 'TRUTH' to get our free {niche} guide",
    emotion: "anger",
    baseControversy: 0.8,
    baseShareability: 0.85,
  },
  {
    hookTemplate: "I spent $50K learning this {topic} lesson so you don't have to",
    bodyTemplate: ["Share the expensive mistake", "Break down what went wrong", "Show the pivot that worked", "Reveal the ROI after fixing it"],
    ctaTemplate: "Save yourself the money — DM '{topic}' for our free checklist",
    emotion: "fear",
    baseControversy: 0.3,
    baseShareability: 0.75,
  },
  {
    hookTemplate: "Stop doing {topic} wrong — here's what actually works in {niche}",
    bodyTemplate: ["Call out the common mistake", "Explain why everyone does it", "Present the correct approach", "Show before and after results"],
    ctaTemplate: "Follow for more {niche} tips that actually work",
    emotion: "curiosity",
    baseControversy: 0.5,
    baseShareability: 0.7,
  },
  {
    hookTemplate: "Why 90% of people fail at {topic} in {niche}",
    bodyTemplate: ["Present the shocking statistic", "Identify the root cause", "Contrast with the top 10%", "Give the actionable framework"],
    ctaTemplate: "Be in the top 10% — link in bio for the full framework",
    emotion: "fomo",
    baseControversy: 0.4,
    baseShareability: 0.8,
  },
  {
    hookTemplate: "My client went from struggling to thriving with {topic} — here's exactly how",
    bodyTemplate: ["Set the scene with the before state", "Describe the turning point", "Walk through each step of the transformation", "Reveal the final result with numbers"],
    ctaTemplate: "Want the same results? DM 'RESULTS' to start",
    emotion: "hope",
    baseControversy: 0.15,
    baseShareability: 0.65,
  },
  {
    hookTemplate: "Unpopular opinion: {topic} is broken and here's proof",
    bodyTemplate: ["State the contrarian position", "Back it up with data or examples", "Address the inevitable pushback", "Offer the better alternative"],
    ctaTemplate: "Agree or disagree? Drop your take in the comments",
    emotion: "anger",
    baseControversy: 0.9,
    baseShareability: 0.9,
  },
  {
    hookTemplate: "The 3-step {topic} system that changed everything for my {niche} clients",
    bodyTemplate: ["Introduce the framework name", "Step 1 with example", "Step 2 with example", "Step 3 with example", "Show combined results"],
    ctaTemplate: "Get the full system — comment 'SYSTEM' below",
    emotion: "desire",
    baseControversy: 0.1,
    baseShareability: 0.6,
  },
  {
    hookTemplate: "If you're still {painPoint}, you need to hear this about {topic}",
    bodyTemplate: ["Validate the pain", "Explain why current approach fails", "Introduce the paradigm shift", "Give one quick win to try today"],
    ctaTemplate: "Ready to fix this for good? Tap the link in bio",
    emotion: "shame",
    baseControversy: 0.45,
    baseShareability: 0.7,
  },
  {
    hookTemplate: "This {topic} hack saved my {niche} client $10K last month",
    bodyTemplate: ["Set up the problem and cost", "Reveal the counterintuitive solution", "Show the implementation steps", "Break down the savings math"],
    ctaTemplate: "Want to save too? DM 'SAVE' for personalized advice",
    emotion: "desire",
    baseControversy: 0.2,
    baseShareability: 0.75,
  },
  {
    hookTemplate: "WARNING: this {topic} mistake is costing {niche} businesses thousands",
    bodyTemplate: ["Describe the mistake in detail", "Show how much it costs per year", "Explain why most people don't notice", "Give the fix in 3 steps"],
    ctaTemplate: "Don't lose another dollar — get our free audit in bio",
    emotion: "fear",
    baseControversy: 0.35,
    baseShareability: 0.7,
  },
  {
    hookTemplate: "I asked 100 {niche} experts about {topic} — their answers shocked me",
    bodyTemplate: ["Share the survey setup", "Reveal the most surprising finding", "Contrast expert opinion vs public belief", "Draw actionable conclusions"],
    ctaTemplate: "Which finding surprised you most? Comment below",
    emotion: "curiosity",
    baseControversy: 0.3,
    baseShareability: 0.85,
  },
  {
    hookTemplate: "Your competitors are already doing this with {topic} — are you?",
    bodyTemplate: ["Show what top performers do differently", "Reveal the competitive gap", "Provide the playbook to catch up", "Set the urgency timeline"],
    ctaTemplate: "Don't fall behind — follow for daily {niche} insights",
    emotion: "urgency",
    baseControversy: 0.25,
    baseShareability: 0.65,
  },
];

// ---------------------------------------------------------------------------
// Core generation
// ---------------------------------------------------------------------------

function interpolateTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

function addNoise(base: number, range: number): number {
  const noise = (Math.random() - 0.5) * 2 * range;
  return Math.max(0, Math.min(1, Number((base + noise).toFixed(2))));
}

export function generateAngles(config: AngleGeneratorConfig): ContentAngle[] {
  const { topic, niche, count = 10, minControversy = 0, maxControversy = 1 } = config;
  const profile = getNicheProfile(niche);
  const targetCount = Math.max(10, count);

  const vars: Record<string, string> = {
    topic,
    niche,
    painPoint: profile.painPoints[0],
  };

  const angles: ContentAngle[] = [];
  let templateIdx = 0;

  while (angles.length < targetCount) {
    const template = ANGLE_TEMPLATES[templateIdx % ANGLE_TEMPLATES.length];

    const painIdx = templateIdx % profile.painPoints.length;
    vars.painPoint = profile.painPoints[painIdx];

    const controversy = addNoise(template.baseControversy, 0.1);
    if (controversy < minControversy || controversy > maxControversy) {
      templateIdx += 1;
      if (templateIdx > targetCount * 3) break;
      continue;
    }

    const angle: ContentAngle = {
      id: crypto.randomUUID(),
      hook: interpolateTemplate(template.hookTemplate, vars),
      bodyOutline: template.bodyTemplate.map((line) => interpolateTemplate(line, vars)),
      cta: interpolateTemplate(template.ctaTemplate, vars),
      targetEmotion: template.emotion,
      controversyScore: controversy,
      shareabilityScore: addNoise(template.baseShareability, 0.1),
      topic,
      niche,
      generatedAt: new Date().toISOString(),
    };

    angles.push(angle);
    templateIdx += 1;
  }

  return angles;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const angleStore = new Map<string, ContentAngle[]>();

export function storeAngles(tenantId: string, angles: ContentAngle[]): void {
  const existing = angleStore.get(tenantId) ?? [];
  existing.push(...angles);
  angleStore.set(tenantId, existing);
}

export function getStoredAngles(tenantId: string): ContentAngle[] {
  return angleStore.get(tenantId) ?? [];
}

export function getAngleById(tenantId: string, angleId: string): ContentAngle | undefined {
  const angles = angleStore.get(tenantId) ?? [];
  return angles.find((a) => a.id === angleId);
}

export function _resetStores(): void {
  angleStore.clear();
}
