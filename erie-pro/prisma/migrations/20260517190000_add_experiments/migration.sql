-- ── A/B Testing Experiment Tables ───────────────────────────────────
-- Tracks visitor exposures + conversions for experiments defined in
-- src/lib/experiments/registry.ts. Experiment definitions live in
-- code; only the runtime data lives here.

-- CreateTable
CREATE TABLE "experiment_exposures" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "experimentKey" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "nicheSlug" TEXT,
    "exposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_exposures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_conversions" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "experimentKey" TEXT NOT NULL,
    "exposedFirst" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (unique enforces idempotent exposure per visitor-per-experiment)
CREATE UNIQUE INDEX "experiment_exposures_visitorId_experimentKey_key" ON "experiment_exposures"("visitorId", "experimentKey");

-- CreateIndex
CREATE INDEX "experiment_exposures_experimentKey_exposedAt_idx" ON "experiment_exposures"("experimentKey", "exposedAt");

-- CreateIndex
CREATE INDEX "experiment_exposures_visitorId_idx" ON "experiment_exposures"("visitorId");

-- CreateIndex
CREATE INDEX "experiment_conversions_experimentKey_convertedAt_idx" ON "experiment_conversions"("experimentKey", "convertedAt");

-- CreateIndex
CREATE INDEX "experiment_conversions_visitorId_idx" ON "experiment_conversions"("visitorId");
