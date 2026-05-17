// ── Intake Conversation Orchestrator ──────────────────────────────────
// Pure logic for advancing an intake conversation one step at a time.
// API routes are thin shells around this module; tests target this module
// directly for fast iteration without HTTP overhead.

import { prisma } from "@/lib/db";
import { cityConfig } from "@/lib/city-config";
import { classifyNiche, composeProblemAck } from "./anthropic-client";
import { getIntakeTemplate } from "./templates";
import { getNicheBySlug } from "@/lib/niches";
import type {
  IntakeConversationState,
  IntakeMessage,
  IntakeMessageRequest,
  IntakeMessageResponse,
  IntakeOutcome,
  IntakeStartRequest,
  IntakeStartResponse,
  IntakeStep,
  IntakeUrgency,
} from "./types";

// TCPA consent text version — must match the version recorded on lead submission.
const TCPA_TEXT_V2 = (domain: string) =>
  `By submitting this form, I consent to be contacted by phone, text message, or email by a service provider regarding my service request. I understand that message and data rates may apply for text messages. I can opt out at any time by replying STOP to any text message or contacting us at hello@${domain}.`;
const TCPA_VERSION = "v2-2026-04-02";

// ── Start a conversation ─────────────────────────────────────────────

export async function startConversation(
  req: IntakeStartRequest,
  ipPrefix?: string
): Promise<IntakeStartResponse> {
  const template = getIntakeTemplate(req.startedFromNicheSlug);
  const greeting = template.greeting;

  const initialMessage: IntakeMessage = {
    role: "assistant",
    content: greeting,
    at: new Date().toISOString(),
  };

  const conversation = await prisma.intakeConversation.create({
    data: {
      citySlug: cityConfig.slug,
      startedFromNicheSlug: req.startedFromNicheSlug,
      currentStep: "problem",
      messages: [initialMessage] as unknown as object,
      outcome: {} as unknown as object,
      variant: req.variant === "form" ? "form" : "intake",
      outcomeStatus: "in_progress",
      ipPrefix: ipPrefix ?? null,
    },
  });

  return {
    conversationId: conversation.id,
    step: "problem",
    greeting,
  };
}

// ── Advance a conversation ───────────────────────────────────────────

/** Mapping of slaTier → milliseconds for Lead.slaDeadline */
const SLA_TIER_MS: Record<string, number> = {
  emergency: 1 * 60 * 60 * 1000, // 1 hour
  "same-day": 4 * 60 * 60 * 1000, // 4 hours
  "next-day": 24 * 60 * 60 * 1000, // 24 hours
  standard: 48 * 60 * 60 * 1000, // 48 hours
};

/** Next-step transition table. Source-of-truth for valid step progressions. */
const STEP_TRANSITIONS: Record<IntakeStep, IntakeStep> = {
  problem: "location",
  location: "urgency",
  urgency: "budget",
  budget: "contact",
  contact: "complete",
  complete: "complete",
};

/** Validate that the client is responding for the step the server thinks is current. */
function isValidStep(
  reqForStep: IntakeStep,
  serverCurrentStep: string
): boolean {
  return reqForStep === serverCurrentStep;
}

/** Persist + return the updated conversation state. */
async function updateConversation(
  id: string,
  patch: {
    currentStep?: IntakeStep;
    messages: IntakeMessage[];
    outcome: Partial<IntakeOutcome>;
    outcomeStatus?: string;
    leadId?: string;
  }
) {
  return prisma.intakeConversation.update({
    where: { id },
    data: {
      currentStep: patch.currentStep,
      messages: patch.messages as unknown as object,
      outcome: patch.outcome as unknown as object,
      outcomeStatus: patch.outcomeStatus,
      leadId: patch.leadId,
    },
  });
}

export async function advanceConversation(
  req: IntakeMessageRequest
): Promise<IntakeMessageResponse> {
  const convo = await prisma.intakeConversation.findUnique({
    where: { id: req.conversationId },
  });
  if (!convo) {
    throw new Error("conversation-not-found");
  }
  if (convo.outcomeStatus !== "in_progress") {
    throw new Error("conversation-not-active");
  }
  if (!isValidStep(req.forStep, convo.currentStep)) {
    throw new Error(
      `step-mismatch: server is on "${convo.currentStep}", client sent for "${req.forStep}"`
    );
  }

  const messages = (convo.messages as unknown as IntakeMessage[]) ?? [];
  const outcome = (convo.outcome as unknown as Partial<IntakeOutcome>) ?? {};

  // Process the user's input for the current step
  switch (req.payload.kind) {
    case "problem":
      return handleProblem(convo.id, req, messages, outcome, convo.startedFromNicheSlug);
    case "location":
      return handleLocation(convo.id, req, messages, outcome);
    case "urgency":
      return handleUrgency(convo.id, req, messages, outcome);
    case "budget":
      return handleBudget(convo.id, req, messages, outcome);
    case "contact":
      return handleContact(convo.id, req, messages, outcome);
    default: {
      const _exhaustive: never = req.payload;
      throw new Error(`unknown-payload-kind: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

// ── Niche-routing decision (pure; exported for testing) ──────────────
//
// Three signals are in play:
//   1. `classifyResult.primary` — the top candidate IF its confidence ≥ 0.4
//   2. `classifyResult.candidates[]` — ranked list including sub-threshold matches
//   3. `hintedNicheSlug` — the page the customer was browsing
//
// The previous logic silently used the page hint whenever `primary` was null.
// That broke when the classifier had real-but-sub-threshold signal pointing
// elsewhere: a customer on /dental typing "my toilet is leaking" got routed
// to dental even though the classifier flagged plumbing at 0.3.
//
// The decision tree:
//   • `primary` set → use it (high-confidence classifier).
//   • Candidates explicitly disagree with hint AND top candidate ≥ 0.25 →
//     route to candidate ("candidate-override").
//   • Hint matches a candidate, or no candidates exist → use hint.
//   • No signal at all (no candidates, no hint) → ambiguous (ask rephrase).
//
// The caller is responsible for surfacing `candidateNiches` so the UI can
// show a "did you mean?" prompt regardless of which branch fires.
export type RoutingDecision =
  | "classifier-primary"
  | "hint"
  | "candidate-override"
  | "ambiguous";

export function decideNicheRouting(
  classifyResult: {
    primary: string | null;
    candidates: Array<{ slug: string; confidence: number; reason?: string }>;
  },
  hintedNicheSlug: string | null
): { primaryNiche: string | null; decision: RoutingDecision } {
  const candidates = classifyResult.candidates ?? [];
  const topCandidate = candidates[0] ?? null;
  const hintInCandidates = hintedNicheSlug
    ? candidates.some((c) => c.slug === hintedNicheSlug)
    : false;
  const candidatesDisagreeWithHint = !!(
    hintedNicheSlug &&
    topCandidate &&
    !hintInCandidates &&
    topCandidate.confidence >= 0.25
  );

  if (classifyResult.primary) {
    return { primaryNiche: classifyResult.primary, decision: "classifier-primary" };
  }
  if (candidatesDisagreeWithHint && topCandidate) {
    return { primaryNiche: topCandidate.slug, decision: "candidate-override" };
  }
  if (hintedNicheSlug) {
    // Hint exists; classifier signal (if any) wasn't strong enough to override.
    return { primaryNiche: hintedNicheSlug, decision: "hint" };
  }
  return { primaryNiche: null, decision: "ambiguous" };
}

// ── Step handlers ────────────────────────────────────────────────────

async function handleProblem(
  conversationId: string,
  req: IntakeMessageRequest,
  messages: IntakeMessage[],
  outcome: Partial<IntakeOutcome>,
  startedFromNicheSlug: string | null
): Promise<IntakeMessageResponse> {
  if (req.payload.kind !== "problem") throw new Error("unreachable");
  const problemText = req.payload.text.trim();

  if (problemText.length < 3) {
    throw new Error("problem-too-short");
  }

  // Classify in parallel with composing the empathetic reply.
  const [classifyResult, hintedTemplate] = await Promise.all([
    classifyNiche(problemText, startedFromNicheSlug),
    Promise.resolve(getIntakeTemplate(startedFromNicheSlug)),
  ]);

  // ── Niche-routing decision ──────────────────────────────────────────
  const routing = decideNicheRouting(classifyResult, startedFromNicheSlug);
  const primaryNiche = routing.primaryNiche;
  const routingDecision = routing.decision;
  const candidates = classifyResult.candidates ?? [];
  const topCandidate = candidates[0] ?? null;

  if (!primaryNiche) {
    // Couldn't route to any niche; ask the customer to rephrase.
    // If the classifier had a low-confidence candidate, surface it as a "did
    // you mean?" prompt rather than the generic rephrase fallback.
    let askContent: string;
    if (topCandidate) {
      const candidateLabel =
        getNicheBySlug(topCandidate.slug)?.label ?? topCandidate.slug;
      askContent = `Just to make sure — does this sound like a ${candidateLabel.toLowerCase()} issue, or did you mean something else? You can rephrase or pick one of: ${candidates
        .slice(0, 3)
        .map((c) => getNicheBySlug(c.slug)?.label ?? c.slug)
        .join(", ")}.`;
    } else {
      askContent =
        "Sorry — I'm not sure which service that falls under. Could you say it a different way? For example, 'leaking pipe' or 'no heat' or 'roof damage'.";
    }
    const askAgain: IntakeMessage = {
      role: "assistant",
      content: askContent,
      at: new Date().toISOString(),
    };
    const userEcho: IntakeMessage = {
      role: "user",
      content: problemText,
      at: new Date().toISOString(),
    };
    await updateConversation(conversationId, {
      messages: [...messages, userEcho, askAgain],
      outcome,
    });
    return {
      conversationId,
      nextStep: "problem",
      assistantReply: askAgain.content,
      candidateNiches: candidates.slice(0, 3).map((c) => ({
        slug: c.slug,
        label: getNicheBySlug(c.slug)?.label ?? c.slug,
        confidence: c.confidence,
      })),
    };
  }

  const matchedNiche = getNicheBySlug(primaryNiche);
  const matchedLabel = matchedNiche?.label ?? hintedTemplate.nicheLabel;
  const ackReply = await composeProblemAck(problemText, matchedLabel);

  const updatedOutcome: Partial<IntakeOutcome> = {
    ...outcome,
    primaryNiche,
    primaryNicheConfidence:
      classifyResult.candidates[0]?.confidence ??
      (routingDecision === "hint" ? 0.6 : 0.5),
    candidateNiches: classifyResult.candidates.map((c) => ({
      slug: c.slug,
      confidence: c.confidence,
      reason: c.reason,
    })),
    problemDescription: problemText,
  };

  const userEcho: IntakeMessage = {
    role: "user",
    content: problemText,
    at: new Date().toISOString(),
  };
  const assistantMsg: IntakeMessage = {
    role: "assistant",
    content: ackReply,
    meta: { matchedNiche: primaryNiche, classifierSource: classifyResult.source },
    at: new Date().toISOString(),
  };

  await updateConversation(conversationId, {
    currentStep: STEP_TRANSITIONS.problem,
    messages: [...messages, userEcho, assistantMsg],
    outcome: updatedOutcome,
  });

  // Provide top candidate niches for client to optionally show as "did you mean?"
  const candidateNiches = classifyResult.candidates.slice(0, 3).map((c) => ({
    slug: c.slug,
    label: getNicheBySlug(c.slug)?.label ?? c.slug,
    confidence: c.confidence,
  }));

  return {
    conversationId,
    nextStep: "location",
    assistantReply: ackReply,
    candidateNiches,
  };
}

async function handleLocation(
  conversationId: string,
  req: IntakeMessageRequest,
  messages: IntakeMessage[],
  outcome: Partial<IntakeOutcome>
): Promise<IntakeMessageResponse> {
  if (req.payload.kind !== "location") throw new Error("unreachable");

  const zip = (req.payload.zip ?? "").replace(/\D/g, "").slice(0, 5);
  const isValidZip = zip.length === 5;
  const acknowledged = isValidZip
    ? `Got it, ${zip}. How urgent is this?`
    : `OK — assuming you're in the ${cityConfig.name} area. How urgent is this?`;

  const userEcho: IntakeMessage = {
    role: "user",
    content: isValidZip ? zip : "(no zip provided)",
    at: new Date().toISOString(),
  };
  const assistantMsg: IntakeMessage = {
    role: "assistant",
    content: acknowledged,
    at: new Date().toISOString(),
  };

  await updateConversation(conversationId, {
    currentStep: STEP_TRANSITIONS.location,
    messages: [...messages, userEcho, assistantMsg],
    outcome: { ...outcome, zip: isValidZip ? zip : undefined },
  });

  return {
    conversationId,
    nextStep: "urgency",
    assistantReply: acknowledged,
  };
}

async function handleUrgency(
  conversationId: string,
  req: IntakeMessageRequest,
  messages: IntakeMessage[],
  outcome: Partial<IntakeOutcome>
): Promise<IntakeMessageResponse> {
  if (req.payload.kind !== "urgency") throw new Error("unreachable");
  const urgency: IntakeUrgency = req.payload.urgency;

  const matchedNiche = outcome.primaryNiche ?? null;
  const template = getIntakeTemplate(matchedNiche);
  const expectation = template.urgencyExpectations[urgency];
  const closingNote = expectation.closingNote;

  const priceHint = {
    range: template.priceHint.typical,
    timeline: expectation.expectedResponseTime,
    note: `Most ${template.nicheLabel.toLowerCase()} jobs in Erie run ${template.priceHint.low}; complex ones can reach ${template.priceHint.high}. Final price depends on: ${template.priceHint.factors.slice(0, 2).join("; ")}.`,
  };

  const userEcho: IntakeMessage = {
    role: "user",
    content: expectation.buttonLabel,
    at: new Date().toISOString(),
  };
  const assistantMsg: IntakeMessage = {
    role: "assistant",
    content: closingNote,
    meta: { priceHint },
    at: new Date().toISOString(),
  };

  await updateConversation(conversationId, {
    currentStep: STEP_TRANSITIONS.urgency,
    messages: [...messages, userEcho, assistantMsg],
    outcome: { ...outcome, urgency },
  });

  return {
    conversationId,
    nextStep: "budget",
    assistantReply: closingNote,
    priceHint,
  };
}

async function handleBudget(
  conversationId: string,
  req: IntakeMessageRequest,
  messages: IntakeMessage[],
  outcome: Partial<IntakeOutcome>
): Promise<IntakeMessageResponse> {
  if (req.payload.kind !== "budget") throw new Error("unreachable");
  const budget = req.payload.budget;

  const ack =
    budget === "skipped"
      ? "No problem. Last thing — how should the contractor reach you?"
      : "Thanks. Last thing — how should the contractor reach you?";

  const userEcho: IntakeMessage = {
    role: "user",
    content: budget,
    at: new Date().toISOString(),
  };
  const assistantMsg: IntakeMessage = {
    role: "assistant",
    content: ack,
    at: new Date().toISOString(),
  };

  await updateConversation(conversationId, {
    currentStep: STEP_TRANSITIONS.budget,
    messages: [...messages, userEcho, assistantMsg],
    outcome: { ...outcome, budget },
  });

  return {
    conversationId,
    nextStep: "contact",
    assistantReply: ack,
  };
}

async function handleContact(
  conversationId: string,
  req: IntakeMessageRequest,
  messages: IntakeMessage[],
  outcome: Partial<IntakeOutcome>
): Promise<IntakeMessageResponse> {
  if (req.payload.kind !== "contact") throw new Error("unreachable");
  const c = req.payload;

  if (!c.email || !c.tcpaConsent) {
    throw new Error("contact-validation-failed");
  }

  const userEcho: IntakeMessage = {
    role: "user",
    content: `${c.firstName ?? ""} ${c.lastName ?? ""} — ${c.email} — ${c.phone ?? "no phone"}`.trim(),
    at: new Date().toISOString(),
  };
  const closingAck: IntakeMessage = {
    role: "assistant",
    content: "Connecting you now. One moment.",
    at: new Date().toISOString(),
  };

  const updatedOutcome: Partial<IntakeOutcome> = {
    ...outcome,
    contact: {
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      email: c.email,
      preference: c.preference,
      tcpaConsent: c.tcpaConsent,
      tcpaText: TCPA_TEXT_V2(cityConfig.domain),
      tcpaVersion: TCPA_VERSION,
    },
  };

  await updateConversation(conversationId, {
    currentStep: STEP_TRANSITIONS.contact,
    messages: [...messages, userEcho, closingAck],
    outcome: updatedOutcome,
  });

  return {
    conversationId,
    nextStep: "complete",
    assistantReply: closingAck.content,
  };
}

// ── SLA tier helpers (used by complete route) ──────────────────────────

export function slaDeadlineForUrgency(
  niche: string | null | undefined,
  urgency: IntakeUrgency | undefined
): Date | null {
  if (!urgency) return null;
  const template = getIntakeTemplate(niche);
  const expectation = template.urgencyExpectations[urgency];
  const ms = SLA_TIER_MS[expectation.slaTier];
  return ms ? new Date(Date.now() + ms) : null;
}

export function temperatureForUrgency(
  urgency: IntakeUrgency | undefined
): "hot" | "warm" | "cold" {
  switch (urgency) {
    case "emergency":
      return "hot";
    case "this-week":
      return "warm";
    case "researching":
    default:
      return "cold";
  }
}

export { TCPA_TEXT_V2, TCPA_VERSION };
