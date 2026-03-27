export interface VisitorSession {
  visitorId: string;
  sessionId: string;
  startedAt: string;
  lastActivityAt: string;
  pageViews: PageView[];
  events: VisitorEvent[];
  device: DeviceInfo;
  geo?: GeoInfo;
  referrer?: string;
  utmParams?: UtmParams;
}

export interface PageView {
  path: string;
  title: string;
  enteredAt: string;
  exitedAt?: string;
  scrollDepth: number;
  timeOnPage: number;
}

export interface VisitorEvent {
  type: string;
  target?: string;
  value?: string;
  timestamp: string;
}

export interface DeviceInfo {
  type: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
}

export interface GeoInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface VisitorProfile {
  visitorId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  sessionCount: number;
  totalPageViews: number;
  totalTimeOnSite: number;
  topPages: { path: string; visits: number; avgTime: number }[];
  engagementScore: number;
  intentSignals: string[];
  funnelStage: string;
  devicePreference: string;
  isReturning: boolean;
  daysActive: number;
}

const INTENT_PAGES: Record<string, string> = {
  "/pricing": "pricing_page_view",
  "/plans": "pricing_page_view",
  "/contact": "contact_page_view",
  "/contact-us": "contact_page_view",
  "/demo": "demo_page_view",
  "/book": "booking_intent",
  "/schedule": "booking_intent",
  "/compare": "comparison_page_view",
  "/vs": "comparison_page_view",
  "/case-study": "case_study_engagement",
  "/case-studies": "case_study_engagement",
  "/testimonials": "social_proof_engagement",
  "/about": "trust_research",
  "/team": "trust_research",
};

const INTENT_EVENT_TYPES: Record<string, string> = {
  calculator_used: "calculator_usage",
  calculator_completed: "calculator_usage",
  assessment_started: "assessment_started",
  assessment_completed: "assessment_completion",
  video_played: "video_engagement",
  video_completed: "video_completion",
  chat_opened: "chat_engagement",
  chat_message_sent: "chat_engagement",
  form_started: "form_engagement",
  form_submitted: "form_submission",
  cta_clicked: "cta_engagement",
  download_clicked: "download_intent",
  booking_clicked: "booking_intent",
  pricing_toggle: "pricing_engagement",
};

const DEEP_SCROLL_THRESHOLD = 75;
const LONG_TIME_THRESHOLD_SECONDS = 180;
const HOT_LEAD_SCORE_THRESHOLD = 70;
const HIGH_SESSION_COUNT = 3;
const MINIMUM_SESSIONS_FOR_RETURNING = 2;
const MINIMUM_DAYS_ACTIVE = 3;
const ENGAGEMENT_SCORE_BONUS = 5;
const SESSION_WEIGHT_CAP = 25;
const SESSION_WEIGHT_MULTIPLIER = 8;
const PAGE_VIEW_WEIGHT_CAP = 20;
const PAGE_VIEW_WEIGHT_MULTIPLIER = 2;
const TIME_WEIGHT_CAP = 20;
const TIME_WEIGHT_DIVISOR = 60;
const TIME_WEIGHT_MULTIPLIER = 4;
const SIGNAL_WEIGHT_CAP = 25;
const SIGNAL_WEIGHT_MULTIPLIER = 5;
const MODERATE_ENGAGEMENT_THRESHOLD = 50;
const MINIMUM_PAGES_VIEWED = 3;

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createSession(
  visitorId: string,
  device: DeviceInfo,
  referrer?: string,
  utmParams?: UtmParams,
): VisitorSession {
  const now = new Date().toISOString();
  return {
    visitorId,
    sessionId: generateSessionId(),
    startedAt: now,
    lastActivityAt: now,
    pageViews: [],
    events: [],
    device,
    geo: undefined,
    referrer,
    utmParams,
  };
}

export function recordPageView(
  session: VisitorSession,
  pageView: Omit<PageView, "enteredAt">,
): void {
  const lastView = session.pageViews[session.pageViews.length - 1];
  if (lastView && !lastView.exitedAt) {
    lastView.exitedAt = new Date().toISOString();
  }

  session.pageViews.push({
    ...pageView,
    enteredAt: new Date().toISOString(),
  });

  session.lastActivityAt = new Date().toISOString();
}

export function recordEvent(
  session: VisitorSession,
  event: Omit<VisitorEvent, "timestamp">,
): void {
  session.events.push({
    ...event,
    timestamp: new Date().toISOString(),
  });
  session.lastActivityAt = new Date().toISOString();
}

export function detectIntentSignals(session: VisitorSession): string[] {
  const signals = new Set<string>();

  for (const pv of session.pageViews) {
    const normalizedPath = pv.path.toLowerCase().replace(/\/$/, "");

    for (const [pattern, signal] of Object.entries(INTENT_PAGES)) {
      if (normalizedPath === pattern || normalizedPath.startsWith(pattern + "/")) {
        signals.add(signal);
      }
    }

    if (normalizedPath.includes("/service") || normalizedPath.includes("/solutions")) {
      if (pv.scrollDepth >= DEEP_SCROLL_THRESHOLD) {
        signals.add("service_page_deep_scroll");
      }
    }

    if (normalizedPath.includes("/case-stud")) {
      if (pv.timeOnPage >= LONG_TIME_THRESHOLD_SECONDS) {
        signals.add("long_case_study_engagement");
      }
    }
  }

  for (const event of session.events) {
    const mapped = INTENT_EVENT_TYPES[event.type];
    if (mapped) {
      signals.add(mapped);
    }
  }

  return [...signals];
}

export function buildVisitorProfile(sessions: VisitorSession[]): VisitorProfile {
  if (sessions.length === 0) {
    throw new Error("Cannot build profile from zero sessions");
  }

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );

  const visitorId = sorted[0].visitorId;
  const firstSeenAt = sorted[0].startedAt;
  const lastSeenAt = sorted[sorted.length - 1].lastActivityAt;

  const allPageViews = sorted.flatMap((s) => s.pageViews);
  const totalTimeOnSite = allPageViews.reduce((sum, pv) => sum + pv.timeOnPage, 0);

  const pageCountMap = new Map<string, { visits: number; totalTime: number }>();
  for (const pv of allPageViews) {
    const existing = pageCountMap.get(pv.path) ?? { visits: 0, totalTime: 0 };
    existing.visits += 1;
    existing.totalTime += pv.timeOnPage;
    pageCountMap.set(pv.path, existing);
  }

  const topPages = [...pageCountMap.entries()]
    .map(([path, data]) => ({
      path,
      visits: data.visits,
      avgTime: Math.round(data.totalTime / data.visits),
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  const allIntentSignals = new Set<string>();
  for (const session of sorted) {
    for (const signal of detectIntentSignals(session)) {
      allIntentSignals.add(signal);
    }
  }
  if (sorted.length >= HIGH_SESSION_COUNT) {
    allIntentSignals.add("multiple_return_visits");
  }

  const deviceCounts = new Map<string, number>();
  for (const session of sorted) {
    const key = session.device.type;
    deviceCounts.set(key, (deviceCounts.get(key) ?? 0) + 1);
  }
  const devicePreference = [...deviceCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0][0];

  const firstDate = new Date(firstSeenAt);
  const lastDate = new Date(lastSeenAt);
  const daysActive = Math.max(1, Math.ceil(
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
  ));

  const profile: VisitorProfile = {
    visitorId,
    firstSeenAt,
    lastSeenAt,
    sessionCount: sorted.length,
    totalPageViews: allPageViews.length,
    totalTimeOnSite,
    topPages,
    engagementScore: 0,
    intentSignals: [...allIntentSignals],
    funnelStage: "anonymous",
    devicePreference,
    isReturning: sorted.length > 1,
    daysActive,
  };

  profile.engagementScore = calculateEngagementScore(profile);
  profile.funnelStage = inferFunnelStage(profile);

  return profile;
}

export function calculateEngagementScore(profile: VisitorProfile): number {
  let score = 0;

  const sessionWeight = Math.min(SESSION_WEIGHT_CAP, profile.sessionCount * 8);
  score += sessionWeight;

  const pageViewWeight = Math.min(20, profile.totalPageViews * 2);
  score += pageViewWeight;

  const timeWeight = Math.min(TIME_WEIGHT_CAP, (profile.totalTimeOnSite / 60) * 4);
  score += timeWeight;

  const signalWeight = Math.min(SESSION_WEIGHT_CAP, profile.intentSignals.length * 5);
  score += signalWeight;

  if (profile.isReturning) score += ENGAGEMENT_SCORE_BONUS;
  if (profile.daysActive >= MINIMUM_DAYS_ACTIVE) score += ENGAGEMENT_SCORE_BONUS;

  return Math.min(100, Math.round(score));
}

export function inferFunnelStage(profile: VisitorProfile): string {
  const signals = new Set(profile.intentSignals);

  const hasBookingIntent = signals.has("booking_intent") || signals.has("demo_page_view");
  const hasFormSubmission = signals.has("form_submission");
  const hasPricingView = signals.has("pricing_page_view") || signals.has("pricing_engagement");
  const hasAssessmentCompletion = signals.has("assessment_completion");
  const hasContactView = signals.has("contact_page_view");

  if (hasBookingIntent || hasFormSubmission) {
    return "qualified";
  }

  if (hasPricingView && (hasAssessmentCompletion || hasContactView)) {
    return "qualified";
  }

  if (hasPricingView || hasAssessmentCompletion || hasContactView) {
    return "engaged";
  }

  if (profile.sessionCount >= HIGH_SESSION_COUNT || profile.engagementScore >= MODERATE_ENGAGEMENT_THRESHOLD) {
    return "engaged";
  }

  if (profile.sessionCount > MINIMUM_SESSIONS_FOR_RETURNING || profile.totalPageViews >= MINIMUM_PAGES_VIEWED) {
    return "captured";
  }

  return "anonymous";
}

export function isHotLead(profile: VisitorProfile): boolean {
  if (profile.engagementScore >= HOT_LEAD_SCORE_THRESHOLD) return true;

  const signals = new Set(profile.intentSignals);
  const hotSignals = ["booking_intent", "form_submission", "demo_page_view"];
  const hasHotSignal = hotSignals.some((s) => signals.has(s));

  if (hasHotSignal && profile.sessionCount >= MINIMUM_SESSIONS_FOR_RETURNING) return true;

  if (signals.has("pricing_page_view") && signals.has("contact_page_view")) return true;

  return false;
}

export function getHotLeadAlerts(
  profiles: VisitorProfile[],
): { visitorId: string; reason: string; score: number }[] {
  return profiles
    .filter(isHotLead)
    .map((profile) => {
      const reasons: string[] = [];
      const signals = new Set(profile.intentSignals);

      if (profile.engagementScore >= HOT_LEAD_SCORE_THRESHOLD) {
        reasons.push(`engagement score ${profile.engagementScore}`);
      }
      if (signals.has("booking_intent")) reasons.push("booking intent detected");
      if (signals.has("form_submission")) reasons.push("form submitted");
      if (signals.has("pricing_page_view")) reasons.push("viewed pricing");
      if (signals.has("contact_page_view")) reasons.push("viewed contact page");
      if (signals.has("assessment_completion")) reasons.push("completed assessment");
      if (profile.sessionCount >= HIGH_SESSION_COUNT) {
        reasons.push(`${profile.sessionCount} sessions`);
      }

      return {
        visitorId: profile.visitorId,
        reason: reasons.join("; "),
        score: profile.engagementScore,
      };
    })
    .sort((a, b) => b.score - a.score);
}
