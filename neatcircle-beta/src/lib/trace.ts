export const PROFILE_EVENT_NAME = "nc-profile-updated";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export interface TraceContext {
  visitorId?: string;
  sessionId?: string;
  leadKey?: string;
  page?: string;
  source?: string;
  service?: string;
  niche?: string;
  blueprintId?: string;
  stepId?: string;
  experimentId?: string;
  variantId?: string;
  timestamp?: string;
}

export interface TraceEventPayload extends TraceContext {
  type: string;
  email?: string;
  scores?: {
    engagement: number;
    intent: number;
    fit: number;
    urgency: number;
    composite: number;
  };
  data?: Record<string, unknown>;
}

export interface StoredProfile extends Record<string, unknown> {
  email?: string;
  phone?: string;
  nicheInterest?: string;
  currentService?: string;
  activeBlueprint?: string;
  currentStepId?: string;
  currentExperimentId?: string;
  currentVariantId?: string;
  scores?: {
    engagement: number;
    intent: number;
    fit: number;
    urgency: number;
    composite: number;
  };
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredProfile(): StoredProfile {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(localStorage.getItem("nc_profile") ?? "{}") as StoredProfile;
  } catch {
    return {};
  }
}

export function updateStoredProfile(updates: Record<string, unknown>) {
  if (!isBrowser()) return {};
  const current = getStoredProfile();
  const next = { ...current, ...updates };
  localStorage.setItem("nc_profile", JSON.stringify(next));
  window.dispatchEvent(new Event(PROFILE_EVENT_NAME));
  return next;
}

export function ensureVisitorId() {
  if (!isBrowser()) return "";
  let id = localStorage.getItem("nc_visitor_id");
  if (!id) {
    id = `v_${crypto.randomUUID()}`;
    localStorage.setItem("nc_visitor_id", id);
  }
  return id;
}

export function getSessionCount() {
  if (!isBrowser()) return 0;
  return parseInt(localStorage.getItem("nc_sessions") ?? "0", 10);
}

export function ensureSession() {
  if (!isBrowser()) {
    return { sessionId: "", sessions: 0, isNewSession: false };
  }

  const now = Date.now();
  const last = parseInt(localStorage.getItem("nc_last_session") ?? "0", 10);
  const stale = !last || now - last > SESSION_TIMEOUT_MS;

  let sessions = getSessionCount();
  let sessionId = localStorage.getItem("nc_session_id") ?? "";

  if (!sessionId || stale) {
    sessions += 1;
    sessionId = `s_${crypto.randomUUID()}`;
    localStorage.setItem("nc_sessions", String(sessions));
    localStorage.setItem("nc_session_id", sessionId);
  }

  localStorage.setItem("nc_last_session", String(now));

  return { sessionId, sessions, isNewSession: stale };
}

export function normalizePhoneKey(phone?: string) {
  if (!phone) return "";
  return phone.replace(/\D+/g, "");
}

export function buildLeadKey(email?: string, phone?: string) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) return `email:${normalizedEmail}`;

  const phoneKey = normalizePhoneKey(phone);
  if (phoneKey) return `phone:${phoneKey}`;

  return undefined;
}

export function getTraceContext(overrides: Partial<TraceContext> = {}): TraceContext {
  if (!isBrowser()) return overrides;

  const profile = getStoredProfile();
  const { sessionId } = ensureSession();

  return {
    visitorId: ensureVisitorId(),
    sessionId,
    leadKey: buildLeadKey(
      typeof profile.email === "string" ? profile.email : undefined,
      typeof profile.phone === "string" ? profile.phone : undefined,
    ),
    page: window.location.pathname,
    service: typeof profile.currentService === "string" ? profile.currentService : undefined,
    niche: typeof profile.nicheInterest === "string" ? profile.nicheInterest : undefined,
    blueprintId: typeof profile.activeBlueprint === "string" ? profile.activeBlueprint : undefined,
    stepId: typeof profile.currentStepId === "string" ? profile.currentStepId : undefined,
    experimentId:
      typeof profile.currentExperimentId === "string" ? profile.currentExperimentId : undefined,
    variantId: typeof profile.currentVariantId === "string" ? profile.currentVariantId : undefined,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

export function trackBrowserEvent(payload: TraceEventPayload) {
  if (!isBrowser()) return;

  const profile = getStoredProfile();
  const trace = getTraceContext({
    page: payload.page,
    source: payload.source,
    service: payload.service,
    niche: payload.niche,
    blueprintId: payload.blueprintId,
    stepId: payload.stepId,
    experimentId: payload.experimentId,
    variantId: payload.variantId,
  });

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...trace,
      type: payload.type,
      email: payload.email ?? (typeof profile.email === "string" ? profile.email : undefined),
      scores: payload.scores ?? profile.scores,
      data: payload.data,
      timestamp: payload.timestamp ?? trace.timestamp ?? new Date().toISOString(),
    }),
    keepalive: true,
  }).catch(() => {});
}

export function buildTraceIntakePayload<T extends Record<string, unknown>>(payload: T) {
  const trace = getTraceContext({
    source: typeof payload.source === "string" ? payload.source : undefined,
    service: typeof payload.service === "string" ? payload.service : undefined,
    niche: typeof payload.niche === "string" ? payload.niche : undefined,
  });

  return {
    ...payload,
    visitorId: typeof payload.visitorId === "string" ? payload.visitorId : trace.visitorId,
    sessionId: typeof payload.sessionId === "string" ? payload.sessionId : trace.sessionId,
    leadKey: typeof payload.leadKey === "string" ? payload.leadKey : trace.leadKey,
    page: typeof payload.page === "string" ? payload.page : trace.page,
    service: typeof payload.service === "string" ? payload.service : trace.service,
    niche: typeof payload.niche === "string" ? payload.niche : trace.niche,
    blueprintId:
      typeof payload.blueprintId === "string" ? payload.blueprintId : trace.blueprintId,
    stepId: typeof payload.stepId === "string" ? payload.stepId : trace.stepId,
    experimentId:
      typeof payload.experimentId === "string" ? payload.experimentId : trace.experimentId,
    variantId: typeof payload.variantId === "string" ? payload.variantId : trace.variantId,
  };
}

export function parseStructuredDetail(value?: string) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
