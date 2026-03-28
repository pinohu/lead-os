// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContentType = "viral" | "conversion";
export type ReachEstimate = "low" | "medium" | "high";
export type HookStyle = "question" | "shock" | "story" | "statistic" | "contrarian";
export type VisualType = "talking-head" | "text-overlay" | "b-roll" | "screenshot" | "animation";

export type Platform =
  | "tiktok"
  | "instagram-reels"
  | "youtube-shorts"
  | "youtube-long"
  | "linkedin"
  | "x"
  | "facebook";

export interface ContentAngle {
  id: string;
  type: ContentType;
  hook: string;
  premise: string;
  targetEmotion: string;
  estimatedReach: ReachEstimate;
}

export interface Hook {
  text: string;
  style: HookStyle;
  estimatedCTR: number;
}

export interface Scene {
  text: string;
  duration: number;
  visualType: VisualType;
}

export interface Script {
  scenes: Scene[];
  totalDuration: number;
  cta: string;
  hashtags: string[];
}

export interface PlatformAsset {
  platform: Platform;
  hook: Hook;
  script: Script;
  angle: ContentAngle;
}

export interface ContentBatch {
  id: string;
  topic: string;
  niche: string;
  generatedAt: string;
  angles: ContentAngle[];
  assets: PlatformAsset[];
}

export interface SplitBatch {
  viral: PlatformAsset[];
  conversion: PlatformAsset[];
}

// ---------------------------------------------------------------------------
// Niche data
// ---------------------------------------------------------------------------

interface NicheData {
  painPoints: string[];
  desiredOutcomes: string[];
  hashtagSets: string[][];
}

const NICHE_DATA: Record<string, NicheData> = {
  "pest-control": {
    painPoints: [
      "roaches in kitchen despite spraying",
      "mice coming back every winter",
      "termites destroying the house silently",
      "bed bugs spreading after DIY treatment fails",
      "wasps nesting near kids play area",
    ],
    desiredOutcomes: [
      "pest-free home guaranteed",
      "protect property value",
      "keep family safe from disease-carrying pests",
      "sleep without worrying about bugs",
    ],
    hashtagSets: [
      ["#pestcontrol", "#pestfree", "#homesafety", "#exterminator", "#bugs"],
      ["#pestcontrollife", "#rodentcontrol", "#bedbugfree", "#termiteinspection"],
    ],
  },
  "immigration-law": {
    painPoints: [
      "visa denial after waiting months",
      "green card stuck in processing limbo",
      "family separation due to immigration status",
      "deportation fear keeping family up at night",
      "work authorization expiring with no clear path",
    ],
    desiredOutcomes: [
      "permanent residency for the whole family",
      "work legally without fear",
      "bring spouse and children to the US",
      "clear path to citizenship",
    ],
    hashtagSets: [
      ["#immigrationlaw", "#visahelp", "#greencard", "#immigration", "#citizenship"],
      ["#immigrationattorney", "#usavisa", "#naturalization", "#workvisa"],
    ],
  },
  "roofing": {
    painPoints: [
      "roof leaking after every storm",
      "insurance claim denied for roof damage",
      "missing shingles causing interior water damage",
      "contractor ghosted after taking deposit",
      "skyrocketing energy bills from poor roof insulation",
    ],
    desiredOutcomes: [
      "leak-free roof backed by warranty",
      "insurance claim approved and paid",
      "energy-efficient home with lower bills",
      "reliable contractor who shows up",
    ],
    hashtagSets: [
      ["#roofing", "#roofreplacement", "#roofinspection", "#roofrepair", "#contractor"],
      ["#roofer", "#newroof", "#roofingcompany", "#hailrepair", "#roofinglife"],
    ],
  },
  "real-estate": {
    painPoints: [
      "house sitting on market for months without offers",
      "losing bidding wars on every home",
      "hidden fees eating into closing proceeds",
      "bad tenants destroying rental property",
      "overleveraged and cash flow negative",
    ],
    desiredOutcomes: [
      "sell fast and above asking price",
      "buy dream home without overpaying",
      "passive income from rental portfolio",
      "retire early on real estate cash flow",
    ],
    hashtagSets: [
      ["#realestate", "#realestateagent", "#homeselling", "#homebuying", "#realestateinvesting"],
      ["#property", "#househunting", "#investinrealestate", "#passiveincome", "#realtor"],
    ],
  },
  "staffing": {
    painPoints: [
      "spending weeks interviewing candidates who ghost",
      "bad hire costing tens of thousands",
      "HR drowning in compliance paperwork",
      "high turnover destroying team morale",
      "open roles sitting empty for 90+ days",
    ],
    desiredOutcomes: [
      "hire A-players in under two weeks",
      "reduce turnover by 50 percent",
      "offload compliance risk to experts",
      "scale headcount without scaling HR chaos",
    ],
    hashtagSets: [
      ["#staffing", "#hiring", "#recruitment", "#hr", "#talentacquisition"],
      ["#jobmarket", "#workforcesolutions", "#staffingagency", "#hiring2026"],
    ],
  },
  "home-services": {
    painPoints: [
      "HVAC failing in the middle of summer",
      "contractor no-shows wasting entire days",
      "overpriced quotes with no transparency",
      "DIY repair making the problem worse",
      "water heater dying unexpectedly",
    ],
    desiredOutcomes: [
      "reliable service with upfront pricing",
      "home running smoothly year-round",
      "vetted professionals who show up on time",
      "peace of mind with a service guarantee",
    ],
    hashtagSets: [
      ["#homeservices", "#hvac", "#plumber", "#electrician", "#handyman"],
      ["#homerepair", "#homeimprovement", "#contractor", "#homerenovation"],
    ],
  },
  "dental": {
    painPoints: [
      "dental anxiety preventing necessary care",
      "insurance not covering needed procedures",
      "embarrassed to smile in photos",
      "pain waking up in the night from toothache",
      "kids refusing to go to the dentist",
    ],
    desiredOutcomes: [
      "confident, pain-free smile",
      "affordable care that fits the budget",
      "anxiety-free dental experience",
      "healthy teeth for the whole family",
    ],
    hashtagSets: [
      ["#dental", "#dentist", "#smile", "#oralhealth", "#dentistry"],
      ["#teethwhitening", "#invisalign", "#cosmeticdentistry", "#dentalhygiene"],
    ],
  },
  "insurance": {
    painPoints: [
      "claim denied after paying premiums for years",
      "premium increasing 40 percent at renewal",
      "unclear what policy actually covers",
      "underinsured and discovered it too late",
      "broker disappeared after selling the policy",
    ],
    desiredOutcomes: [
      "claim paid fast without hassle",
      "coverage that actually protects assets",
      "lower premiums without reducing coverage",
      "trusted advisor who explains options clearly",
    ],
    hashtagSets: [
      ["#insurance", "#lifeinsurance", "#homeinsurance", "#autoinsurance", "#insurance101"],
      ["#insuranceagent", "#financialprotection", "#insurancetips", "#coveragecheck"],
    ],
  },
};

const FALLBACK_NICHE: NicheData = {
  painPoints: [
    "wasting money on solutions that do not work",
    "overwhelmed by options and paralyzed by choice",
    "not seeing results despite consistent effort",
    "industry full of bad actors and empty promises",
    "stuck at the same level for too long",
  ],
  desiredOutcomes: [
    "clear path forward with proven results",
    "stop wasting time and money",
    "achieve the outcome that actually matters",
    "work with a trusted expert",
  ],
  hashtagSets: [
    ["#business", "#success", "#entrepreneur", "#growth", "#marketing"],
    ["#digitalmarketing", "#leadgeneration", "#businessgrowth"],
  ],
};

function getNicheData(niche: string): NicheData {
  const normalized = niche.toLowerCase().replace(/\s+/g, "-");
  return NICHE_DATA[normalized] ?? FALLBACK_NICHE;
}

// ---------------------------------------------------------------------------
// In-memory asset store
// ---------------------------------------------------------------------------

const generatedAssetStore = new Map<string, ContentBatch[]>();

export function getGeneratedAssets(tenantId: string): ContentBatch[] {
  return generatedAssetStore.get(tenantId) ?? [];
}

export function resetAssetStore(): void {
  generatedAssetStore.clear();
}

function storeAssets(tenantId: string, batch: ContentBatch): void {
  const existing = generatedAssetStore.get(tenantId) ?? [];
  existing.push(batch);
  generatedAssetStore.set(tenantId, existing);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0;

function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

interface AngleTemplate {
  hook: string;
  premise: string;
  targetEmotion: string;
  estimatedReach: ReachEstimate;
  type: ContentType;
}

const ANGLE_TEMPLATES: AngleTemplate[] = [
  {
    hook: "Nobody tells you this about {topic}",
    premise: "Reveal a counterintuitive truth that contradicts common belief",
    targetEmotion: "curiosity",
    estimatedReach: "high",
    type: "viral",
  },
  {
    hook: "I tried {topic} for 30 days - here is what happened",
    premise: "Personal experiment narrative with before and after outcome",
    targetEmotion: "intrigue",
    estimatedReach: "high",
    type: "viral",
  },
  {
    hook: "The {topic} mistake that cost me everything",
    premise: "Failure story with clear lesson that protects the audience",
    targetEmotion: "fear",
    estimatedReach: "medium",
    type: "viral",
  },
  {
    hook: "Why 90 percent of people fail at {topic}",
    premise: "Expose the root cause of failure and position your solution",
    targetEmotion: "validation",
    estimatedReach: "high",
    type: "conversion",
  },
  {
    hook: "Stop doing this if you care about {topic}",
    premise: "Pattern interrupt that calls out a common bad habit",
    targetEmotion: "urgency",
    estimatedReach: "medium",
    type: "viral",
  },
  {
    hook: "This {topic} trick changed everything for my clients",
    premise: "Social proof-backed insight that creates desire for the result",
    targetEmotion: "desire",
    estimatedReach: "medium",
    type: "conversion",
  },
  {
    hook: "{painPoint} is not your fault - here is what actually causes it",
    premise: "Reframe blame, build rapport, then present the real solution",
    targetEmotion: "relief",
    estimatedReach: "high",
    type: "viral",
  },
  {
    hook: "How I helped a client go from {problem} to {outcome} in 30 days",
    premise: "Client transformation story with specific, credible results",
    targetEmotion: "hope",
    estimatedReach: "medium",
    type: "conversion",
  },
  {
    hook: "The industry does not want you to know this about {topic}",
    premise: "Expose insider knowledge to build trust and authority",
    targetEmotion: "anger",
    estimatedReach: "high",
    type: "viral",
  },
  {
    hook: "3 questions to ask before hiring anyone for {topic}",
    premise: "Practical checklist that educates while positioning your expertise",
    targetEmotion: "empowerment",
    estimatedReach: "medium",
    type: "conversion",
  },
];

function interpolate(template: string, topic: string, nicheData: NicheData): string {
  const painPoint = nicheData.painPoints[0];
  const outcome = nicheData.desiredOutcomes[0];
  return template
    .replace(/\{topic\}/g, topic)
    .replace(/\{painPoint\}/g, painPoint)
    .replace(/\{problem\}/g, painPoint)
    .replace(/\{outcome\}/g, outcome);
}

function defaultDurationForPlatform(platform: Platform): number {
  switch (platform) {
    case "tiktok":
    case "instagram-reels":
      return 30;
    case "youtube-shorts":
      return 60;
    case "youtube-long":
      return 120;
    case "linkedin":
    case "x":
    case "facebook":
      return 0;
  }
}

function buildScenes(angle: ContentAngle, totalDuration: number): Scene[] {
  if (totalDuration === 0) {
    return [
      {
        text: angle.hook + "\n\n" + angle.premise,
        duration: 0,
        visualType: "text-overlay",
      },
    ];
  }

  const hookDuration = Math.round(totalDuration * 0.15);
  const problemDuration = Math.round(totalDuration * 0.25);
  const solutionDuration = Math.round(totalDuration * 0.35);
  const ctaDuration = totalDuration - hookDuration - problemDuration - solutionDuration;

  return [
    {
      text: angle.hook,
      duration: hookDuration,
      visualType: "talking-head",
    },
    {
      text: "Here is the problem most people face: " + angle.premise,
      duration: problemDuration,
      visualType: "b-roll",
    },
    {
      text: "The solution comes down to understanding the root cause and acting on it intentionally.",
      duration: solutionDuration,
      visualType: "text-overlay",
    },
    {
      text: "If this resonated, do not scroll past without taking action.",
      duration: ctaDuration,
      visualType: "talking-head",
    },
  ];
}

const PLATFORM_HASHTAG_LIMITS: Record<Platform, number> = {
  tiktok: 5,
  "instagram-reels": 5,
  "youtube-shorts": 3,
  "youtube-long": 3,
  linkedin: 3,
  x: 2,
  facebook: 3,
};

// ---------------------------------------------------------------------------
// Core exports
// ---------------------------------------------------------------------------

export function generateContentAngles(
  topic: string,
  niche: string,
  count = 5,
): ContentAngle[] {
  const nicheData = getNicheData(niche);
  const requestedCount = Math.max(5, count);
  const angles: ContentAngle[] = [];

  for (let i = 0; i < requestedCount; i++) {
    const template = ANGLE_TEMPLATES[i % ANGLE_TEMPLATES.length];
    angles.push({
      id: generateId("angle"),
      type: template.type,
      hook: interpolate(template.hook, topic, nicheData),
      premise: interpolate(template.premise, topic, nicheData),
      targetEmotion: template.targetEmotion,
      estimatedReach: template.estimatedReach,
    });
  }

  return angles;
}

export function generateHook(angle: ContentAngle, platform: Platform): Hook {
  const styleMap: Record<Platform, HookStyle> = {
    tiktok: "shock",
    "instagram-reels": "story",
    "youtube-shorts": "question",
    "youtube-long": "statistic",
    linkedin: "contrarian",
    x: "contrarian",
    facebook: "story",
  };

  const ctrMap: Record<HookStyle, number> = {
    shock: 0.09,
    story: 0.07,
    question: 0.08,
    statistic: 0.06,
    contrarian: 0.07,
  };

  const style = styleMap[platform];
  const baseCTR = ctrMap[style];
  const reachBonus = angle.estimatedReach === "high" ? 0.02 : angle.estimatedReach === "medium" ? 0.01 : 0;

  let text = angle.hook;

  if (platform === "linkedin") {
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!text.endsWith("?") && !text.endsWith(".")) text += ".";
  } else if (platform === "x") {
    if (text.length > 280) text = text.slice(0, 277) + "...";
  } else if (platform === "tiktok" || platform === "instagram-reels") {
    text = text.slice(0, 100);
  }

  return {
    text,
    style,
    estimatedCTR: Math.min(0.99, parseFloat((baseCTR + reachBonus).toFixed(3))),
  };
}

export function generateScript(
  angle: ContentAngle,
  platform: Platform,
  duration?: number,
): Script {
  const totalDuration = duration ?? defaultDurationForPlatform(platform);
  const scenes = buildScenes(angle, totalDuration);
  const limit = PLATFORM_HASHTAG_LIMITS[platform];

  const ctaByType: Record<ContentType, string> = {
    viral: "Follow for more insights like this.",
    conversion: "Click the link in bio to get started for free.",
  };

  const baseHashtags = ["#content", "#marketing", "#business", "#growth", "#tips", "#strategy"];
  const hashtags = baseHashtags.slice(0, limit);

  return {
    scenes,
    totalDuration,
    cta: ctaByType[angle.type],
    hashtags,
  };
}

export function generateContentBatch(
  topic: string,
  niche: string,
  platforms: Platform[],
  tenantId = "default",
): ContentBatch {
  const angles = generateContentAngles(topic, niche);
  const assets: PlatformAsset[] = [];

  for (const platform of platforms) {
    const angle = angles[0];
    const hook = generateHook(angle, platform);
    const script = generateScript(angle, platform);
    assets.push({ platform, hook, script, angle });
  }

  const batch: ContentBatch = {
    id: generateId("batch"),
    topic,
    niche,
    generatedAt: new Date().toISOString(),
    angles,
    assets,
  };

  storeAssets(tenantId, batch);
  return batch;
}

export function classifyContent(content: { cta?: string; script?: Script; hook?: Hook }): ContentType {
  const ctaText = content.cta ?? content.script?.cta ?? "";
  const conversionKeywords = ["book", "download", "schedule", "claim", "get started", "sign up", "register", "free guide", "consultation", "lead magnet", "link in bio"];
  const lower = ctaText.toLowerCase();
  const isConversion = conversionKeywords.some((kw) => lower.includes(kw));
  return isConversion ? "conversion" : "viral";
}

export function splitViralAndConversion(batch: ContentBatch): SplitBatch {
  const viral: PlatformAsset[] = [];
  const conversion: PlatformAsset[] = [];

  for (const asset of batch.assets) {
    if (asset.angle.type === "conversion") {
      conversion.push(asset);
    } else {
      viral.push(asset);
    }
  }

  return { viral, conversion };
}
