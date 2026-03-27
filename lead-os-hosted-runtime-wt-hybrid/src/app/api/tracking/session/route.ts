import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  createSession,
  recordPageView,
  recordEvent,
  buildVisitorProfile,
  type VisitorSession,
  type DeviceInfo,
  type UtmParams,
} from "@/lib/visitor-tracking";
import { createRateLimiter } from "@/lib/rate-limiter";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 120 });

const sessionStore = new Map<string, VisitorSession>();
const visitorSessionIndex = new Map<string, Set<string>>();

const MAX_STRING_LENGTH = 200;
const MAX_SESSIONS_PER_VISITOR = 100;
const VALID_DEVICE_TYPES = new Set(["desktop", "mobile", "tablet"]);
const VALID_ACTIONS = new Set(["create", "pageview", "event"]);

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function sanitizeString(value: unknown, maxLen: number = MAX_STRING_LENGTH): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLen) return undefined;
  return trimmed;
}

function sanitizeNumber(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function parseDeviceInfo(raw: unknown): DeviceInfo | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  const type = sanitizeString(obj.type);
  if (!type || !VALID_DEVICE_TYPES.has(type)) return null;

  return {
    type: type as DeviceInfo["type"],
    browser: sanitizeString(obj.browser) ?? "unknown",
    os: sanitizeString(obj.os) ?? "unknown",
    screenWidth: sanitizeNumber(obj.screenWidth, 0, 10000),
    screenHeight: sanitizeNumber(obj.screenHeight, 0, 10000),
  };
}

function parseUtmParams(raw: unknown): UtmParams | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const obj = raw as Record<string, unknown>;
  return {
    source: sanitizeString(obj.source),
    medium: sanitizeString(obj.medium),
    campaign: sanitizeString(obj.campaign),
    term: sanitizeString(obj.term),
    content: sanitizeString(obj.content),
  };
}

function indexSession(visitorId: string, sessionId: string): void {
  let ids = visitorSessionIndex.get(visitorId);
  if (!ids) {
    ids = new Set();
    visitorSessionIndex.set(visitorId, ids);
  }
  ids.add(sessionId);
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`tracking:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      { status: 429, headers },
    );
  }

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

    const action = sanitizeString(body.action) ?? "create";
    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `action must be one of: ${[...VALID_ACTIONS].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (action === "create") {
      const visitorId = sanitizeString(body.visitorId);
      if (!visitorId) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "visitorId is required" }, meta: null },
          { status: 400, headers },
        );
      }

      const device = parseDeviceInfo(body.device);
      if (!device) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "device is required with type, browser, os, screenWidth, screenHeight" }, meta: null },
          { status: 400, headers },
        );
      }

      const existingSessions = visitorSessionIndex.get(visitorId);
      if (existingSessions && existingSessions.size >= MAX_SESSIONS_PER_VISITOR) {
        return NextResponse.json(
          { data: null, error: { code: "LIMIT_EXCEEDED", message: "Maximum sessions per visitor reached" }, meta: null },
          { status: 400, headers },
        );
      }

      const referrer = sanitizeString(body.referrer);
      const utmParams = parseUtmParams(body.utmParams);
      const session = createSession(visitorId, device, referrer, utmParams);

      sessionStore.set(session.sessionId, session);
      indexSession(visitorId, session.sessionId);

      return NextResponse.json(
        { data: { sessionId: session.sessionId, visitorId: session.visitorId }, error: null, meta: { action: "create" } },
        { status: 201, headers },
      );
    }

    const sessionId = sanitizeString(body.sessionId);
    if (!sessionId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "sessionId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const session = sessionStore.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Session not found" }, meta: null },
        { status: 404, headers },
      );
    }

    if (action === "pageview") {
      const path = sanitizeString(body.path);
      const title = sanitizeString(body.title) ?? "";
      if (!path) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "path is required for pageview" }, meta: null },
          { status: 400, headers },
        );
      }

      recordPageView(session, {
        path,
        title,
        scrollDepth: sanitizeNumber(body.scrollDepth, 0, 100),
        timeOnPage: sanitizeNumber(body.timeOnPage, 0, 86400),
      });

      // Fire-and-forget rescore on pageview if a leadKey is associated
      const pvLeadKey = sanitizeString(body.leadKey);
      if (pvLeadKey) {
        import("@/lib/rescore-engine")
          .then((m) => m.rescoreLead(pvLeadKey, { type: "page-view" }))
          .catch(() => {});
      }

      return NextResponse.json(
        { data: { sessionId, pageViews: session.pageViews.length }, error: null, meta: { action: "pageview" } },
        { headers },
      );
    }

    if (action === "event") {
      const type = sanitizeString(body.type);
      if (!type) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "type is required for event" }, meta: null },
          { status: 400, headers },
        );
      }

      recordEvent(session, {
        type,
        target: sanitizeString(body.target),
        value: sanitizeString(body.value),
      });

      // Fire-and-forget rescore on tracked events if a leadKey is associated
      const evLeadKey = sanitizeString(body.leadKey);
      if (evLeadKey) {
        const rescoreType = type === "form_submit"
          ? "form-submit"
          : type === "chat_message"
            ? "chat-message"
            : type === "booking_made"
              ? "booking-request"
              : null;
        if (rescoreType) {
          import("@/lib/rescore-engine")
            .then((m) => m.rescoreLead(evLeadKey, { type: rescoreType as "form-submit" | "chat-message" | "booking-request" }))
            .catch(() => {});
        }
      }

      return NextResponse.json(
        { data: { sessionId, events: session.events.length }, error: null, meta: { action: "event" } },
        { headers },
      );
    }

    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Unknown action" }, meta: null },
      { status: 400, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "TRACKING_FAILED", message: "Failed to process tracking request" }, meta: null },
      { status: 400, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const visitorId = url.searchParams.get("visitorId");

    if (!visitorId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "visitorId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const sessionIds = visitorSessionIndex.get(visitorId);
    if (!sessionIds || sessionIds.size === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "No sessions found for visitor" }, meta: null },
        { status: 404, headers },
      );
    }

    const sessions: VisitorSession[] = [];
    for (const id of sessionIds) {
      const session = sessionStore.get(id);
      if (session) sessions.push(session);
    }

    if (sessions.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "No sessions found for visitor" }, meta: null },
        { status: 404, headers },
      );
    }

    const profile = buildVisitorProfile(sessions);

    return NextResponse.json(
      { data: { profile }, error: null, meta: { visitorId, sessionCount: sessions.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "TRACKING_FAILED", message: "Failed to get visitor profile" }, meta: null },
      { status: 400, headers },
    );
  }
}
