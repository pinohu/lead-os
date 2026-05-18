// ── Per-Niche Intake Templates ────────────────────────────────────────
// Every niche in niches.ts gets an intake template:
//   - HAND_TUNED_TEMPLATES holds the 5 v1 launch niches with bespoke copy.
//   - generateTemplate(niche) produces a high-quality template from niche
//     metadata (label, description, searchTerms, avgProjectValue) for the
//     remaining ~107 niches.
//   - getIntakeTemplate(slug) returns the hand-tuned template if one
//     exists, otherwise the generated one, otherwise a final-fallback.
//
// All niches are intake-enabled. The widget appears on every niche page.

import { getNicheBySlug, niches, type LocalNiche } from "@/lib/niches";
import { CONCIERGE_PHONE_DISPLAY } from "@/lib/concierge";
import type { IntakeUrgency } from "./types";

export interface IntakeTemplate {
  nicheSlug: string;
  nicheLabel: string;
  /** Whether this niche has been hand-tuned (true) or auto-generated (false). UI parity either way. */
  enabled: boolean;
  greeting: string;
  problemPlaceholder: string;
  problemSuggestions: string[];
  urgencyExpectations: Record<IntakeUrgency, {
    buttonLabel: string;
    expectedResponseTime: string;
    slaTier: "emergency" | "same-day" | "next-day" | "standard";
    closingNote: string;
  }>;
  priceHint: {
    typical: string;
    low: string;
    high: string;
    factors: string[];
  };
}

// ── Hand-tuned templates for the v1 launch niches ────────────────────

const HAND_TUNED_TEMPLATES: Record<string, IntakeTemplate> = {
  plumbing: {
    nicheSlug: "plumbing",
    nicheLabel: "Plumbing",
    enabled: true,
    greeting: "Hi — I'll get you to a plumber who can help in Erie. To start, what's going on?",
    problemPlaceholder: "e.g. Water leaking under the kitchen sink",
    problemSuggestions: [
      "Water leaking under the sink",
      "Toilet won't stop running",
      "No hot water",
      "Drain is clogged",
      "Water heater needs replacing",
    ],
    urgencyExpectations: {
      "emergency": {
        buttonLabel: "Right now — water is running / shutoff failed",
        expectedResponseTime: "within 60 minutes",
        slaTier: "emergency",
        closingNote: `Got it. Emergency plumbing calls go to the front of the queue. If nobody's claimed the lane, the concierge line at ${CONCIERGE_PHONE_DISPLAY} will route you to whoever's on call right now.`,
      },
      "this-week": {
        buttonLabel: "This week — it can wait a day or two",
        expectedResponseTime: "within 24 hours",
        slaTier: "next-day",
        closingNote: "Sounds good. Most non-emergency plumbing calls get a response within a business day.",
      },
      "researching": {
        buttonLabel: "Just researching — no rush",
        expectedResponseTime: "within 2 business days",
        slaTier: "standard",
        closingNote: "Perfect, no rush. We'll pass along the request and a plumber will reach out when they have time to give a thoughtful answer.",
      },
    },
    priceHint: {
      typical: "$150–$500 for most repairs",
      low: "$95–$200 for service-call diagnostics",
      high: "$2,000–$8,000+ for water-heater replacement or sewer-line work",
      factors: ["Time of day (after-hours adds ~25–50%)", "Parts availability", "Whether walls or ground need to be opened", "Permit requirements for major work"],
    },
  },
  hvac: {
    nicheSlug: "hvac",
    nicheLabel: "HVAC",
    enabled: true,
    greeting: "Hi — I'll connect you with an HVAC contractor in Erie. What's going on?",
    problemPlaceholder: "e.g. Furnace stopped working last night",
    problemSuggestions: [
      "Furnace not heating",
      "AC isn't cooling",
      "Strange noise from the system",
      "Need a new furnace installed",
      "Annual maintenance / tune-up",
    ],
    urgencyExpectations: {
      "emergency": {
        buttonLabel: "Right now — no heat / no AC in extreme weather",
        expectedResponseTime: "within 90 minutes",
        slaTier: "emergency",
        closingNote: `No-heat-in-winter and no-AC-in-summer are real emergencies. If nobody's claimed the lane, the concierge line at ${CONCIERGE_PHONE_DISPLAY} will help right away.`,
      },
      "this-week": {
        buttonLabel: "This week — system is on but not great",
        expectedResponseTime: "within 24 hours",
        slaTier: "next-day",
        closingNote: "Got it. An HVAC tech will reach out within a business day.",
      },
      "researching": {
        buttonLabel: "Just researching — planning ahead",
        expectedResponseTime: "within 2 business days",
        slaTier: "standard",
        closingNote: "Smart move planning ahead. A contractor will get back to you with options when they have time.",
      },
    },
    priceHint: {
      typical: "$200–$800 for most repairs",
      low: "$95–$175 for service-call diagnostics",
      high: "$5,000–$12,000+ for full system replacement",
      factors: ["System age", "Type of fuel (gas, oil, electric, heat pump)", "Refrigerant work adds cost", "Ductwork modifications"],
    },
  },
  electrical: {
    nicheSlug: "electrical",
    nicheLabel: "Electrical",
    enabled: true,
    greeting: "Hi — I'll connect you with a licensed electrician in Erie. What do you need help with?",
    problemPlaceholder: "e.g. Outlets in one room aren't working",
    problemSuggestions: [
      "Outlets / circuit not working",
      "Need a panel upgrade",
      "Adding new lights or outlets",
      "Generator or EV charger install",
      "Flickering lights / breaker tripping",
    ],
    urgencyExpectations: {
      "emergency": {
        buttonLabel: "Right now — sparks / burning smell / no power",
        expectedResponseTime: "within 60 minutes",
        slaTier: "emergency",
        closingNote: `Sparks or burning smells are real safety issues. If you're seeing either, also call your local utility's emergency line. The concierge at ${CONCIERGE_PHONE_DISPLAY} can route you to whoever's on call.`,
      },
      "this-week": {
        buttonLabel: "This week — needs fixing soon",
        expectedResponseTime: "within 24 hours",
        slaTier: "next-day",
        closingNote: "Got it. An electrician will reach out within a business day.",
      },
      "researching": {
        buttonLabel: "Just researching — planning a project",
        expectedResponseTime: "within 2 business days",
        slaTier: "standard",
        closingNote: "Perfect. Send a contractor your project notes and a few will get back with rough estimates.",
      },
    },
    priceHint: {
      typical: "$150–$600 for most repairs",
      low: "$95–$200 for diagnostics or a single outlet",
      high: "$2,500–$8,000+ for panel upgrades; $15,000+ for full rewires",
      factors: ["Permit requirements (most cities require for panel work)", "Drywall opening", "Code compliance for older homes", "Inspector fees"],
    },
  },
  roofing: {
    nicheSlug: "roofing",
    nicheLabel: "Roofing",
    enabled: true,
    greeting: "Hi — I'll connect you with a roofer in Erie. What's going on?",
    problemPlaceholder: "e.g. Roof leak after the recent storm",
    problemSuggestions: [
      "Active roof leak",
      "Storm damage — shingles missing",
      "Roof inspection / age check",
      "Full roof replacement quote",
      "Gutter problems",
    ],
    urgencyExpectations: {
      "emergency": {
        buttonLabel: "Right now — active leak / structural damage",
        expectedResponseTime: "within 4 hours (or sooner during storms)",
        slaTier: "emergency",
        closingNote: `Active leaks compound fast. If a roofer can't be there in hours, ask about emergency tarping. The concierge at ${CONCIERGE_PHONE_DISPLAY} can route you to someone equipped for that.`,
      },
      "this-week": {
        buttonLabel: "This week — needs repair soon",
        expectedResponseTime: "within 48 hours",
        slaTier: "next-day",
        closingNote: "Got it. A roofer will reach out within 1–2 business days.",
      },
      "researching": {
        buttonLabel: "Just researching — replacement / quotes",
        expectedResponseTime: "within 3–5 business days",
        slaTier: "standard",
        closingNote: "Smart to get multiple quotes for a roof replacement. A contractor will get back to you for an inspection appointment.",
      },
    },
    priceHint: {
      typical: "$300–$1,500 for most repairs",
      low: "$200–$600 for tarp / patch / single shingle area",
      high: "$8,000–$25,000+ for full replacements (varies by material and pitch)",
      factors: ["Roof material (asphalt cheapest, slate priciest)", "Pitch and height", "Insurance claim involvement", "Permit + inspection", "Decking condition under shingles"],
    },
  },
  restoration: {
    nicheSlug: "restoration",
    nicheLabel: "Water Damage Restoration",
    enabled: true,
    greeting: "Hi — water damage gets worse by the hour, so I'll move fast. What's happened?",
    problemPlaceholder: "e.g. Basement flooded after heavy rain",
    problemSuggestions: [
      "Basement flooded",
      "Pipe burst — water everywhere",
      "Sewage backup",
      "Roof leak caused interior water damage",
      "Mold concern after past water damage",
    ],
    urgencyExpectations: {
      "emergency": {
        buttonLabel: "Right now — active water / fresh damage",
        expectedResponseTime: "within 60 minutes",
        slaTier: "emergency",
        closingNote: `Every hour after water intrusion increases mold and structural risk. Restoration companies typically run 24/7 — the concierge at ${CONCIERGE_PHONE_DISPLAY} will route you to whoever can be on-site fastest.`,
      },
      "this-week": {
        buttonLabel: "This week — damage already drying / mold concern",
        expectedResponseTime: "within 24 hours",
        slaTier: "next-day",
        closingNote: "Got it. A restoration contractor will reach out within a business day to assess.",
      },
      "researching": {
        buttonLabel: "Just researching — past damage / insurance question",
        expectedResponseTime: "within 2 business days",
        slaTier: "standard",
        closingNote: "Restoration questions tied to old damage or insurance often benefit from a free assessment. A contractor will follow up to schedule one.",
      },
    },
    priceHint: {
      typical: "$1,500–$5,000 for typical residential water mitigation",
      low: "$500–$1,500 for very minor cases (single room, no drying needed)",
      high: "$15,000–$50,000+ for category-3 / sewage / extensive mold",
      factors: ["Water category (clean / gray / sewage)", "How long water sat before mitigation", "Square footage affected", "Insurance coverage (most homeowners' policies cover sudden, not gradual)", "Mold remediation if needed"],
    },
  },
};

// ── Heuristic categorization for generated templates ─────────────────

/** Niches where same-hour emergency response is realistic and necessary. */
const EMERGENCY_KEYWORDS = [
  "repair", "emergency", "leak", "damage", "broken", "cleanup", "restoration",
  "heat", "cool", "hvac", "plumb", "electric", "roof", "water", "fire",
  "tow", "locksmith", "chimney", "septic", "sewer", "lockout", "burst",
  "flood", "storm", "outage", "garage-door", "pest", "rodent",
];

/** Niches where the work is project-scoped (quotes, schedules) rather than urgent. */
const PROJECT_KEYWORDS = [
  "remodel", "renovation", "kitchen", "bathroom", "addition", "build",
  "design", "install", "construction", "deck", "fence", "siding",
  "windows", "doors", "flooring", "landscape", "concrete", "paving",
  "solar", "insulation", "painting", "basement-finishing",
];

function isEmergencyNiche(niche: LocalNiche): boolean {
  const text = `${niche.slug} ${niche.description}`.toLowerCase();
  return EMERGENCY_KEYWORDS.some((k) => text.includes(k));
}

function isProjectNiche(niche: LocalNiche): boolean {
  const text = `${niche.slug} ${niche.description}`.toLowerCase();
  return PROJECT_KEYWORDS.some((k) => text.includes(k));
}

// ── Programmatic template generator ──────────────────────────────────

function parseAvgProjectValue(s: string): { low: number; high: number } | null {
  const match = s.match(/\$\s*([0-9,]+)\s*[-–—]\s*\$\s*([0-9,]+)/);
  if (!match) return null;
  const low = parseInt(match[1].replace(/,/g, ""), 10);
  const high = parseInt(match[2].replace(/,/g, ""), 10);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
  return { low, high };
}

function formatMoney(n: number): string {
  return `$${n.toLocaleString()}`;
}

function deriveProblemSuggestions(niche: LocalNiche): string[] {
  // Parse the description into discrete suggestion phrases.
  // Most niches describe themselves as comma-separated services:
  //   "Heating, cooling, ventilation, and air quality services"
  const parts = niche.description
    .replace(/,\s+and\s+/gi, ", ")
    .replace(/\s+and\s+/gi, ", ")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 2 && p.length < 60);

  const suggestions = parts.map((p) => {
    // Capitalize first letter; trim a trailing "services" / "service" since it's redundant in a suggestion button
    let s = p.charAt(0).toUpperCase() + p.slice(1);
    s = s.replace(/\s+services?$/i, "");
    return s;
  });

  // Dedupe, limit to 5
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of suggestions) {
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(s);
      if (out.length >= 5) break;
    }
  }
  return out;
}

function derivePriceHint(niche: LocalNiche): IntakeTemplate["priceHint"] {
  const parsed = parseAvgProjectValue(niche.avgProjectValue);
  if (!parsed) {
    return {
      typical: "Varies by scope",
      low: "Service calls typically $95–$200",
      high: "Complex projects can run several thousand dollars",
      factors: ["Scope of work", "Materials", "Time involved", "Permit requirements where applicable"],
    };
  }
  const { low, high } = parsed;
  const midLow = Math.round(low + (high - low) * 0.15);
  const midHigh = Math.round(low + (high - low) * 0.45);

  return {
    typical: `${formatMoney(midLow)}–${formatMoney(midHigh)} for most ${niche.label.toLowerCase()} jobs`,
    low: `${formatMoney(low)} for basic service or smaller jobs`,
    high: `${formatMoney(high)}+ for the largest or most complex projects`,
    factors: ["Scope and complexity", "Materials and parts", "Time required", "Permit requirements where applicable"],
  };
}

function deriveUrgencyExpectations(niche: LocalNiche): IntakeTemplate["urgencyExpectations"] {
  const isEmergency = isEmergencyNiche(niche);
  const isProject = isProjectNiche(niche);
  const label = niche.label.toLowerCase();

  if (isEmergency) {
    return {
      "emergency": {
        buttonLabel: `Right now — urgent ${label} issue`,
        expectedResponseTime: "within 60–90 minutes",
        slaTier: "emergency",
        closingNote: `Got it. Urgent ${label} calls go to the front of the queue. If nobody's claimed the lane in Erie, the concierge line at ${CONCIERGE_PHONE_DISPLAY} will route you to whoever can help fastest.`,
      },
      "this-week": {
        buttonLabel: "This week — it can wait a day or two",
        expectedResponseTime: "within 24 hours",
        slaTier: "next-day",
        closingNote: `Sounds good. A ${label} contractor will reach out within a business day.`,
      },
      "researching": {
        buttonLabel: "Just researching — no rush",
        expectedResponseTime: "within 2 business days",
        slaTier: "standard",
        closingNote: "Perfect, no rush. A contractor will follow up when they have time to give a thoughtful answer.",
      },
    };
  }

  if (isProject) {
    return {
      "emergency": {
        buttonLabel: "ASAP — ready to start soon",
        expectedResponseTime: "within 24 hours",
        slaTier: "same-day",
        closingNote: `Got it. Project-based work like ${label} usually starts with a quote — a contractor will reach out within 24 hours to schedule a site visit.`,
      },
      "this-week": {
        buttonLabel: "This week — getting quotes",
        expectedResponseTime: "within 2 business days",
        slaTier: "next-day",
        closingNote: "Sounds good. A contractor will be in touch to schedule a quote.",
      },
      "researching": {
        buttonLabel: "Just researching — planning ahead",
        expectedResponseTime: "within 3–5 business days",
        slaTier: "standard",
        closingNote: `Smart to plan ahead for a ${label} project. A contractor will follow up to discuss scope and timing.`,
      },
    };
  }

  // Default / professional services
  return {
    "emergency": {
      buttonLabel: "ASAP — need this soon",
      expectedResponseTime: "within 24 hours",
      slaTier: "same-day",
      closingNote: `Got it. A ${label} provider will get back to you within a business day.`,
    },
    "this-week": {
      buttonLabel: "This week — sometime soon",
      expectedResponseTime: "within 24–48 hours",
      slaTier: "next-day",
      closingNote: `Sounds good. A ${label} provider will reach out within a couple of business days.`,
    },
    "researching": {
      buttonLabel: "Just researching — exploring options",
      expectedResponseTime: "within 2–3 business days",
      slaTier: "standard",
      closingNote: "Perfect. A provider will follow up when they have time to give a thoughtful response.",
    },
  };
}

/**
 * Generate a complete, high-quality template from niche metadata.
 * Used for the ~107 niches without hand-tuned templates.
 */
export function generateTemplate(niche: LocalNiche): IntakeTemplate {
  return {
    nicheSlug: niche.slug,
    nicheLabel: niche.label,
    enabled: true,
    greeting: `Hi — I'll connect you with a ${niche.label.toLowerCase()} provider in Erie. What do you need help with?`,
    problemPlaceholder: "Describe what you need help with",
    problemSuggestions: deriveProblemSuggestions(niche),
    urgencyExpectations: deriveUrgencyExpectations(niche),
    priceHint: derivePriceHint(niche),
  };
}

// ── Public API ─────────────────────────────────────────────────────────

/** Final fallback when no niche data is available (e.g. homepage start). */
const FINAL_FALLBACK_TEMPLATE: IntakeTemplate = {
  nicheSlug: "unknown",
  nicheLabel: "service",
  enabled: true,
  greeting: "Hi — what kind of help do you need in Erie? Describe what's going on and I'll route you to the right local pro.",
  problemPlaceholder: "Describe what you need help with",
  problemSuggestions: [],
  urgencyExpectations: {
    "emergency": {
      buttonLabel: "Right now — urgent",
      expectedResponseTime: "within a few hours",
      slaTier: "emergency",
      closingNote: `Got it. We'll route this as urgent. If nobody's claimed your lane in Erie, the concierge at ${CONCIERGE_PHONE_DISPLAY} can help immediately.`,
    },
    "this-week": {
      buttonLabel: "This week",
      expectedResponseTime: "within 24 hours",
      slaTier: "next-day",
      closingNote: "Got it. A local provider will reach out within a business day.",
    },
    "researching": {
      buttonLabel: "Just researching",
      expectedResponseTime: "within 2 business days",
      slaTier: "standard",
      closingNote: "Perfect. A provider will follow up when they have time to give a thoughtful answer.",
    },
  },
  priceHint: {
    typical: "Varies by scope",
    low: "Service calls typically $95–$200",
    high: "Complex projects can run several thousand dollars",
    factors: ["Scope of work", "Materials", "Time involved", "Permit requirements where applicable"],
  },
};

/** Returns the template for a niche slug. Always succeeds (falls back). */
export function getIntakeTemplate(nicheSlug: string | null | undefined): IntakeTemplate {
  if (nicheSlug && HAND_TUNED_TEMPLATES[nicheSlug]) {
    return HAND_TUNED_TEMPLATES[nicheSlug];
  }
  if (nicheSlug) {
    const niche = getNicheBySlug(nicheSlug);
    if (niche) return generateTemplate(niche);
  }
  return FINAL_FALLBACK_TEMPLATE;
}

/** All niche slugs supported by the intake widget. Now: every niche in the registry. */
export const ENABLED_INTAKE_NICHES: ReadonlySet<string> = new Set(
  niches.map((n) => n.slug)
);

/** Slugs of niches with hand-tuned templates (used for analytics / QA spot-checks). */
export const HAND_TUNED_NICHE_SLUGS: ReadonlySet<string> = new Set(
  Object.keys(HAND_TUNED_TEMPLATES)
);

/** Whether the intake widget should be surfaced for this niche. True for every real niche. */
export function isIntakeEnabledForNiche(nicheSlug: string | null | undefined): boolean {
  if (!nicheSlug) return false;
  return ENABLED_INTAKE_NICHES.has(nicheSlug);
}

// Backwards-compat export for code that imported FIVE_NICHES
export const FIVE_NICHES = Object.values(HAND_TUNED_TEMPLATES);
