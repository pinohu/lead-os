import { NextResponse } from "next/server";
import {
  clampText,
  enforceRateLimit,
  getRequestIdentity,
  isPlainObject,
  isValidEmail,
} from "@/lib/request-guards";

const AITABLE = {
  apiToken: process.env.AITABLE_API_TOKEN ?? "",
  datasheetId: process.env.AITABLE_DATASHEET_ID ?? "dstBicDQKC6gpLAMYj",
  apiBase: "https://aitable.ai/fusion/v1",
};

interface TrackEvent {
  visitorId: string;
  type: "page_view" | "scroll_depth" | "time_on_page" | "exit_intent" |
        "assessment_start" | "assessment_complete" | "chat_open" | "chat_message" |
        "roi_calculator" | "whatsapp_optin" | "referral_click" | "cta_click" |
        "return_visit" | "pricing_view" | "email_captured" | "phone_captured";
  page: string;
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
];

async function logToAITable(event: TrackEvent) {
  if (!AITABLE.apiToken) return;

  const title = `EVENT-${event.type.toUpperCase()} — ${event.page}`;
  const detail = event.data ? JSON.stringify(event.data).slice(0, 500) : "";

  await fetch(
    `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AITABLE.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [{
          fields: {
            Title: title,
            Scenario: "behavioral-tracking",
            Company: event.visitorId,
            "Contact Email": event.email ?? "",
            Status: `EVENT-${event.type.toUpperCase()}`,
            Touchpoint: event.type,
            "AI Generated": `Visitor ${event.visitorId} triggered ${event.type} on ${event.page}. ${detail}. Composite score: ${event.scores?.composite ?? "N/A"}`,
          },
        }],
        fieldKey: "name",
      }),
    }
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
      page: clampText(event.page, 240),
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

    // Log high-value events to AITable
    const highValueEvents = [
      "assessment_complete", "email_captured", "phone_captured",
      "roi_calculator", "whatsapp_optin", "pricing_view",
    ];

    if (highValueEvents.includes(safeEvent.type)) {
      await logToAITable(safeEvent);
    }

    return NextResponse.json({ success: true, tracked: safeEvent.type });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
