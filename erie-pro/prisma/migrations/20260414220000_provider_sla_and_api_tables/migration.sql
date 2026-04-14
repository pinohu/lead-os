-- ──────────────────────────────────────────────────────────────────────
-- Catch-up migration: brings the database in sync with schema.prisma.
-- These columns + tables drifted into the schema across earlier rounds
-- (SLA tracking, profile photos, API keys, webhooks, lead tracking
-- tokens) but were never captured in their own migration. Production
-- deploys started 500'ing with `column providers.slaViolationCount
-- does not exist` because every server-rendered page that touches
-- Provider/Territory throws. Safe to run repeatedly via IF NOT EXISTS
-- guards.
-- ──────────────────────────────────────────────────────────────────────

-- Provider SLA + profile fields
ALTER TABLE "providers"
  ADD COLUMN IF NOT EXISTS "slaViolationCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "businessHours"     JSONB,
  ADD COLUMN IF NOT EXISTS "timezone"          TEXT NOT NULL DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS "photoUrl"          TEXT,
  ADD COLUMN IF NOT EXISTS "coverPhotoUrl"     TEXT;

-- Lead tracking columns: status-page token, ingest source label,
-- and scheduled-delivery timestamp for delayed routing.
ALTER TABLE "leads"
  ADD COLUMN IF NOT EXISTS "deliverAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "source"      TEXT NOT NULL DEFAULT 'erie-pro',
  ADD COLUMN IF NOT EXISTS "statusToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "leads_statusToken_key" ON "leads"("statusToken");

-- API Keys table
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY['leads:write']::TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_keyHash_key" ON "api_keys"("keyHash");
CREATE INDEX IF NOT EXISTS "api_keys_keyHash_idx" ON "api_keys"("keyHash");
CREATE INDEX IF NOT EXISTS "api_keys_providerId_idx" ON "api_keys"("providerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_providerId_fkey'
  ) THEN
    ALTER TABLE "api_keys"
      ADD CONSTRAINT "api_keys_providerId_fkey"
      FOREIGN KEY ("providerId") REFERENCES "providers"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Webhook Endpoints table
CREATE TABLE IF NOT EXISTS "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY['lead.created', 'lead.routed']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "webhook_endpoints_providerId_idx" ON "webhook_endpoints"("providerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhook_endpoints_providerId_fkey'
  ) THEN
    ALTER TABLE "webhook_endpoints"
      ADD CONSTRAINT "webhook_endpoints_providerId_fkey"
      FOREIGN KEY ("providerId") REFERENCES "providers"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
