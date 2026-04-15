-- Enforce one dispute per (lead, provider) so the provider can't double-
-- credit themselves by racing two dispute submissions for the same lead
-- before the application-level findFirst dedupe check sees either one.
-- Collapse any pre-existing duplicates first: keep the earliest-created
-- row per (leadId, providerId) and delete the rest.
DELETE FROM "lead_disputes" a
USING "lead_disputes" b
WHERE a."leadId" = b."leadId"
  AND a."providerId" = b."providerId"
  AND a."createdAt" > b."createdAt";

CREATE UNIQUE INDEX IF NOT EXISTS "lead_disputes_leadId_providerId_key"
  ON "lead_disputes" ("leadId", "providerId");
