// ── Intake Widget Types ───────────────────────────────────────────────
// Type definitions for the conversational intake flow.
// The conversation is stepped (not free-form) to keep token costs predictable
// and data collection consistent. The LLM helps at problem-classification
// and empathetic-response generation; the rest is deterministic UI.

export type IntakeStep =
  | "problem"      // Free-text: "What's going on?"
  | "location"    // Deterministic: ZIP confirm
  | "urgency"     // Button: right now / this week / researching
  | "budget"      // Button: under $500 / $500-$2k / $2k+ / not sure (optional)
  | "contact"     // Form: name + phone + email + TCPA
  | "complete";   // Routing decision + handoff

export type IntakeUrgency = "emergency" | "this-week" | "researching";

export type IntakeBudget =
  | "under-500"
  | "500-2k"
  | "over-2k"
  | "not-sure"
  | "skipped";

export type IntakeContactPreference = "phone" | "sms" | "email";

export interface IntakeMessage {
  /** Who said this */
  role: "assistant" | "user" | "system";
  /** The message text */
  content: string;
  /** Optional structured action attached to the message (e.g. classify result) */
  meta?: Record<string, unknown>;
  /** Timestamp client-side (server stamps on persist) */
  at?: string;
}

/** The structured outcome of an intake conversation */
export interface IntakeOutcome {
  /** Classified primary niche slug (the one we're going to route on) */
  primaryNiche: string;
  /**
   * Confidence score 0-1 — the REAL value reported by the classifier for the
   * primary niche, or 0 when the classifier returned nothing. Never a synthetic
   * value (audit H3); use `routingDecision` to interpret why a low-confidence
   * pick won the route.
   */
  primaryNicheConfidence: number;
  /**
   * Which routing branch produced `primaryNiche`. Lets analytics bucket
   * `(decision, confidence)` cleanly rather than conflating "the classifier was
   * 0.6 sure" with "we fell back to the page hint."
   */
  routingDecision?:
    | "classifier-primary"
    | "candidate-override"
    | "hint"
    | "ambiguous";
  /** Secondary candidates the classifier considered (top 3 incl. primary) */
  candidateNiches: Array<{ slug: string; confidence: number; reason?: string }>;
  /** Customer's free-text problem description */
  problemDescription: string;
  /** Urgency bucket */
  urgency: IntakeUrgency;
  /** Budget bucket (or skipped) */
  budget: IntakeBudget;
  /** Where they are */
  zip?: string;
  /** Contact details */
  contact: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email: string;
    preference: IntakeContactPreference;
    tcpaConsent: boolean;
    tcpaText: string;
    tcpaVersion: string;
  };
}

/** Server-side conversation state, persisted to IntakeConversation table */
export interface IntakeConversationState {
  id: string;
  citySlug: string;
  startedFromNicheSlug: string | null;
  currentStep: IntakeStep;
  messages: IntakeMessage[];
  outcome: Partial<IntakeOutcome>;
  /** A/B variant served (cookie-driven) */
  variant: "intake" | "form";
  /** Created at */
  createdAt: string;
  /** Last interaction at */
  updatedAt: string;
}

// ── API contracts ───────────────────────────────────────────────────────

export interface IntakeStartRequest {
  /** Which niche page the user started on (for routing context); null for homepage */
  startedFromNicheSlug: string | null;
  /** Variant the client thinks it's in (echoed back for sanity) */
  variant: "intake" | "form";
}

export interface IntakeStartResponse {
  conversationId: string;
  step: IntakeStep;
  /** Initial assistant message to display */
  greeting: string;
}

export interface IntakeMessageRequest {
  conversationId: string;
  /** The step the user is responding TO (server validates) */
  forStep: IntakeStep;
  /** User-provided content for this step. Shape varies by step. */
  payload:
    | { kind: "problem"; text: string }
    | { kind: "location"; zip?: string }
    | { kind: "urgency"; urgency: IntakeUrgency }
    | { kind: "budget"; budget: IntakeBudget }
    | {
        kind: "contact";
        firstName?: string;
        lastName?: string;
        phone?: string;
        email: string;
        preference: IntakeContactPreference;
        tcpaConsent: boolean;
      };
}

export interface IntakeMessageResponse {
  conversationId: string;
  /** Next step the UI should advance to */
  nextStep: IntakeStep;
  /** Assistant message to display after the user's input */
  assistantReply: string;
  /** Optional candidate niches shown to user for problem-step confirmation */
  candidateNiches?: Array<{ slug: string; label: string; confidence: number }>;
  /** The niche slug the backend routed to (when known). Lets the UI show
   *  "did you mean?" alternatives by excluding the routed slug from
   *  candidateNiches. */
  routedNicheSlug?: string;
  /** Optional price hint shown to user post-urgency-step */
  priceHint?: {
    range: string;
    timeline: string;
    note?: string;
  };
}

export interface IntakeCompleteRequest {
  conversationId: string;
}

export interface IntakeCompleteResponse {
  conversationId: string;
  leadId: string;
  statusToken: string;
  /** What the customer should expect next */
  routing: {
    routeType: "claimed" | "concierge" | "queue";
    providerName?: string;
    expectedResponseTime: string;
    nextActionLabel: string;
    nextActionHref?: string;
  };
  /** Optional follow-up assistant message for the success state */
  closing: string;
}
