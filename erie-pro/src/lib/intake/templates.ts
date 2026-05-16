// ── Per-Niche Intake Templates ────────────────────────────────────────
// Per-niche conversation copy and pricing context for the intake widget.
// Five niches enabled for the v1 launch; the wrapper falls back to a
// generic template for the other 109 niches until they're tuned.

import { getNicheBySlug } from "@/lib/niches";
import type { IntakeUrgency } from "./types";

export interface IntakeTemplate {
  /** Niche slug this template applies to */
  nicheSlug: string;
  /** Display label (matches niches.ts) */
  nicheLabel: string;
  /** Whether this niche is "live" in the intake widget (enabled for the v1 launch) */
  enabled: boolean;
  /** Empathetic opening line on the problem step. {label} = niche label. */
  greeting: string;
  /** Placeholder text for the problem free-text field */
  problemPlaceholder: string;
  /** Example "problem" texts shown as suggestion chips */
  problemSuggestions: string[];
  /** Per-urgency expectation copy. Used to compose the assistant reply after urgency selection. */
  urgencyExpectations: Record<IntakeUrgency, {
    /** Short label shown on the urgency button */
    buttonLabel: string;
    /** Customer-facing expected response time */
    expectedResponseTime: string;
    /** Internal SLA tier — feeds into Lead.slaDeadline */
    slaTier: "emergency" | "same-day" | "next-day" | "standard";
    /** Closing message after they pick urgency */
    closingNote: string;
  }>;
  /** Price hint range — used in the assistant reply after urgency, and on the niche page */
  priceHint: {
    typical: string;
    low: string;
    high: string;
    factors: string[];
  };
}

const FIVE_NICHES: IntakeTemplate[] = [
  {
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
        closingNote: "Got it. Emergency plumbing calls go to the front of the queue. If nobody's claimed the lane, the concierge line at (814) 200-0328 will route you to whoever's on call right now.",
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
  {
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
        closingNote: "No-heat-in-winter and no-AC-in-summer are real emergencies. If nobody's claimed the lane, the concierge line at (814) 200-0328 will help right away.",
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
  {
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
        closingNote: "Sparks or burning smells are real safety issues. If you're seeing either, also call your local utility's emergency line. The concierge at (814) 200-0328 can route you to whoever's on call.",
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
  {
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
        closingNote: "Active leaks compound fast. If a roofer can't be there in hours, ask about emergency tarping. The concierge at (814) 200-0328 can route you to someone equipped for that.",
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
  {
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
        closingNote: "Every hour after water intrusion increases mold and structural risk. Restoration companies typically run 24/7 — the concierge at (814) 200-0328 will route you to whoever can be on-site fastest.",
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
];

const GENERIC_TEMPLATE: Omit<IntakeTemplate, "nicheSlug" | "nicheLabel"> = {
  enabled: false, // Don't surface the widget for non-tuned niches yet
  greeting: "Hi — I'll connect you with a {label} contractor in Erie. What's going on?",
  problemPlaceholder: "Describe what you need help with",
  problemSuggestions: [],
  urgencyExpectations: {
    "emergency": {
      buttonLabel: "Right now",
      expectedResponseTime: "within a few hours",
      slaTier: "emergency",
      closingNote: "Got it. We'll route this as urgent.",
    },
    "this-week": {
      buttonLabel: "This week",
      expectedResponseTime: "within 24 hours",
      slaTier: "next-day",
      closingNote: "Got it. A contractor will reach out within a business day.",
    },
    "researching": {
      buttonLabel: "Just researching",
      expectedResponseTime: "within 2 business days",
      slaTier: "standard",
      closingNote: "Perfect. A contractor will follow up when they have time to give a thoughtful answer.",
    },
  },
  priceHint: {
    typical: "Varies by scope",
    low: "Service-call diagnostics often $95–$200",
    high: "Full projects can run several thousand dollars",
    factors: ["Scope of work", "Materials", "Time involved", "Permit requirements"],
  },
};

const TEMPLATES: Record<string, IntakeTemplate> = Object.fromEntries(
  FIVE_NICHES.map((t) => [t.nicheSlug, t])
);

/** Returns the template for a niche slug, or a generic fallback. */
export function getIntakeTemplate(nicheSlug: string | null | undefined): IntakeTemplate {
  if (nicheSlug && TEMPLATES[nicheSlug]) return TEMPLATES[nicheSlug];

  // Fallback: synthesize a template from niche data
  const fromRegistry = nicheSlug ? getNicheBySlug(nicheSlug) : null;
  const label = fromRegistry?.label ?? "service";
  return {
    ...GENERIC_TEMPLATE,
    nicheSlug: nicheSlug ?? "unknown",
    nicheLabel: label,
    greeting: GENERIC_TEMPLATE.greeting.replace("{label}", label.toLowerCase()),
  };
}

/** Slugs of niches where the intake widget is fully tuned and enabled. */
export const ENABLED_INTAKE_NICHES: ReadonlySet<string> = new Set(
  FIVE_NICHES.filter((t) => t.enabled).map((t) => t.nicheSlug)
);

/** Whether to surface the intake widget for this niche, given the feature flag. */
export function isIntakeEnabledForNiche(nicheSlug: string | null | undefined): boolean {
  if (!nicheSlug) return false;
  return ENABLED_INTAKE_NICHES.has(nicheSlug);
}

export { FIVE_NICHES };
