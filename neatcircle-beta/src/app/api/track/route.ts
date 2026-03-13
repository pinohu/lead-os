import { NextResponse } from "next/server";
import { embeddedSecrets } from "@/lib/embedded-secrets";
import {
  clampText,
  enforceRateLimit,
  getRequestIdentity,
  isPlainObject,
  isValidEmail,
} from "@/lib/request-guards";
import { buildLeadKey } from "@/lib/trace";

const AITABLE = {
  apiToken: process.env.AITABLE_API_TOKEN ?? embeddedSecrets.aitable.apiToken,
  datasheetId: process.env.AITABLE_DATASHEET_ID ?? embeddedSecrets.aitable.datasheetId,
  apiBase: "https://aitable.ai/fusion/v1",
};

interface TrackEvent {
  visitorId: string;
  type:
    | "page_view"
    | "scroll_depth"
    | "time_on_page"
    | "exit_intent"
    | "assessment_start"
    | "assessment_complete"
    | "chat_open"
    | "chat_message"
    | "roi_calculator"
    | "whatsapp_optin"
    | "referral_click"
    | "cta_click"
    | "return_visit"
    | "pricing_view"
    | "email_captured"
    | "phone_captured"
    | "hero_impression"
    | "hero_cta"
    | "decision_generated"
    | "funnel_step_view";
  sessionId?: string;
  leadKey?: string;
  page: string;
  source?: string;
  service?: string;
  niche?: string;
  blueprintId?: string;
  stepId?: string;
  experimentId?: string;
  variantId?: string;
  data?: Record<string, unknown>;
  scores?: { engagement: number; intent: number; fit: number; urgency: number; composite: number };
  email?: string;
  timestamp: string;
}

const VALID_TRACK_TYPES: TrackEvent["type"][] = [
  "page_view",
  "scroll_depth",
  "time_on_page",
  "exit_intent",
  "assessment_start",
  "assessment_complete",
  "chat_open",
  "chat_message",
  "roi_calculator",
  "whatsapp_optin",
  "referral_click",
  "cta_click",
  "return_visit",
  "pricing_view",
  "email_captured",
  "phone_captured",
  "hero_impression",
  "hero_cta",
  "decision_generated",
  "funnel_step_view",
];

async function logToAITable(event: TrackEvent) {
  if (!AITABLE.apiToken) return;

  const title = `EVENT-${event.type.toUpperCase()} - ${event.page}`;
  const detail = JSON.stringify({
    kind: "event",
    eventType: event.type,
    trace: {
      visitorId: event.visitorId,
      sessionId: event.sessionId,
      leadKey: event.leadKey,
      page: event.page,
      source: event.source,
      service: event.service,
      niche: event.niche,
      blueprintId: event.blueprintId,
      stepId: event.stepId,
      experimentId: event.experimentId,
      variantId: event.variantId,
      timestamp: event.timestamp,
    },
    data: event.data ?? {},
    scores: event.scores,
  }).slice(0, 900);

  await fetch(
    `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AITABLE.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Title: title,
              Scenario: event.service ?? event.niche ?? "behavioral-tracking",
              Company: event.visitorId,
              "Contact Email": event.email ?? "",
              Status: `EVENT-${event.type.toUpperCase()}`,
              Touchpoint: event.type,
              "AI Generated": detail,
            },
          },
        ],
        fieldKey: "name",
      }),
    },
  ).catch(() => {});
}

export async function POST(request: Request) {
  try {
    const identity = getRequestIdentity(request);
    const rateLimit = enforceRateLimit(`track:${identity}`, 120, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many tracking requests" }, { status: 429 });
    }

    const event = (await request.json()) as TrackEvent;
    if (!isPlainObject(event)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!event.visitorId || !event.type) {
      return NextResponse.json({ error: "Missing visitorId or type" }, { status: 400 });
    }
    if (!VALID_TRACK_TYPES.includes(event.type)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }
    if (typeof event.page !== "string" || event.page.length > 240) {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }
    if (event.email && !isValidEmail(event.email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const safeEvent: TrackEvent = {
      ...event,
      visitorId: clampText(event.visitorId, 120),
      sessionId: clampText(event.sessionId, 120) || undefined,
      leadKey: clampText(event.leadKey, 160) || buildLeadKey(event.email),
      page: clampText(event.page, 240),
      source: clampText(event.source, 80) || undefined,
      service: clampText(event.service, 120) || undefined,
      niche: clampText(event.niche, 120) || undefined,
      blueprintId: clampText(event.blueprintId, 120) || undefined,
      stepId: clampText(event.stepId, 120) || undefined,
      experimentId: clampText(event.experimentId, 120) || undefined,
      variantId: clampText(event.variantId, 120) || undefined,
      email: event.email?.trim().toLowerCase(),
      data: isPlainObject(event.data) ? event.data : undefined,
      scores: event.scores
        ? {
            engagement: Math.max(0, Math.min(event.scores.engagement, 100)),
            intent: Math.max(0, Math.min(event.scores.intent, 100)),
            fit: Math.max(0, Math.min(event.scores.fit, 100)),
            urgency: Math.max(0, Math.min(event.scores.urgency, 100)),
            composite: Math.max(0, Math.min(event.scores.composite, 100)),
          }
        : undefined,
    };

    await logToAITable(safeEvent);

    return NextResponse.json({ success: true, tracked: safeEvent.type });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
