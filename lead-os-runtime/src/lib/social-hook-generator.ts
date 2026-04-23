import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HookPlatform = "tiktok" | "instagram" | "youtube" | "linkedin" | "x" | "threads";

export type HookType =
  | "question"
  | "statistic"
  | "story"
  | "contrarian"
  | "curiosity-gap"
  | "fear"
  | "desire";

export interface Hook {
  id: string;
  text: string;
  type: HookType;
  platform: HookPlatform;
  characterCount: number;
  estimatedEngagement: number;
  generatedAt: string;
}

export interface HookGeneratorConfig {
  topic: string;
  niche: string;
  platforms: HookPlatform[];
  hookTypes?: HookType[];
  count?: number;
}

// ---------------------------------------------------------------------------
// Platform constraints
// ---------------------------------------------------------------------------

interface PlatformConstraint {
  maxChars: number;
  idealChars: number;
  engagementMultiplier: number;
}

const PLATFORM_CONSTRAINTS: Record<HookPlatform, PlatformConstraint> = {
  tiktok: { maxChars: 150, idealChars: 80, engagementMultiplier: 1.2 },
  instagram: { maxChars: 150, idealChars: 100, engagementMultiplier: 1.0 },
  youtube: { maxChars: 100, idealChars: 60, engagementMultiplier: 1.1 },
  linkedin: { maxChars: 300, idealChars: 150, engagementMultiplier: 0.8 },
  x: { maxChars: 280, idealChars: 120, engagementMultiplier: 0.9 },
  threads: { maxChars: 500, idealChars: 200, engagementMultiplier: 0.85 },
};

// ---------------------------------------------------------------------------
// Hook templates by type
// ---------------------------------------------------------------------------

interface HookTemplate {
  template: string;
  type: HookType;
  baseEngagement: number;
}

const HOOK_TEMPLATES: HookTemplate[] = [
  // question
  { template: "What if everything you know about {topic} is wrong?", type: "question", baseEngagement: 0.72 },
  { template: "Why do 90% of {niche} businesses fail at {topic}?", type: "question", baseEngagement: 0.68 },
  { template: "Have you ever wondered why {topic} never works the way they promise?", type: "question", baseEngagement: 0.65 },
  // statistic
  { template: "73% of {niche} businesses lose money on {topic} — here's why", type: "statistic", baseEngagement: 0.74 },
  { template: "{topic} costs the average {niche} business $47K per year in lost revenue", type: "statistic", baseEngagement: 0.7 },
  { template: "Only 3% of {niche} businesses get {topic} right — here's what they do differently", type: "statistic", baseEngagement: 0.76 },
  // story
  { template: "My client lost everything because of one {topic} mistake", type: "story", baseEngagement: 0.78 },
  { template: "I was broke, desperate, and about to quit {niche} — then I discovered this about {topic}", type: "story", baseEngagement: 0.75 },
  { template: "A {niche} owner called me crying about {topic} — what happened next changed everything", type: "story", baseEngagement: 0.8 },
  // contrarian
  { template: "Unpopular opinion: {topic} is the biggest scam in {niche}", type: "contrarian", baseEngagement: 0.82 },
  { template: "Everyone is wrong about {topic} and I can prove it", type: "contrarian", baseEngagement: 0.79 },
  { template: "Stop listening to {niche} gurus about {topic} — they are lying to you", type: "contrarian", baseEngagement: 0.81 },
  // curiosity-gap
  { template: "The {topic} secret that {niche} experts refuse to share", type: "curiosity-gap", baseEngagement: 0.77 },
  { template: "There's a reason nobody talks about this {topic} strategy in {niche}", type: "curiosity-gap", baseEngagement: 0.73 },
  { template: "I'm about to reveal the {topic} truth that could get me canceled in {niche}", type: "curiosity-gap", baseEngagement: 0.84 },
  // fear
  { template: "If you're ignoring {topic}, your {niche} business is already dying", type: "fear", baseEngagement: 0.71 },
  { template: "This {topic} mistake will bankrupt your {niche} business by next year", type: "fear", baseEngagement: 0.69 },
  { template: "Your {niche} competitors are using {topic} against you right now", type: "fear", baseEngagement: 0.73 },
  // desire
  { template: "How to 10x your {niche} business with one simple {topic} change", type: "desire", baseEngagement: 0.67 },
  { template: "The {topic} framework that built a 7-figure {niche} business in 12 months", type: "desire", baseEngagement: 0.72 },
  { template: "Imagine never worrying about {topic} in your {niche} business again", type: "desire", baseEngagement: 0.64 },
];

// ---------------------------------------------------------------------------
// Core generation
// ---------------------------------------------------------------------------

function interpolate(template: string, topic: string, niche: string): string {
  return template
    .replace(/\{topic\}/g, topic)
    .replace(/\{niche\}/g, niche);
}

function truncateToLimit(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + "...";
}

function calculateEngagement(base: number, charCount: number, constraint: PlatformConstraint): number {
  const lengthPenalty = charCount > constraint.idealChars
    ? Math.max(0.7, 1 - (charCount - constraint.idealChars) / (constraint.maxChars * 2))
    : 1.0;
  const score = base * constraint.engagementMultiplier * lengthPenalty;
  return Number(Math.max(0, Math.min(1, score)).toFixed(2));
}

export function generateHooks(config: HookGeneratorConfig): Hook[] {
  const { topic, niche, platforms, hookTypes, count = 3 } = config;
  const allowedTypes = hookTypes ?? (["question", "statistic", "story", "contrarian", "curiosity-gap", "fear", "desire"] as HookType[]);

  const hooks: Hook[] = [];

  for (const platform of platforms) {
    const constraint = PLATFORM_CONSTRAINTS[platform];
    const filtered = HOOK_TEMPLATES.filter((t) => allowedTypes.includes(t.type));
    let generated = 0;
    let idx = 0;

    while (generated < count && idx < filtered.length * 2) {
      const template = filtered[idx % filtered.length];
      const rawText = interpolate(template.template, topic, niche);
      const text = truncateToLimit(rawText, constraint.maxChars);
      const charCount = text.length;

      hooks.push({
        id: crypto.randomUUID(),
        text,
        type: template.type,
        platform,
        characterCount: charCount,
        estimatedEngagement: calculateEngagement(template.baseEngagement, charCount, constraint),
        generatedAt: new Date().toISOString(),
      });

      generated += 1;
      idx += 1;
    }
  }

  return hooks;
}

export function getHooksByPlatform(hooks: Hook[]): Record<HookPlatform, Hook[]> {
  const grouped: Record<string, Hook[]> = {};
  for (const hook of hooks) {
    if (!grouped[hook.platform]) grouped[hook.platform] = [];
    grouped[hook.platform].push(hook);
  }
  return grouped as Record<HookPlatform, Hook[]>;
}

export function rankHooksByEngagement(hooks: Hook[]): Hook[] {
  return [...hooks].sort((a, b) => b.estimatedEngagement - a.estimatedEngagement);
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const hookStore = new Map<string, Hook[]>();

export function storeHooks(tenantId: string, hooks: Hook[]): void {
  const existing = hookStore.get(tenantId) ?? [];
  existing.push(...hooks);
  hookStore.set(tenantId, existing);
}

export function getStoredHooks(tenantId: string): Hook[] {
  return hookStore.get(tenantId) ?? [];
}

export function _resetStores(): void {
  hookStore.clear();
}
