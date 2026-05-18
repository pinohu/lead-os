// POST /api/intake/start
// Initialize a new intake conversation. Returns conversation id + greeting.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startConversation } from "@/lib/intake/conversation";
import {
  resolveIntakeVariant,
  INTAKE_AB_COOKIE_NAME,
  INTAKE_AB_COOKIE_MAX_AGE,
} from "@/lib/intake/feature-flag";
import { isIntakeEnabledForNiche } from "@/lib/intake/templates";
import {
  INTAKE_SESSION_COOKIE,
  INTAKE_SESSION_MAX_AGE,
} from "@/lib/intake/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const StartSchema = z.object({
  startedFromNicheSlug: z.string().max(100).nullable().optional(),
});

export async function POST(request: NextRequest) {
  // Reuse the "contact" rate-limit preset (5/min/IP) — intake start is similar in shape.
  const rateLimited = await checkRateLimit(request, "contact");
  if (rateLimited) return rateLimited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = StartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 400 }
    );
  }

  const { startedFromNicheSlug } = parsed.data;

  // Variant gate: even though the widget is rendered behind a feature flag on the page,
  // re-check server-side so a misconfigured client can't bypass the flag.
  const flag = await resolveIntakeVariant();
  if (flag.variant !== "intake") {
    return NextResponse.json(
      { success: false, error: "intake-widget-not-enabled-for-this-visitor" },
      { status: 403 }
    );
  }

  // Niche gate: only allow starting for niches we've tuned templates for.
  // (Conversations started from the homepage or untuned niches use the generic
  // template, but the niche must still be enabled for the v1 rollout.)
  if (startedFromNicheSlug && !isIntakeEnabledForNiche(startedFromNicheSlug)) {
    return NextResponse.json(
      { success: false, error: "intake-widget-not-enabled-for-this-niche" },
      { status: 403 }
    );
  }

  // Truncate IP for analytics (full IP not stored)
  const xff = request.headers.get("x-forwarded-for");
  const ipFull = xff ? xff.split(",")[0].trim() : "";
  const ipPrefix = ipFull
    ? ipFull.split(".").slice(0, 3).join(".") + ".0"
    : undefined;

  try {
    const result = await startConversation(
      {
        startedFromNicheSlug: startedFromNicheSlug ?? null,
        variant: "intake",
      },
      ipPrefix
    );

    // Strip the session token out of the JSON response — it must travel
    // exclusively via the HTTP-only cookie so it can't be read by client JS.
    const { sessionToken, ...publicResult } = result;
    const response = NextResponse.json({
      success: true,
      ...publicResult,
    });

    // C4: bind this conversation to an opaque server-issued session token.
    response.cookies.set({
      name: INTAKE_SESSION_COOKIE,
      value: sessionToken,
      maxAge: INTAKE_SESSION_MAX_AGE,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Persist the variant cookie if it wasn't already set
    if (!flag.fromCookie && flag.cookieValue) {
      response.cookies.set({
        name: INTAKE_AB_COOKIE_NAME,
        value: flag.cookieValue,
        maxAge: INTAKE_AB_COOKIE_MAX_AGE,
        path: "/",
        httpOnly: false, // The client component reads this for telemetry
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (err) {
    logger.error("intake.start failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { success: false, error: "internal-error" },
      { status: 500 }
    );
  }
}
