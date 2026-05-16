-- ── Intake Widget Conversations table ─────────────────────────────
-- Stores per-conversation state for the AI-led intake flow.

CREATE TABLE "intake_conversations" (
    "id" TEXT NOT NULL,
    "citySlug" TEXT NOT NULL DEFAULT 'erie',
    "startedFromNicheSlug" TEXT,
    "currentStep" TEXT NOT NULL DEFAULT 'problem',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "outcome" JSONB NOT NULL DEFAULT '{}',
    "variant" TEXT NOT NULL DEFAULT 'intake',
    "outcomeStatus" TEXT NOT NULL DEFAULT 'in_progress',
    "leadId" TEXT,
    "ipPrefix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intake_conversations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "intake_conversations_leadId_key" ON "intake_conversations"("leadId");
CREATE INDEX "intake_conversations_citySlug_currentStep_idx" ON "intake_conversations"("citySlug", "currentStep");
CREATE INDEX "intake_conversations_outcomeStatus_updatedAt_idx" ON "intake_conversations"("outcomeStatus", "updatedAt");
CREATE INDEX "intake_conversations_startedFromNicheSlug_idx" ON "intake_conversations"("startedFromNicheSlug");
