-- Launch Kit additions:
--   1. Two new checkout session types for requester-side upgrades
--      (Concierge one-time + Annual subscription).
--   2. Generic Setting key/value table so ops can adjust runtime
--      config (e.g. founding-seat claimed count) without redeploys.

-- AlterEnum
ALTER TYPE "CheckoutSessionType" ADD VALUE 'concierge_job';
ALTER TYPE "CheckoutSessionType" ADD VALUE 'annual_membership';

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "settings_key_idx" ON "settings"("key");
