/**
 * Centralized safety + feature flags.
 *
 * The three SAFE_* flags govern irreversible behavior — they default to OFF
 * and only flip when an operator sets them in .env. Code that touches the
 * outside world (publish, charge, send) must guard on these.
 */

function bool(v: string | undefined, def = false): boolean {
  if (v === undefined || v === "") return def;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

export const flags = {
  hermesEnabled: bool(process.env.HERMES_ENABLED),
  vimaxEnabled: bool(process.env.VIMAX_ENABLED),
  comfyuiEnabled: bool(process.env.COMFYUI_ENABLED),
  suitedashEnabled: bool(process.env.SUITEDASH_ENABLED),
  thrivecartEnabled: bool(process.env.THRIVECART_ENABLED),
  productdynoEnabled: bool(process.env.PRODUCTDYNO_ENABLED),
  gumletEnabled: bool(process.env.GUMLET_ENABLED),
  publitioEnabled: bool(process.env.PUBLITIO_ENABLED),
  erieProEnabled: bool(process.env.ERIE_PRO_ENABLED),
  yourDeputyEnabled: bool(process.env.YOURDEPUTY_ENABLED),
  hermesGatewayEnabled: bool(process.env.HERMES_GATEWAY_ENABLED),
  // ── irreversible flags ─────────────────────────────────────
  publicPublishingEnabled: bool(process.env.SAFE_PUBLIC_PUBLISHING_ENABLED),
  liveBillingEnabled: bool(process.env.SAFE_LIVE_BILLING_ENABLED),
  outreachEnabled: bool(process.env.SAFE_OUTREACH_ENABLED),
} as const;

export function assertPublishingAllowed(): void {
  if (!flags.publicPublishingEnabled) {
    throw new Error(
      "SAFE_PUBLIC_PUBLISHING_ENABLED is OFF — refusing to publish. Set the flag in .env after operator review."
    );
  }
}

export function assertBillingAllowed(): void {
  if (!flags.liveBillingEnabled) {
    throw new Error(
      "SAFE_LIVE_BILLING_ENABLED is OFF — refusing to charge. Set the flag in .env after operator review."
    );
  }
}

export function assertOutreachAllowed(): void {
  if (!flags.outreachEnabled) {
    throw new Error(
      "SAFE_OUTREACH_ENABLED is OFF — refusing to send outreach. Set the flag in .env after operator review."
    );
  }
}
