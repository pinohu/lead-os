-- One outcome row per (lead, provider) so a provider can't pad their
-- convertedLeads count by submitting the same outcome for the same
-- lead N times. Collapse any pre-existing duplicates first: keep the
-- most-recently-created row per (leadId, providerId) and delete the
-- rest (latest state is likely truthiest — e.g. responded -> converted).
DELETE FROM "lead_outcomes" a
USING "lead_outcomes" b
WHERE a."leadId" = b."leadId"
  AND a."providerId" = b."providerId"
  AND a."createdAt" < b."createdAt";

CREATE UNIQUE INDEX IF NOT EXISTS "lead_outcomes_leadId_providerId_key"
  ON "lead_outcomes" ("leadId", "providerId");
