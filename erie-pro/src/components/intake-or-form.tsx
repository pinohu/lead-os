// ── Lead Capture A/B Wrapper ──────────────────────────────────────────
// Decides server-side whether to render the conversational intake widget
// or the legacy lead form. The decision is sticky (cookie-driven). The
// intake widget is only shown for niches in the v1 tuned set.
//
// This component runs server-side. The inner widget is client-side via
// dynamic import to keep the page payload minimal for the form variant.

import { resolveIntakeVariant, INTAKE_AB_COOKIE_NAME, INTAKE_AB_COOKIE_MAX_AGE } from "@/lib/intake/feature-flag";
import { isIntakeEnabledForNiche } from "@/lib/intake/templates";
import { cookies } from "next/headers";
import LeadForm from "./lead-form";
import IntakeOrFormClient from "./intake-or-form-client";

interface Props {
  nicheSlug: string;
  nicheLabel: string;
  citySlug: string;
  cityName: string;
}

export default async function IntakeOrForm({
  nicheSlug,
  nicheLabel,
  citySlug,
  cityName,
}: Props) {
  // Niche must be in the v1 enabled set
  if (!isIntakeEnabledForNiche(nicheSlug)) {
    return (
      <LeadForm
        nicheSlug={nicheSlug}
        nicheLabel={nicheLabel}
        citySlug={citySlug}
        cityName={cityName}
      />
    );
  }

  // Server-side A/B variant resolution
  const flag = await resolveIntakeVariant();

  // Persist the cookie if this is the first visit
  if (!flag.fromCookie && flag.cookieValue) {
    try {
      const cookieStore = await cookies();
      cookieStore.set({
        name: INTAKE_AB_COOKIE_NAME,
        value: flag.cookieValue,
        maxAge: INTAKE_AB_COOKIE_MAX_AGE,
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    } catch {
      // Setting cookies from server components only works in route handlers
      // and server actions in some Next.js versions; fall back is fine.
    }
  }

  // Form variant → render the legacy form
  if (flag.variant === "form") {
    return (
      <LeadForm
        nicheSlug={nicheSlug}
        nicheLabel={nicheLabel}
        citySlug={citySlug}
        cityName={cityName}
      />
    );
  }

  // Intake variant → render the client-side widget with form fallback
  return (
    <IntakeOrFormClient
      nicheSlug={nicheSlug}
      nicheLabel={nicheLabel}
      citySlug={citySlug}
      cityName={cityName}
    />
  );
}
