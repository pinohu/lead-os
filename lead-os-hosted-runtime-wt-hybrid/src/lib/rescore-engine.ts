import {
  computeCompositeScore,
  classifyLeadTemperature,
  type ScoringContext,
} from "./scoring-engine.ts";
import {
  getContext,
  updateContext,
  type LeadContext,
  type LeadContextScores,
} from "./context-engine.ts";

export interface RescoreEvent {
  type:
    | "email-open"
    | "email-click"
    | "page-view"
    | "return-visit"
    | "form-submit"
    | "chat-message"
    | "assessment-complete"
    | "booking-request";
  metadata?: Record<string, unknown>;
}

export interface RescoreResult {
  leadKey: string;
  previousScores: LeadContextScores;
  newScores: LeadContextScores;
  routeChanged: boolean;
  previousRoute: string;
  newRoute: string;
  shouldEscalate: boolean;
}

const INTERACTION_BOOSTS: Record<
  string,
  { intent: number; engagement: number; urgency: number }
> = {
  "email-open": { intent: 2, engagement: 5, urgency: 0 },
  "email-click": { intent: 5, engagement: 8, urgency: 3 },
  "page-view": { intent: 1, engagement: 3, urgency: 0 },
  "return-visit": { intent: 8, engagement: 10, urgency: 5 },
  "form-submit": { intent: 15, engagement: 12, urgency: 10 },
  "chat-message": { intent: 10, engagement: 8, urgency: 5 },
  "assessment-complete": { intent: 20, engagement: 15, urgency: 8 },
  "booking-request": { intent: 25, engagement: 20, urgency: 20 },
};

const ESCALATION_THRESHOLD = 85;
const CONVERSION_ROUTE_THRESHOLD = 60;
const FAST_TRACK_THRESHOLD = 80;

export function getInteractionBoost(
  eventType: string,
): { intent: number; engagement: number; urgency: number } {
  return INTERACTION_BOOSTS[eventType] ?? { intent: 0, engagement: 0, urgency: 0 };
}

export function shouldReroute(oldScore: number, newScore: number): boolean {
  if (oldScore < CONVERSION_ROUTE_THRESHOLD && newScore >= CONVERSION_ROUTE_THRESHOLD) return true;
  if (oldScore < FAST_TRACK_THRESHOLD && newScore >= FAST_TRACK_THRESHOLD) return true;
  return false;
}

function determineRoute(composite: number): LeadContext["currentRoute"] {
  if (composite >= FAST_TRACK_THRESHOLD) return "fast-track";
  if (composite >= CONVERSION_ROUTE_THRESHOLD) return "conversion";
  if (composite >= 30) return "nurture";
  return "drip";
}

function capScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function rescoreLead(
  leadKey: string,
  event: RescoreEvent,
): Promise<RescoreResult | null> {
  const ctx = await getContext(leadKey);
  if (!ctx) return null;

  const previousScores: LeadContextScores = { ...ctx.scores };
  const previousRoute = ctx.currentRoute;

  const boost = getInteractionBoost(event.type);

  const newIntent = capScore(ctx.scores.intent + boost.intent);
  const newEngagement = capScore(ctx.scores.engagement + boost.engagement);
  const newUrgency = capScore(ctx.scores.urgency + boost.urgency);

  const scoringCtx: ScoringContext = {
    source: ctx.source,
    niche: ctx.niche,
  };
  const compositeResult = computeCompositeScore(scoringCtx);
  const baseComposite = compositeResult.score;

  const boostComposite =
    boost.intent * 0.3 + boost.engagement * 0.25 + boost.urgency * 0.2;
  const newComposite = capScore(ctx.scores.composite + boostComposite);

  const newTemperature = classifyLeadTemperature(newComposite);

  const newScores: LeadContextScores = {
    intent: newIntent,
    fit: ctx.scores.fit,
    engagement: newEngagement,
    urgency: newUrgency,
    composite: newComposite,
    temperature: newTemperature,
  };

  const routeChanged = shouldReroute(previousScores.composite, newComposite);
  const newRoute = routeChanged ? determineRoute(newComposite) : previousRoute;
  const shouldEscalateFlag = newComposite > ESCALATION_THRESHOLD;

  const update: Record<string, unknown> = {
    scores: newScores,
  };

  if (routeChanged) {
    update.currentRoute = newRoute;
  }

  if (shouldEscalateFlag && !ctx.escalated) {
    update.escalated = true;
  }

  updateContext(leadKey, update);

  return {
    leadKey,
    previousScores,
    newScores,
    routeChanged,
    previousRoute,
    newRoute,
    shouldEscalate: shouldEscalateFlag,
  };
}
