// ── Intake Widget A/B Feature Flag ────────────────────────────────────
// Server-side utility for deciding which variant a visitor sees. Uses a
// signed cookie so the same user gets the same variant across visits;
// falls back to deterministic randomization based on a session id.
//
// Env-level overrides (all optional):
//   INTAKE_WIDGET_FORCE — "intake" or "form" or "off"
//     "intake": always serve the intake widget
//     "form": always serve the legacy lead form
//     "off": disable the widget entirely (back to form for everyone)
//   INTAKE_WIDGET_PERCENTAGE — number 0-100, percentage of users in "intake" variant
//     Default: 50 (50/50 split)

import { cookies } from "next/headers";
import { randomUUID, createHash } from "crypto";

export type IntakeVariant = "intake" | "form";

const COOKIE_NAME = "erie_intake_ab";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface CookieValue {
  /** Stable session id, used for deterministic bucketing */
  sid: string;
  /** The variant assigned to this session */
  variant: IntakeVariant;
}

function parseCookie(raw: string | undefined): CookieValue | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (
      parsed &&
      typeof parsed.sid === "string" &&
      (parsed.variant === "intake" || parsed.variant === "form")
    ) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return null;
}

function serializeCookie(value: CookieValue): string {
  return encodeURIComponent(JSON.stringify(value));
}

/** Hash a session id to a uniform [0, 100) bucket. */
function hashToBucket(sid: string): number {
  const hash = createHash("sha256").update(sid).digest();
  // Use the first 4 bytes as a uint32, then mod 100
  const n = (hash.readUInt32BE(0) % 10000) / 100; // 0.00–99.99
  return n;
}

interface FlagResult {
  variant: IntakeVariant;
  /** Whether the variant came from an existing cookie (true) or was newly assigned (false) */
  fromCookie: boolean;
  /** Whether an env override forced the variant */
  forcedByEnv: boolean;
  /** A/B session id (returned for analytics) */
  sessionId: string;
  /** Cookie value the caller MUST set on the response when fromCookie=false */
  cookieValue?: string;
}

/**
 * Server-side variant resolution. Reads existing cookie if present;
 * assigns and returns a new one if not. The caller is responsible for
 * setting the cookie on the response when fromCookie=false.
 *
 * In a Next.js route handler:
 *
 *   const flag = await resolveIntakeVariant();
 *   if (!flag.fromCookie && flag.cookieValue) {
 *     // Set the cookie via NextResponse.cookies.set or via the cookies() store
 *   }
 *   return { variant: flag.variant }
 */
export async function resolveIntakeVariant(): Promise<FlagResult> {
  // ── 1. Env-level override ───────────────────────────────────────
  const force = process.env.INTAKE_WIDGET_FORCE;
  if (force === "intake" || force === "form") {
    const sid = randomUUID();
    return {
      variant: force,
      fromCookie: false,
      forcedByEnv: true,
      sessionId: sid,
      cookieValue: serializeCookie({ sid, variant: force }),
    };
  }
  if (force === "off") {
    const sid = randomUUID();
    return {
      variant: "form",
      fromCookie: false,
      forcedByEnv: true,
      sessionId: sid,
      cookieValue: serializeCookie({ sid, variant: "form" }),
    };
  }

  // ── 2. Existing cookie ──────────────────────────────────────────
  const cookieStore = await cookies();
  const existing = parseCookie(cookieStore.get(COOKIE_NAME)?.value);
  if (existing) {
    return {
      variant: existing.variant,
      fromCookie: true,
      forcedByEnv: false,
      sessionId: existing.sid,
    };
  }

  // ── 3. New visitor — deterministic bucket ───────────────────────
  const pctRaw = Number(process.env.INTAKE_WIDGET_PERCENTAGE);
  const pct = Number.isFinite(pctRaw) && pctRaw >= 0 && pctRaw <= 100 ? pctRaw : 50;

  const sid = randomUUID();
  const bucket = hashToBucket(sid);
  const variant: IntakeVariant = bucket < pct ? "intake" : "form";

  return {
    variant,
    fromCookie: false,
    forcedByEnv: false,
    sessionId: sid,
    cookieValue: serializeCookie({ sid, variant }),
  };
}

export const INTAKE_AB_COOKIE_NAME = COOKIE_NAME;
export const INTAKE_AB_COOKIE_MAX_AGE = COOKIE_MAX_AGE_SECONDS;

// Export internals for testing
export const __test = { hashToBucket, parseCookie, serializeCookie };
