// ── Concierge contact — single source of truth ───────────────────────
//
// CLAUDE.md rule: the (814) 200-0328 concierge number MUST NOT be
// changed anywhere without explicit owner approval. Centralising here
// makes that promise structurally enforceable.
//
// Display, E.164, and tel-link forms are all exported so callers don't
// have to re-format and risk drift.

export const CONCIERGE_PHONE_E164 = "+18142000328" as const;
export const CONCIERGE_PHONE_DISPLAY = "(814) 200-0328" as const;
export const CONCIERGE_PHONE_TEL = "tel:+18142000328" as const;
export const CONCIERGE_PHONE_DASHED = "+1-814-200-0328" as const;
