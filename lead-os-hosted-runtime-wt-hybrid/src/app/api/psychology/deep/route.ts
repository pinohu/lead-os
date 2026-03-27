import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  generateFearTrigger,
  mapPainToFear,
  generateDesireTrigger,
  mapAspirationToDesire,
  generateIdentityMessage,
  matchIdentityToOffer,
  generateDeepObjectionResponse,
  detectHiddenObjection,
  generateEmotionalSequence,
  type PersonaType,
  type FunnelStage,
} from "@/lib/deep-psychology";

type ActionType = "fear" | "desire" | "identity" | "objection" | "sequence";

const VALID_ACTIONS = new Set<ActionType>(["fear", "desire", "identity", "objection", "sequence"]);
const VALID_PERSONAS = new Set<PersonaType>([
  "decision-maker", "implementer", "researcher", "budget-holder", "innovator", "pragmatist",
]);
const VALID_STAGES = new Set<FunnelStage>(["top", "middle", "bottom"]);

const MAX_ARRAY_LENGTH = 20;
const MAX_STRING_LENGTH = 200;

function sanitizeString(value: unknown, maxLen: number = MAX_STRING_LENGTH): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLen) return null;
  return trimmed;
}

function sanitizeStringArray(value: unknown, maxLen: number = MAX_ARRAY_LENGTH): string[] | null {
  if (!Array.isArray(value)) return null;
  const result: string[] = [];
  for (const item of value.slice(0, maxLen)) {
    const s = sanitizeString(item);
    if (s) result.push(s);
  }
  return result.length > 0 ? result : null;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be a JSON object" }, meta: null },
        { status: 400, headers },
      );
    }

    const action = sanitizeString(body.action);
    if (!action || !VALID_ACTIONS.has(action as ActionType)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `action must be one of: ${[...VALID_ACTIONS].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    const niche = sanitizeString(body.niche) ?? "general";

    switch (action as ActionType) {
      case "fear": {
        const painPoint = sanitizeString(body.painPoint);
        const painPoints = sanitizeStringArray(body.painPoints);

        if (painPoints) {
          const triggers = mapPainToFear(niche, painPoints);
          return NextResponse.json({ data: { triggers }, error: null, meta: { action, niche } }, { headers });
        }

        if (painPoint) {
          const trigger = generateFearTrigger(niche, painPoint);
          return NextResponse.json({ data: { trigger }, error: null, meta: { action, niche } }, { headers });
        }

        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "painPoint or painPoints is required for fear action" }, meta: null },
          { status: 400, headers },
        );
      }

      case "desire": {
        const aspirations = sanitizeStringArray(body.aspirations);
        const segment = sanitizeString(body.segment);

        if (aspirations) {
          const triggers = generateDesireTrigger(niche, aspirations);
          return NextResponse.json({ data: { triggers }, error: null, meta: { action, niche } }, { headers });
        }

        if (segment) {
          const themes = mapAspirationToDesire(niche, segment);
          return NextResponse.json({ data: { themes }, error: null, meta: { action, niche, segment } }, { headers });
        }

        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "aspirations or segment is required for desire action" }, meta: null },
          { status: 400, headers },
        );
      }

      case "identity": {
        const persona = sanitizeString(body.persona);
        if (!persona || !VALID_PERSONAS.has(persona as PersonaType)) {
          return NextResponse.json(
            { data: null, error: { code: "VALIDATION_ERROR", message: `persona must be one of: ${[...VALID_PERSONAS].join(", ")}` }, meta: null },
            { status: 400, headers },
          );
        }

        const identityMessage = generateIdentityMessage(niche, persona as PersonaType);

        const offers = sanitizeStringArray(body.offers);
        const matchedOffers = offers ? matchIdentityToOffer(persona as PersonaType, offers) : undefined;

        return NextResponse.json(
          { data: { identity: identityMessage, matchedOffers }, error: null, meta: { action, niche, persona } },
          { headers },
        );
      }

      case "objection": {
        const objection = sanitizeString(body.objection);
        const messages = sanitizeStringArray(body.messages);
        const signals = Array.isArray(body.signals)
          ? body.signals
              .filter((s: unknown): s is { type: string } => typeof s === "object" && s !== null && typeof (s as Record<string, unknown>).type === "string")
              .slice(0, MAX_ARRAY_LENGTH)
          : undefined;

        const result: Record<string, unknown> = {};

        if (objection) {
          result.response = generateDeepObjectionResponse(objection, niche);
        }

        if (messages && signals) {
          result.hiddenObjections = detectHiddenObjection(messages, signals);
        }

        if (Object.keys(result).length === 0) {
          return NextResponse.json(
            { data: null, error: { code: "VALIDATION_ERROR", message: "objection or (messages + signals) required for objection action" }, meta: null },
            { status: 400, headers },
          );
        }

        return NextResponse.json({ data: result, error: null, meta: { action, niche } }, { headers });
      }

      case "sequence": {
        const stage = sanitizeString(body.funnelStage);
        if (!stage || !VALID_STAGES.has(stage as FunnelStage)) {
          return NextResponse.json(
            { data: null, error: { code: "VALIDATION_ERROR", message: `funnelStage must be one of: ${[...VALID_STAGES].join(", ")}` }, meta: null },
            { status: 400, headers },
          );
        }

        const sequence = generateEmotionalSequence(niche, stage as FunnelStage);
        return NextResponse.json({ data: { sequence }, error: null, meta: { action, niche, funnelStage: stage } }, { headers });
      }

      default:
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "Unknown action" }, meta: null },
          { status: 400, headers },
        );
    }
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "DEEP_PSYCHOLOGY_FAILED", message: "Failed to generate deep psychology elements" }, meta: null },
      { status: 400, headers },
    );
  }
}
