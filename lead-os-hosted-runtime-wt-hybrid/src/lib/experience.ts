import type { NicheDefinition } from "./catalog.ts";
import type { FunnelFamily } from "./runtime-schema.ts";

export type ExperienceMode =
  | "chat-first"
  | "form-first"
  | "calculator-first"
  | "webinar-first"
  | "booking-first";

export type ExperiencePromptOption = {
  id: string;
  label: string;
  description: string;
  signals: {
    wantsBooking?: boolean;
    wantsCheckout?: boolean;
    prefersChat?: boolean;
    contentEngaged?: boolean;
  };
};

export type ExperienceInput = {
  family?: FunnelFamily;
  niche: NicheDefinition;
  supportEmail?: string;
  source?: string;
  intent?: "discover" | "compare" | "solve-now";
  returning?: boolean;
  milestone?: string;
  preferredMode?: ExperienceMode | string;
  score?: number;
  userAgent?: string;
  referrer?: string;
};

export type ExperienceProfile = {
  family: FunnelFamily;
  mode: ExperienceMode;
  device: "mobile" | "desktop";
  experimentId: string;
  variantId: string;
  heroTitle: string;
  heroSummary: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
  trustPromise: string;
  progressLabel: string;
  anxietyReducer: string;
  proofSignals: string[];
  objectionBlocks: string[];
  discoveryPrompt: string;
  discoveryOptions: ExperiencePromptOption[];
  fieldOrder: Array<"firstName" | "email" | "phone" | "company">;
  progressSteps: Array<{ label: string; detail: string }>;
  supportingSignals: string[];
  returnOffer: string;
};

export const EXPERIENCE_HEURISTICS = [
  "Show one dominant next step and one safe fallback.",
  "Explain what happens after every action before asking for more data.",
  "Favor progressive profiling over long front-loaded forms.",
  "Mirror the visitor's niche, goal, and readiness in the copy.",
  "Use milestone-two and milestone-three return logic instead of one-touch conversion pressure.",
  "Keep visible proof close to the ask and anxiety relief close to the submit action.",
] as const;

const MODE_LABELS: Record<ExperienceMode, string> = {
  "chat-first": "Talk it through",
  "form-first": "Get a tailored plan",
  "calculator-first": "Estimate your upside",
  "webinar-first": "See the strategy first",
  "booking-first": "Book the fastest route",
};

function inferDeviceClass(userAgent?: string) {
  return /android|iphone|ipad|mobile/i.test(userAgent ?? "") ? "mobile" : "desktop";
}

function sanitizeMode(value?: string): ExperienceMode | null {
  switch (value) {
    case "chat-first":
    case "form-first":
    case "calculator-first":
    case "webinar-first":
    case "booking-first":
      return value;
    default:
      return null;
  }
}

function buildModeByContext(input: ExperienceInput): ExperienceMode {
  const explicitMode = sanitizeMode(input.preferredMode);
  if (explicitMode) return explicitMode;

  if (input.returning || input.milestone === "lead-m2-return-engaged") {
    return "form-first";
  }
  if (input.family === "qualification" || input.intent === "solve-now" || (input.score ?? 0) >= 85) {
    return "booking-first";
  }
  if (
    input.family === "chat" ||
    input.source === "chat" ||
    input.source === "messenger" ||
    inferDeviceClass(input.userAgent) === "mobile"
  ) {
    return "chat-first";
  }
  if (input.family === "webinar" || input.family === "authority" || input.source === "blog" || input.source === "content") {
    return "webinar-first";
  }
  if (
    input.family === "lead-magnet" &&
    (input.niche.calculatorBias === "revenue" || input.niche.calculatorBias === "time")
  ) {
    return "calculator-first";
  }
  return "form-first";
}

function buildDefaultFamily(input: ExperienceInput): FunnelFamily {
  if (input.family) return input.family;
  switch (buildModeByContext(input)) {
    case "booking-first":
      return "qualification";
    case "chat-first":
      return "chat";
    case "webinar-first":
      return "webinar";
    case "calculator-first":
      return "lead-magnet";
    case "form-first":
    default:
      return "lead-magnet";
  }
}

function buildDestination(family: FunnelFamily, niche: NicheDefinition) {
  switch (family) {
    case "qualification":
      return `/assess/${niche.slug}?mode=booking-first`;
    case "chat":
      return `/calculator?niche=${niche.slug}&mode=chat-first`;
    case "checkout":
      return `/offers/${niche.slug}?mode=form-first`;
    default:
      return `/funnel/${family}?niche=${niche.slug}`;
  }
}

function buildProofSignals(niche: NicheDefinition, family: FunnelFamily, mode: ExperienceMode) {
  return [
    `${niche.label} copy and next-step logic`,
    "Milestone-two and milestone-three return automation",
    family === "qualification" ? "Booking, proposal, and follow-up already wired" : "Multi-channel follow-up already wired",
    mode === "chat-first" ? "Low-friction conversational path" : "Adaptive form and content path",
  ];
}

function buildObjections(niche: NicheDefinition, mode: ExperienceMode) {
  const nicheSpecific =
    niche.slug === "legal" ? "You will not get a generic intake script. The questions adapt to risk, urgency, and case-fit." :
    niche.slug === "home-services" ? "We bias for fast-response booking and quote recovery so good jobs do not cool off." :
    niche.slug === "coaching" ? "The flow is built to protect show rate and fit, not just inflate call volume." :
    niche.slug === "construction" ? "Every step is designed around bid timelines, crew capacity, and project scope — not generic sales funnels." :
    niche.slug === "real-estate" ? "The system prioritizes speed-to-response and long-term nurture for leads who are not ready to transact today." :
    niche.slug === "tech" ? "We optimize for trial activation and product-led signals, not just demo bookings." :
    niche.slug === "education" ? "Enrollment journeys adapt to cohort timing, financial aid windows, and student readiness." :
    niche.slug === "finance" ? "Compliance-aware flows that protect your fiduciary obligations while still moving prospects forward." :
    niche.slug === "franchise" ? "Lead routing adapts to territory, location capacity, and brand compliance rules automatically." :
    niche.slug === "staffing" ? "Candidate and client pipelines run in parallel so placements do not stall waiting for either side." :
    niche.slug === "faith" ? "Every touchpoint is warm, community-centered, and respectful of the ministry relationship." :
    niche.slug === "creative" ? "The flow protects your creative process — qualifying on budget and scope before you invest time." :
    niche.slug === "health" ? "Patient journeys are HIPAA-conscious with scheduling, reminders, and reactivation built in." :
    niche.slug === "ecommerce" ? "We focus on cart recovery, lifetime value, and repeat purchase — not just first-click conversions." :
    niche.slug === "fitness" ? "Member journeys balance acquisition with retention so you are not always chasing new signups." :
    "The system adapts the next step so people do not get pushed into the wrong funnel.";

  const modeSpecific =
    mode === "booking-first" ? "If you are ready, we shorten the path and get you to the right booking action quickly." :
    mode === "webinar-first" ? "If you are skeptical, we show the proof and method before asking for a commitment." :
    mode === "chat-first" ? "If you dislike forms, you can still qualify through a guided conversation." :
    "If you are not ready yet, we keep the next ask light and useful.";

  return [nicheSpecific, modeSpecific];
}

function buildDiscoveryOptions(niche: NicheDefinition, family: FunnelFamily, mode: ExperienceMode): ExperiencePromptOption[] {
  const commonOptions: ExperiencePromptOption[] = [
    {
      id: "speed",
      label: "Move faster",
      description: "Reduce lag between interest and the next qualified action.",
      signals: { wantsBooking: family === "qualification", contentEngaged: family === "webinar" },
    },
    {
      id: "fit",
      label: "Improve lead quality",
      description: "Filter for higher-fit opportunities before the handoff.",
      signals: { contentEngaged: true },
    },
    {
      id: "follow-up",
      label: "Recover more opportunities",
      description: "Bring back warm prospects who would otherwise drift away.",
      signals: { prefersChat: mode === "chat-first" },
    },
  ];

  if (niche.slug === "legal") {
    return [
      {
        id: "intake",
        label: "Reduce intake drop-off",
        description: "Keep prospective clients moving without adding compliance risk.",
        signals: { wantsBooking: true },
      },
      {
        id: "case-fit",
        label: "Qualify higher-value cases",
        description: "Make your second touch feel relevant and serious.",
        signals: { contentEngaged: true },
      },
      commonOptions[2],
    ];
  }

  if (niche.slug === "home-services") {
    return [
      {
        id: "quotes",
        label: "Book more estimates",
        description: "Turn fast-response leads into more scheduled opportunities.",
        signals: { wantsBooking: true },
      },
      {
        id: "response",
        label: "Respond before competitors",
        description: "Shorten time-to-first-value for urgent homeowners.",
        signals: { prefersChat: true },
      },
      commonOptions[2],
    ];
  }

  if (niche.slug === "coaching") {
    return [
      {
        id: "show-rate",
        label: "Raise show rate",
        description: "Use better qualification and milestone-two trust events.",
        signals: { wantsBooking: true },
      },
      {
        id: "authority",
        label: "Warm skeptical prospects",
        description: "Lead with insight, proof, and selective friction.",
        signals: { contentEngaged: true },
      },
      commonOptions[2],
    ];
  }

  if (niche.slug === "construction") {
    return [
      { id: "bids", label: "Win more bids", description: "Automated follow-up so no profitable project goes cold.", signals: { wantsBooking: true } },
      { id: "scheduling", label: "Eliminate scheduling conflicts", description: "Crew coordination that prevents project overruns.", signals: { contentEngaged: true } },
      commonOptions[2],
    ];
  }

  if (niche.slug === "real-estate") {
    return [
      { id: "response", label: "Respond in under 5 minutes", description: "Speed-to-lead automation that beats every competitor.", signals: { wantsBooking: true } },
      { id: "nurture", label: "Nurture long-term leads", description: "Drip campaigns for buyers who are 6-12 months out.", signals: { contentEngaged: true } },
      commonOptions[2],
    ];
  }

  if (niche.slug === "tech") {
    return [
      { id: "activation", label: "Increase trial activation", description: "Automated onboarding that gets users to their aha moment.", signals: { contentEngaged: true } },
      { id: "churn", label: "Reduce churn", description: "Health scoring and engagement triggers before users leave.", signals: { wantsBooking: true } },
      commonOptions[2],
    ];
  }

  if (niche.slug === "education") {
    return [
      { id: "enrollment", label: "Enroll more students", description: "Admissions nurture that converts inquiries into enrolled students.", signals: { wantsBooking: true } },
      { id: "completion", label: "Improve completion rates", description: "Automated check-ins and intervention triggers.", signals: { contentEngaged: true } },
      commonOptions[2],
    ];
  }

  if (niche.slug === "finance") {
    return [
      { id: "onboarding", label: "Onboard clients faster", description: "Automated KYC and document collection that respects compliance.", signals: { wantsBooking: true } },
      { id: "retention", label: "Deepen client relationships", description: "Proactive touchpoints between review meetings.", signals: { contentEngaged: true } },
      commonOptions[2],
    ];
  }

  if (niche.slug === "franchise") {
    return [
      { id: "territory", label: "Unify lead routing", description: "Centralized distribution across every franchise territory.", signals: { wantsBooking: true } },
      { id: "compliance", label: "Enforce brand consistency", description: "Marketing compliance that scales with every new location.", signals: { contentEngaged: true } },
      commonOptions[2],
    ];
  }

  if (niche.slug === "staffing") {
    return [
      { id: "fill-rate", label: "Fill roles faster", description: "Automated sourcing and screening that cuts time-to-submittal.", signals: { wantsBooking: true } },
      { id: "reactivate", label: "Re-engage past candidates", description: "Talent pool nurture for new openings.", signals: { contentEngaged: true } },
      commonOptions[2],
    ];
  }

  if (niche.slug === "faith") {
    return [
      { id: "engagement", label: "Deepen congregation engagement", description: "Digital tools that strengthen community, not replace it.", signals: { contentEngaged: true } },
      { id: "giving", label: "Grow online giving", description: "Frictionless donation experience with transparent tracking.", signals: { wantsBooking: true } },
      commonOptions[2],
    ];
  }

  if (niche.slug === "creative") {
    return [
      { id: "intake", label: "Streamline project intake", description: "Creative brief automation that qualifies on budget and scope.", signals: { wantsBooking: true } },
      { id: "approvals", label: "Speed up client approvals", description: "Review workflows that eliminate bottlenecks.", signals: { contentEngaged: true } },
      commonOptions[2],
    ];
  }

  if (niche.slug === "health") {
    return [
      { id: "no-shows", label: "Reduce no-shows", description: "Multi-channel reminders that cut missed appointments by 40%.", signals: { wantsBooking: true } },
      { id: "reactivation", label: "Reactivate dormant patients", description: "Automated recall campaigns for patients overdue for care.", signals: { contentEngaged: true } },
      commonOptions[2],
    ];
  }

  if (niche.slug === "ecommerce") {
    return [
      { id: "conversion", label: "Increase store conversion", description: "Checkout optimization and cart recovery sequences.", signals: { wantsCheckout: true } },
      { id: "ltv", label: "Grow customer lifetime value", description: "Post-purchase nurture and repeat buyer automation.", signals: { contentEngaged: true } },
      commonOptions[2],
    ];
  }

  if (niche.slug === "fitness") {
    return [
      { id: "members", label: "Acquire more members", description: "Lead magnets and trial offers that convert prospects.", signals: { wantsBooking: true } },
      { id: "retention", label: "Keep members engaged", description: "Automated check-ins and community challenges.", signals: { contentEngaged: true } },
      commonOptions[2],
    ];
  }

  return commonOptions;
}

function buildProgressSteps(mode: ExperienceMode, family: FunnelFamily) {
  const stepTwo =
    mode === "chat-first" ? "We adapt the questions as answers come in." :
    mode === "calculator-first" ? "We turn your inputs into an immediate upside estimate." :
    mode === "webinar-first" ? "We surface the best proof and next learning asset first." :
    "We tailor the next step around your intent and milestone state.";

  const stepThree =
    family === "qualification" ? "Qualified visitors go straight to assessment, booking, or proposal." :
    family === "checkout" ? "High-intent visitors get the shortest path to the offer and recovery ladder." :
    "Your second-touch and third-touch follow-up paths are preloaded.";

  return [
    { label: "Tell us the outcome you want", detail: "One quick choice keeps the path relevant from the start." },
    { label: "See a tailored next step", detail: stepTwo },
    { label: "Keep momentum into visit two and three", detail: stepThree },
  ];
}

function buildFieldOrder(mode: ExperienceMode) {
  if (mode === "booking-first") {
    return ["firstName", "email", "phone", "company"] as const;
  }
  if (mode === "chat-first") {
    return ["firstName", "email", "phone"] as const;
  }
  return ["firstName", "email", "company", "phone"] as const;
}

export function resolveExperienceProfile(input: ExperienceInput): ExperienceProfile {
  const mode = buildModeByContext(input);
  const family = buildDefaultFamily(input);
  const device = inferDeviceClass(input.userAgent);
  const destination = buildDestination(family, input.niche);
  const returnOffer = input.returning
    ? "You are not starting over. We will resume with a lighter second-touch ask and skip repeated context."
    : "If you come back, LeadOS shifts from first-touch clarity into milestone-two trust building automatically.";

  return {
    family,
    mode,
    device,
    experimentId: `${input.niche.slug}:${family}:${device}`,
    variantId: `${input.niche.slug}:${family}:${mode}:${device}`,
    heroTitle:
      input.returning
        ? `${input.niche.label} momentum, resumed without friction`
        : `${input.niche.label} growth paths that adapt to visitor intent`,
    heroSummary:
      mode === "booking-first"
        ? "For ready-to-move buyers, we keep the path short, credible, and qualification-aware."
        : mode === "chat-first"
        ? "For lower-form-tolerance visitors, we lead with a conversation and still capture real buying signals."
        : mode === "webinar-first"
        ? "For skeptical or education-driven visitors, we build trust before the heavier ask."
        : mode === "calculator-first"
        ? "For outcome-focused visitors, we quantify upside first so the next step feels earned."
        : "For most qualified visitors, the fastest win is a tailored plan that explains exactly what happens next.",
    primaryActionLabel: MODE_LABELS[mode],
    primaryActionHref: destination,
    secondaryActionLabel: "Talk to a human",
    secondaryActionHref: `mailto:${input.supportEmail ?? "support@example.com"}`,
    trustPromise: "Every next step is personalized to your industry and goals. No generic templates.",
    progressLabel:
      input.returning
        ? "Welcome back. We remember where you left off."
        : "This takes less than 2 minutes. We only ask what we need.",
    anxietyReducer: "No commitment required. You can pause anytime or speak to a real person instead.",
    proofSignals: buildProofSignals(input.niche, family, mode),
    objectionBlocks: buildObjections(input.niche, mode),
    discoveryPrompt:
      mode === "calculator-first"
        ? "Which upside would make this worth exploring right now?"
        : "Which outcome matters most first?",
    discoveryOptions: buildDiscoveryOptions(input.niche, family, mode),
    fieldOrder: [...buildFieldOrder(mode)],
    progressSteps: buildProgressSteps(mode, family),
    supportingSignals: [
      input.referrer ? `Arrived from ${new URL(input.referrer).hostname}` : "Adaptive by source and referral context",
      device === "mobile" ? "Mobile-optimized path with lower cognitive load" : "Desktop path can support richer proof and comparison",
      returnOffer,
    ],
    returnOffer,
  };
}

export function buildExperienceManifest(niche: NicheDefinition) {
  return {
    heuristics: EXPERIENCE_HEURISTICS,
    supportedModes: ["chat-first", "form-first", "calculator-first", "webinar-first", "booking-first"],
    defaults: resolveExperienceProfile({ niche }),
  };
}
