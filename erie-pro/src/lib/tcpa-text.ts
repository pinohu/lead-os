// ── TCPA Consent Text — single source of truth ───────────────────────
//
// CLAUDE.md rule: the TCPA wording and version MUST NOT be changed
// without explicit owner approval. Centralising here makes that promise
// structurally enforceable — every form component imports from this file
// instead of redefining the literal.
//
// If a future TCPA_TEXT_V3 is approved, add it alongside V2 and migrate
// callers one by one; never mutate V2 in place.

export const TCPA_VERSION = "v2-2026-04-02" as const;

export const TCPA_TEXT_V2 = (domain: string) =>
  `By submitting this form, I consent to be contacted by phone, text message, or email by a service provider regarding my service request. I understand that message and data rates may apply for text messages. I can opt out at any time by replying STOP to any text message or contacting us at hello@${domain}.`;
