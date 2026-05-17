// ── Intake demo seed: pure generators ────────────────────────────────
// Pure helpers used by the seed-intake-demo CLI. Separated from the
// script entry point so they're unit-testable without a database.

import type { IntakeStep, IntakeMessage, IntakeOutcome } from "@/lib/intake/types";

/**
 * Simple seeded PRNG (mulberry32). Deterministic given a seed, which is
 * what we want for reproducible demo data. NOT cryptographically secure.
 */
export function makePrng(seed: number) {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

export function rngInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rngPick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Weighted pick. weights and items must be same length. Returns item.
 */
export function rngWeightedPick<T>(rng: Rng, items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ── Realistic intake-conversation shape generators ──────────────────

export interface GeneratedConversation {
  startedFromNicheSlug: string;
  currentStep: IntakeStep;
  outcomeStatus: "completed" | "abandoned" | "in_progress" | "error";
  messages: IntakeMessage[];
  outcome: Partial<IntakeOutcome>;
  createdAt: Date;
  updatedAt: Date;
  /** True if a Lead should be created and linked */
  createLead: boolean;
  /** True if this is intentionally an "orphan completed" — completed
   *  but with createLead=false, for testing the analytics alarm. */
  isOrphan: boolean;
  /** Generated contact info if completed */
  contact?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

// Realistic step drop-off weights observed in similar funnels:
//   problem → location:   95% retained (5% drop at problem)
//   location → urgency:   85% retained (15% drop)
//   urgency → budget:     75% retained (25% drop)
//   budget → contact:     85% retained (15% drop)
//   contact → complete:   70% retained (30% drop — TCPA + phone friction)
//
// Multiply through: completion rate ≈ 0.95 * 0.85 * 0.75 * 0.85 * 0.70 ≈ 0.36 (36%)
const STEP_RETENTION = {
  problem: 0.95,
  location: 0.85,
  urgency: 0.75,
  budget: 0.85,
  contact: 0.70,
};

export const STEP_ORDER: IntakeStep[] = [
  "problem",
  "location",
  "urgency",
  "budget",
  "contact",
  "complete",
];

/**
 * Decide where this conversation drops off, or whether it completes.
 * Returns the step the conversation STOPPED on (so currentStep is
 * the NEXT step it would have taken, except for "complete" which is
 * the terminal state).
 */
export function decideFunnelOutcome(rng: Rng): {
  furthestStep: IntakeStep;
  outcomeStatus: "completed" | "abandoned" | "in_progress" | "error";
} {
  // 5% errored, 5% in-progress (active right now), rest go through the funnel
  const r = rng();
  if (r < 0.05) {
    // Errored somewhere — pick a random step
    return {
      furthestStep: rngPick(rng, ["problem", "location", "urgency", "budget"] as IntakeStep[]),
      outcomeStatus: "error",
    };
  }
  if (r < 0.10) {
    // Still in progress — drop somewhere mid-funnel
    return {
      furthestStep: rngPick(rng, ["location", "urgency", "budget", "contact"] as IntakeStep[]),
      outcomeStatus: "in_progress",
    };
  }

  // Walk the retention chain
  let lastReached: IntakeStep = "problem";
  for (const step of ["problem", "location", "urgency", "budget", "contact"] as const) {
    if (rng() <= STEP_RETENTION[step]) {
      // Survived this step
      const idx = STEP_ORDER.indexOf(step);
      lastReached = STEP_ORDER[idx + 1] ?? "complete";
    } else {
      // Abandoned at this step
      return { furthestStep: step, outcomeStatus: "abandoned" };
    }
  }
  return { furthestStep: "complete", outcomeStatus: "completed" };
}

// ── Problem texts by niche (for realism) ─────────────────────────────

const PROBLEM_TEXTS: Record<string, string[]> = {
  plumbing: [
    "water leaking under the kitchen sink, dripping on the floor",
    "toilet won't stop running and the floor is wet",
    "no hot water this morning, water heater is making clicking sounds",
    "pipe burst in basement after the cold snap last night",
    "drain in the shower backed up — water rising during use",
  ],
  hvac: [
    "furnace stopped working last night, no heat in the house",
    "AC unit running constantly but not cooling, vents blowing warm air",
    "thermostat shows error code and HVAC won't turn on",
    "weird burning smell when furnace kicks on",
    "ductwork making rattling sounds when system runs",
  ],
  electrical: [
    "half of the kitchen outlets stopped working suddenly",
    "circuit breaker keeps tripping when I run the microwave",
    "flickering lights throughout the house, getting worse",
    "burning smell from outlet behind couch",
    "need EV charger installed in the garage",
  ],
  roofing: [
    "water stain on ceiling after last storm, getting bigger",
    "missing shingles after wind storm last week",
    "ice dam formed last winter caused leaks in attic",
    "need full roof replacement estimate for insurance",
    "soffit damage where roof meets wall, animals getting in",
  ],
  landscaping: [
    "need spring cleanup and mulch refresh for front yard",
    "want a hardscape patio designed and installed",
    "lawn has bare patches that won't grow back",
    "drainage issue creating swampy area in side yard",
    "need annual maintenance contract for property",
  ],
  dental: [
    "cracked molar, painful when I chew on that side",
    "need a cleaning, haven't been in 18 months",
    "child needs a pediatric dentist for first visit",
    "looking for a new dentist who takes my insurance",
    "broken filling came out, need to get fixed soon",
  ],
  legal: [
    "need help drafting a will and basic estate documents",
    "tenant dispute, lease ends in two weeks",
    "small business contract review needed urgently",
    "looking for help with parents' estate planning",
    "received a cease-and-desist, need to know my options",
  ],
  cleaning: [
    "need biweekly cleaning service for 3-bedroom home",
    "post-renovation deep clean needed, lots of dust",
    "rental turnover cleaning between guests for Airbnb",
    "office cleaning service for small commercial space",
    "carpet cleaning needed, two dogs and high traffic",
  ],
};

// Fallback for niches we didn't enumerate
const GENERIC_PROBLEMS = [
  "need a professional to look at an issue at my home",
  "looking for a recommendation for this service in Erie",
  "have a project I need help with, can someone reach out?",
  "looking for an estimate for some work I need done",
];

export function generateProblemText(rng: Rng, niche: string): string {
  const list = PROBLEM_TEXTS[niche] ?? GENERIC_PROBLEMS;
  return rngPick(rng, list);
}

// ── Contact info generators ──────────────────────────────────────────

const FIRST_NAMES = ["Sarah", "Mike", "Jen", "Tom", "Lisa", "Dave", "Karen", "Brian", "Amy", "Chris", "Jess", "Pat", "Tony", "Megan", "Kyle", "Erin"];
const LAST_NAMES = ["Smith", "Jones", "Walker", "Stevens", "Petrov", "Murphy", "Kowalski", "Chen", "Hernandez", "O'Brien", "Bauer", "Schmidt", "Reilly", "Pacek"];

export function generateContact(rng: Rng): { firstName: string; lastName: string; email: string; phone: string } {
  const firstName = rngPick(rng, FIRST_NAMES);
  const lastName = rngPick(rng, LAST_NAMES);
  // Use a recognizable demo domain so seed rows are easy to find
  const email = `demo.${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/['\s]/g, "")}+${rngInt(rng, 1000, 9999)}@erie.pro.demo`;
  const phone = `814${rngInt(rng, 2000000, 9999999).toString().padStart(7, "0")}`;
  return { firstName, lastName, email, phone };
}

// ── Conversation builder ─────────────────────────────────────────────

const ZIPS = ["16501", "16502", "16503", "16504", "16505", "16506", "16507", "16508", "16509"];

export interface BuildOpts {
  niche: string;
  furthestStep: IntakeStep;
  outcomeStatus: "completed" | "abandoned" | "in_progress" | "error";
  /** If true, include a user-correction switch event (did-you-mean usage) */
  includeNicheSwitch: boolean;
  /** When this conversation should be timestamped */
  createdAt: Date;
}

export function buildConversation(rng: Rng, opts: BuildOpts): GeneratedConversation {
  const { niche, furthestStep, outcomeStatus, includeNicheSwitch, createdAt } = opts;

  const messages: IntakeMessage[] = [];
  const outcome: Partial<IntakeOutcome> = {};

  // Greeting
  messages.push({
    role: "assistant",
    content: `Hi — I'll get you to a ${niche} pro in Erie. What's going on?`,
    at: new Date(createdAt.getTime()).toISOString(),
  });

  const stepIdx = (s: IntakeStep) => STEP_ORDER.indexOf(s);

  // Helper: timestamp offset by minutes
  const tAt = (m: number) => new Date(createdAt.getTime() + m * 60_000).toISOString();

  // problem step
  if (stepIdx(furthestStep) >= stepIdx("problem")) {
    const problem = generateProblemText(rng, niche);
    messages.push({ role: "user", content: problem, at: tAt(1) });
    outcome.problemDescription = problem;

    // Classifier outcome — vary by realistic confidence distribution
    const confR = rng();
    let primaryNiche = niche;
    let confidence: number;
    let classifierSource: "llm" | "keyword-fallback";

    if (confR < 0.55) {
      // High confidence (≥0.7) — most common in well-classified queries
      confidence = 0.7 + rng() * 0.3;
      classifierSource = "llm";
    } else if (confR < 0.85) {
      // Medium confidence (0.4-0.7)
      confidence = 0.4 + rng() * 0.3;
      classifierSource = rng() < 0.5 ? "llm" : "keyword-fallback";
    } else {
      // Low confidence (<0.4) — these fall back to the hint
      confidence = 0.15 + rng() * 0.25;
      classifierSource = "llm";
    }

    outcome.primaryNiche = primaryNiche;
    outcome.primaryNicheConfidence = confidence;
    outcome.candidateNiches = [{ slug: primaryNiche, confidence, reason: "demo" }];

    if (stepIdx(furthestStep) >= stepIdx("location")) {
      const ack = `Got it — let me get you to a ${niche} pro. What part of Erie are you in?`;
      messages.push({
        role: "assistant",
        content: ack,
        meta: { matchedNiche: niche, classifierSource },
        at: tAt(1.2),
      });

      // Optionally inject a did-you-mean switch (user-correction)
      if (includeNicheSwitch) {
        // Pick a different niche from a small alternate pool
        const alt = rngPick(rng, ["plumbing", "hvac", "electrical", "roofing"].filter((n) => n !== niche));
        messages.push({
          role: "user",
          content: `Switch to ${alt}`,
          at: tAt(1.5),
        });
        messages.push({
          role: "assistant",
          content: `Got it — switching to ${alt}. Continuing from where we were.`,
          meta: {
            matchedNiche: alt,
            classifierSource: "user-correction",
            previousNiche: niche,
          },
          at: tAt(1.6),
        });
        // Update outcome to reflect the switch
        outcome.primaryNiche = alt;
        outcome.primaryNicheConfidence = 1.0;
      }
    }
  }

  // location step
  if (stepIdx(furthestStep) >= stepIdx("urgency")) {
    const zip = rngPick(rng, ZIPS);
    messages.push({ role: "user", content: zip, at: tAt(2) });
    outcome.zip = zip;
    messages.push({
      role: "assistant",
      content: `Thanks. How urgent is this?`,
      at: tAt(2.2),
    });
  }

  // urgency step
  if (stepIdx(furthestStep) >= stepIdx("budget")) {
    const urgency = rngWeightedPick(rng, ["emergency", "this-week", "researching"] as const, [1, 3, 2]);
    messages.push({ role: "user", content: urgency, at: tAt(3) });
    outcome.urgency = urgency;
    messages.push({
      role: "assistant",
      content: urgency === "emergency"
        ? `Got it — for emergencies you can also call the concierge at (814) 200-0328. Last few questions...`
        : `OK, what's your budget range?`,
      at: tAt(3.2),
    });
  }

  // budget step
  if (stepIdx(furthestStep) >= stepIdx("contact")) {
    const budget = rngWeightedPick(
      rng,
      ["under-500", "500-2k", "over-2k", "not-sure", "skipped"] as const,
      [1, 3, 2, 3, 1]
    );
    messages.push({ role: "user", content: budget, at: tAt(4) });
    outcome.budget = budget;
    messages.push({
      role: "assistant",
      content: `Thanks. Last thing — how should the contractor reach you?`,
      at: tAt(4.2),
    });
  }

  // contact step + completion
  let contact: GeneratedConversation["contact"] | undefined;
  if (furthestStep === "complete") {
    contact = generateContact(rng);
    messages.push({
      role: "user",
      content: `Name: ${contact.firstName} ${contact.lastName}, email ${contact.email}, phone ${contact.phone}`,
      at: tAt(5),
    });
    messages.push({
      role: "assistant",
      content: `Connecting you now. One moment.`,
      at: tAt(5.2),
    });
    outcome.contact = {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      preference: rngPick(rng, ["phone", "sms", "email"] as const),
      tcpaConsent: true,
      tcpaVersion: "2",
      tcpaText: "demo",
    };
  }

  // Decide currentStep: if completed, it's "complete"; otherwise it's
  // the NEXT step they would have taken (i.e. furthestStep itself for
  // in-progress/abandoned where they bailed BEFORE submitting that step)
  const currentStep: IntakeStep = furthestStep === "complete" ? "complete" : furthestStep;

  // Updated-at: completed conversations updated within 10 min of created;
  // abandoned ones updated at the last interaction.
  const stepsCovered = stepIdx(furthestStep);
  const lastInteractionMin = furthestStep === "complete" ? 5.5 : Math.max(0.5, stepsCovered * 1.2);
  const updatedAt = new Date(createdAt.getTime() + lastInteractionMin * 60_000);

  // ~5% of "completed" should be intentionally orphan (no lead created)
  // — to exercise the analytics dashboard's orphan-completed alarm.
  const isOrphan = outcomeStatus === "completed" && rng() < 0.05;
  const createLead = outcomeStatus === "completed" && !isOrphan;

  return {
    startedFromNicheSlug: niche,
    currentStep,
    outcomeStatus,
    messages,
    outcome,
    createdAt,
    updatedAt,
    createLead,
    isOrphan,
    contact,
  };
}

// ── Time distribution helper ─────────────────────────────────────────

/**
 * Generate a createdAt distributed over the past N days, slightly
 * weighted toward more recent days (typical for organic traffic growth).
 */
export function generateCreatedAt(rng: Rng, daysBack: number, now: Date = new Date()): Date {
  // Beta-ish distribution favoring recent: square root pulls toward 1
  const skew = Math.pow(rng(), 0.7); // 0..1, weighted toward 1
  const daysAgo = daysBack * (1 - skew);
  const dayMs = 86400 * 1000;
  // Add hour-of-day variation (8am-10pm with peaks at 9am and 7pm)
  const hourBucket = rng();
  let hour: number;
  if (hourBucket < 0.4) hour = 8 + Math.floor(rng() * 4);   // 8-12 morning
  else if (hourBucket < 0.7) hour = 12 + Math.floor(rng() * 5);  // 12-17 afternoon
  else hour = 17 + Math.floor(rng() * 5);                       // 17-22 evening
  const ts = now.getTime() - daysAgo * dayMs;
  const d = new Date(ts);
  d.setHours(hour, Math.floor(rng() * 60), Math.floor(rng() * 60), 0);
  return d;
}

// ── Niche distribution (realistic weights) ───────────────────────────

/**
 * Returns a niche, weighted toward common ones. Mirrors a realistic
 * traffic mix where emergency-driven niches (plumbing, HVAC) and
 * scheduled-need niches (cleaning, landscaping) dominate.
 */
export const NICHE_WEIGHTS: Array<{ niche: string; weight: number }> = [
  { niche: "plumbing", weight: 12 },
  { niche: "hvac", weight: 10 },
  { niche: "electrical", weight: 7 },
  { niche: "roofing", weight: 6 },
  { niche: "landscaping", weight: 8 },
  { niche: "cleaning", weight: 7 },
  { niche: "dental", weight: 5 },
  { niche: "legal", weight: 4 },
  { niche: "auto-repair", weight: 5 },
  { niche: "appliance-repair", weight: 4 },
  { niche: "garage-door", weight: 3 },
  { niche: "painting", weight: 3 },
  { niche: "flooring", weight: 3 },
  { niche: "real-estate", weight: 4 },
  { niche: "pest-control", weight: 3 },
  { niche: "tree-service", weight: 3 },
  { niche: "snow-removal", weight: 4 },
  { niche: "moving", weight: 2 },
  { niche: "fencing", weight: 2 },
  { niche: "concrete", weight: 2 },
];

export function pickNiche(rng: Rng): string {
  return rngWeightedPick(
    rng,
    NICHE_WEIGHTS.map((n) => n.niche),
    NICHE_WEIGHTS.map((n) => n.weight)
  );
}
