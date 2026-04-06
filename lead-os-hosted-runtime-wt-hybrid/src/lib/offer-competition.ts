import {
  experimentStore,
  generateExperimentId,
  type Experiment,
} from "./experiment-store.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OfferVariant {
  id: string;
  niche: string;
  baseOfferId: string | null;
  headline: string;
  price: number;
  guarantee: string;
  urgencyType: "scarcity" | "deadline" | "seasonal" | "social-proof" | "none";
  bonuses: string[];
  tweakedVariable: string;
  generation: number;
  createdAt: string;
}

export interface OfferTest {
  id: string;
  tenantId: string;
  niche: string;
  experimentId: string;
  variantIds: string[];
  status: "running" | "completed" | "archived";
  generation: number;
  createdAt: string;
  completedAt: string | null;
}

export interface OfferPerformance {
  variantId: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
  revenuePerVisitor: number;
  refundCount: number;
  complaintCount: number;
  satisfactionProxy: number;
}

export interface OfferAnalysis {
  testId: string;
  performances: OfferPerformance[];
  winner: string | null;
  confidence: number;
  revenueLiftEstimate: number;
  isSignificant: boolean;
}

export interface OfferEvolution {
  generation: number;
  testId: string;
  winnerId: string | null;
  winnerHeadline: string | null;
  revenuePerVisitor: number;
  revenueLiftFromPrevious: number;
  completedAt: string | null;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

import { EvictableMap } from "./evictable-map";

const variantStore: Map<string, OfferVariant> = new EvictableMap();
const testStore: Map<string, OfferTest> = new EvictableMap();
const revenueLog: Array<{
  variantId: string;
  revenue: number;
  timestamp: string;
}> = [];
const visitorLog: Map<string, number> = new EvictableMap();
const refundLog: Map<string, number> = new EvictableMap();
const complaintLog: Map<string, number> = new EvictableMap();

let variantIdCounter = 0;
let testIdCounter = 0;

function generateVariantId(): string {
  variantIdCounter += 1;
  return `ov_${Date.now()}_${variantIdCounter}`;
}

function generateTestId(): string {
  testIdCounter += 1;
  return `ot_${Date.now()}_${testIdCounter}`;
}

// ---------------------------------------------------------------------------
// Headline templates by niche
// ---------------------------------------------------------------------------

const HEADLINE_ANGLES: Record<string, string[]> = {
  construction: [
    "Build Your Dream Project for Less",
    "Licensed Contractors, Guaranteed Quality",
    "Get Your Free Estimate in 24 Hours",
    "Top-Rated Builders Near You",
    "Transform Your Space — Risk-Free",
  ],
  legal: [
    "Get the Justice You Deserve",
    "Free Case Evaluation — No Obligation",
    "Win or Pay Nothing",
    "Experienced Attorneys on Your Side",
    "Protect Your Rights Today",
  ],
  dental: [
    "A Smile You'll Love — Affordable Plans",
    "New Patient Special: Free Exam + X-Rays",
    "Pain-Free Dentistry, Guaranteed",
    "Book Your Appointment in 60 Seconds",
    "Top-Rated Dental Care Near You",
  ],
  default: [
    "Get Started Risk-Free Today",
    "Limited Time: Exclusive Offer Inside",
    "Trusted by Thousands — See Why",
    "Your Problem, Solved — Guaranteed",
    "Act Now Before Spots Fill Up",
  ],
};

const GUARANTEE_TYPES = [
  "30-day money-back guarantee",
  "100% satisfaction or your money back",
  "Double-your-money-back guarantee",
  "Free trial — no credit card required",
  "Risk-free for 60 days",
];

const URGENCY_TYPES: OfferVariant["urgencyType"][] = [
  "scarcity",
  "deadline",
  "seasonal",
  "social-proof",
  "none",
];

const BONUS_SETS = [
  ["Free consultation call", "Priority support"],
  ["Bonus resource guide", "Exclusive community access"],
  ["Free follow-up session", "Implementation checklist"],
  ["Video training series", "Template library"],
  ["Fast-track onboarding", "Dedicated account manager"],
];

const TWEAKABLE_VARIABLES = [
  "price",
  "guarantee",
  "urgency",
  "bonuses",
  "headline",
];

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

export function generateOfferVariants(
  niche: string,
  baseOffer: {
    headline: string;
    price: number;
    guarantee: string;
    urgencyType: OfferVariant["urgencyType"];
    bonuses: string[];
  },
  count: number = 4,
): OfferVariant[] {
  const clampedCount = Math.max(3, Math.min(5, count));
  const headlines = HEADLINE_ANGLES[niche.toLowerCase()] ?? HEADLINE_ANGLES["default"];
  const now = new Date().toISOString();
  const baseVariantId = generateVariantId();

  const baseVariant: OfferVariant = {
    id: baseVariantId,
    niche,
    baseOfferId: null,
    headline: baseOffer.headline,
    price: baseOffer.price,
    guarantee: baseOffer.guarantee,
    urgencyType: baseOffer.urgencyType,
    bonuses: [...baseOffer.bonuses],
    tweakedVariable: "control",
    generation: 1,
    createdAt: now,
  };

  variantStore.set(baseVariant.id, baseVariant);
  const variants: OfferVariant[] = [baseVariant];

  for (let i = 0; i < clampedCount - 1; i++) {
    const tweakIdx = i % TWEAKABLE_VARIABLES.length;
    const tweaked = TWEAKABLE_VARIABLES[tweakIdx];
    const variant: OfferVariant = {
      id: generateVariantId(),
      niche,
      baseOfferId: baseVariantId,
      headline: tweaked === "headline"
        ? headlines[i % headlines.length]
        : baseOffer.headline,
      price: tweaked === "price"
        ? Math.round(baseOffer.price * (0.8 + (i * 0.15)))
        : baseOffer.price,
      guarantee: tweaked === "guarantee"
        ? GUARANTEE_TYPES[i % GUARANTEE_TYPES.length]
        : baseOffer.guarantee,
      urgencyType: tweaked === "urgency"
        ? URGENCY_TYPES[i % URGENCY_TYPES.length]
        : baseOffer.urgencyType,
      bonuses: tweaked === "bonuses"
        ? BONUS_SETS[i % BONUS_SETS.length]
        : [...baseOffer.bonuses],
      tweakedVariable: tweaked,
      generation: 1,
      createdAt: now,
    };
    variantStore.set(variant.id, variant);
    variants.push(variant);
  }

  return variants;
}

export function deployOfferTest(
  tenantId: string,
  variants: OfferVariant[],
): OfferTest {
  const experimentId = generateExperimentId();
  const now = new Date().toISOString();

  const totalWeight = variants.length;
  const experiment: Experiment = {
    id: experimentId,
    name: `offer-test-${tenantId}-${variants[0]?.niche ?? "unknown"}`,
    description: `Offer competition test with ${variants.length} variants`,
    status: "running",
    variants: variants.map((v, i) => ({
      id: v.id,
      name: v.headline,
      weight: 1 / totalWeight,
      assignments: 0,
      conversions: 0,
    })),
    targetMetric: "revenue-per-visitor",
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  experimentStore.set(experimentId, experiment);

  const existingTests = Array.from(testStore.values()).filter(
    (t) => t.tenantId === tenantId && t.niche === variants[0]?.niche,
  );
  const generation = existingTests.length > 0
    ? Math.max(...existingTests.map((t) => t.generation)) + 1
    : 1;

  const test: OfferTest = {
    id: generateTestId(),
    tenantId,
    niche: variants[0]?.niche ?? "unknown",
    experimentId,
    variantIds: variants.map((v) => v.id),
    status: "running",
    generation,
    createdAt: now,
    completedAt: null,
  };
  testStore.set(test.id, test);

  for (const v of variants) {
    visitorLog.set(v.id, 0);
  }

  return test;
}

export function trackOfferRevenue(variantId: string, revenue: number): void {
  revenueLog.push({
    variantId,
    revenue,
    timestamp: new Date().toISOString(),
  });
  visitorLog.set(variantId, (visitorLog.get(variantId) ?? 0) + 1);
}

export function trackRefund(variantId: string): void {
  refundLog.set(variantId, (refundLog.get(variantId) ?? 0) + 1);
}

export function trackComplaint(variantId: string): void {
  complaintLog.set(variantId, (complaintLog.get(variantId) ?? 0) + 1);
}

export function recordVisitor(variantId: string): void {
  visitorLog.set(variantId, (visitorLog.get(variantId) ?? 0) + 1);
}

function getPerformance(variantId: string): OfferPerformance {
  const revenues = revenueLog.filter((r) => r.variantId === variantId);
  const totalRevenue = revenues.reduce((sum, r) => sum + r.revenue, 0);
  const conversions = revenues.length;
  const visitors = visitorLog.get(variantId) ?? 0;
  const refundCount = refundLog.get(variantId) ?? 0;
  const complaintCount = complaintLog.get(variantId) ?? 0;

  const conversionRate = visitors > 0 ? conversions / visitors : 0;
  const revenuePerVisitor = visitors > 0 ? totalRevenue / visitors : 0;
  const satisfactionProxy = conversions > 0
    ? Math.max(0, 1 - ((refundCount + complaintCount) / conversions))
    : 1;

  return {
    variantId,
    visitors,
    conversions,
    conversionRate: Math.round(conversionRate * 10000) / 10000,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    revenuePerVisitor: Math.round(revenuePerVisitor * 100) / 100,
    refundCount,
    complaintCount,
    satisfactionProxy: Math.round(satisfactionProxy * 1000) / 1000,
  };
}

export function analyzeOfferPerformance(testId: string): OfferAnalysis {
  const test = testStore.get(testId);
  if (!test) {
    return {
      testId,
      performances: [],
      winner: null,
      confidence: 0,
      revenueLiftEstimate: 0,
      isSignificant: false,
    };
  }

  const performances = test.variantIds.map((vid) => getPerformance(vid));

  const totalVisitors = performances.reduce((s, p) => s + p.visitors, 0);
  const minVisitorsPerVariant = 30;
  const hasEnoughData = performances.every(
    (p) => p.visitors >= minVisitorsPerVariant,
  );

  const sorted = [...performances].sort(
    (a, b) => b.revenuePerVisitor - a.revenuePerVisitor,
  );
  const best = sorted[0];
  const secondBest = sorted[1];

  let confidence = 0;
  if (best && secondBest && best.visitors > 0 && secondBest.visitors > 0) {
    const rpvDiff = best.revenuePerVisitor - secondBest.revenuePerVisitor;
    const avgRpv = (best.revenuePerVisitor + secondBest.revenuePerVisitor) / 2;
    const relativeDiff = avgRpv > 0 ? rpvDiff / avgRpv : 0;
    const sampleFactor = Math.min(1, totalVisitors / 200);
    confidence = Math.min(0.99, relativeDiff * sampleFactor * 2);
    confidence = Math.max(0, Math.round(confidence * 1000) / 1000);
  }

  const isSignificant = confidence >= 0.9 && hasEnoughData;
  const winner = isSignificant && best ? best.variantId : null;

  const controlPerf = performances.find((p) => {
    const v = variantStore.get(p.variantId);
    return v?.tweakedVariable === "control";
  });
  const baseRpv = controlPerf?.revenuePerVisitor ?? (secondBest?.revenuePerVisitor ?? 0);
  const revenueLiftEstimate = best && baseRpv > 0
    ? Math.round(((best.revenuePerVisitor - baseRpv) / baseRpv) * 10000) / 100
    : 0;

  return {
    testId,
    performances,
    winner,
    confidence,
    revenueLiftEstimate,
    isSignificant,
  };
}

export function promoteWinningOffer(testId: string): {
  promoted: OfferVariant | null;
  nextVariants: OfferVariant[];
  archivedCount: number;
} {
  const analysis = analyzeOfferPerformance(testId);
  const test = testStore.get(testId);

  if (!analysis.winner || !test) {
    return { promoted: null, nextVariants: [], archivedCount: 0 };
  }

  const winnerVariant = variantStore.get(analysis.winner);
  if (!winnerVariant) {
    return { promoted: null, nextVariants: [], archivedCount: 0 };
  }

  test.status = "completed";
  test.completedAt = new Date().toISOString();

  let archivedCount = 0;
  for (const vid of test.variantIds) {
    if (vid !== analysis.winner) {
      archivedCount += 1;
    }
  }

  const nextVariants = generateOfferVariants(
    winnerVariant.niche,
    {
      headline: winnerVariant.headline,
      price: winnerVariant.price,
      guarantee: winnerVariant.guarantee,
      urgencyType: winnerVariant.urgencyType,
      bonuses: winnerVariant.bonuses,
    },
    4,
  );

  for (const nv of nextVariants) {
    nv.generation = winnerVariant.generation + 1;
    nv.baseOfferId = winnerVariant.id;
  }

  return { promoted: winnerVariant, nextVariants, archivedCount };
}

export function getOfferEvolutionHistory(
  tenantId: string,
  niche: string,
): OfferEvolution[] {
  const tests = Array.from(testStore.values())
    .filter((t) => t.tenantId === tenantId && t.niche === niche)
    .sort((a, b) => a.generation - b.generation);

  let previousRpv = 0;

  return tests.map((test) => {
    const analysis = analyzeOfferPerformance(test.id);
    const winnerPerf = analysis.winner
      ? analysis.performances.find((p) => p.variantId === analysis.winner)
      : null;

    const rpv = winnerPerf?.revenuePerVisitor ?? 0;
    const lift = previousRpv > 0
      ? Math.round(((rpv - previousRpv) / previousRpv) * 10000) / 100
      : 0;

    if (rpv > 0) {
      previousRpv = rpv;
    }

    const winnerVariant = analysis.winner
      ? variantStore.get(analysis.winner)
      : null;

    return {
      generation: test.generation,
      testId: test.id,
      winnerId: analysis.winner,
      winnerHeadline: winnerVariant?.headline ?? null,
      revenuePerVisitor: rpv,
      revenueLiftFromPrevious: lift,
      completedAt: test.completedAt,
    };
  });
}

export function runOfferEvolutionCycle(
  tenantId: string,
  niche: string,
): {
  analyzed: OfferAnalysis | null;
  promoted: OfferVariant | null;
  nextTest: OfferTest | null;
} {
  const activeTest = Array.from(testStore.values()).find(
    (t) =>
      t.tenantId === tenantId &&
      t.niche === niche &&
      t.status === "running",
  );

  if (!activeTest) {
    return { analyzed: null, promoted: null, nextTest: null };
  }

  const analyzed = analyzeOfferPerformance(activeTest.id);

  if (!analyzed.isSignificant) {
    return { analyzed, promoted: null, nextTest: null };
  }

  const { promoted, nextVariants } = promoteWinningOffer(activeTest.id);

  if (!promoted || nextVariants.length === 0) {
    return { analyzed, promoted: null, nextTest: null };
  }

  const nextTest = deployOfferTest(tenantId, nextVariants);

  return { analyzed, promoted, nextTest };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function _resetStores(): void {
  variantStore.clear();
  testStore.clear();
  revenueLog.length = 0;
  visitorLog.clear();
  refundLog.clear();
  complaintLog.clear();
  variantIdCounter = 0;
  testIdCounter = 0;
}
