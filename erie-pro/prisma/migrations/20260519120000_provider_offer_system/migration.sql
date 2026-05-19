-- Provider Offer System (risk-aware MVP)

CREATE TYPE "ProviderLifecycleStatus" AS ENUM ('pending_payment', 'paid_pending_onboarding', 'provisioning', 'live', 'failed', 'suspended', 'cancelled');
CREATE TYPE "ProvisioningJobStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE "MicrositeStatus" AS ENUM ('draft', 'provisioning', 'live', 'suspended', 'archived');
CREATE TYPE "ProviderInterestStatus" AS ENUM ('new', 'contacted', 'qualified', 'converted', 'archived');
CREATE TYPE "ClaimRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE "ProviderEligibilityTier" AS ENUM ('paid_unverified', 'data_pending', 'eligible_draft', 'eligible_live', 'suspended_trust', 'admin_hold');
CREATE TYPE "MicrositePublishMode" AS ENUM ('draft', 'review_required', 'auto_eligible');
CREATE TYPE "ThriveCartReconciliationStatus" AS ENUM ('pending', 'matched', 'unmatched', 'manual_resolved', 'ignored');

ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "lifecycleStatus" "ProviderLifecycleStatus" NOT NULL DEFAULT 'pending_payment';
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "eligibilityTier" "ProviderEligibilityTier" NOT NULL DEFAULT 'paid_unverified';
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "thriveCartCustomerId" TEXT;

CREATE INDEX IF NOT EXISTS "providers_lifecycleStatus_idx" ON "providers"("lifecycleStatus");
CREATE INDEX IF NOT EXISTS "providers_eligibilityTier_idx" ON "providers"("eligibilityTier");

ALTER TABLE "thrivecart_events" ADD COLUMN IF NOT EXISTS "reconciliationStatus" "ThriveCartReconciliationStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "thrivecart_events" ADD COLUMN IF NOT EXISTS "providerSubscriptionId" TEXT;
CREATE INDEX IF NOT EXISTS "thrivecart_events_reconciliationStatus_idx" ON "thrivecart_events"("reconciliationStatus");

CREATE TABLE "provider_plans" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "setupFeeCents" INTEGER NOT NULL,
    "monthlyFeeCents" INTEGER NOT NULL,
    "monthlyFeeMinCents" INTEGER,
    "foundingPhase" TEXT NOT NULL DEFAULT 'maturity_1',
    "maintenanceLimits" JSONB NOT NULL DEFAULT '{}',
    "valueStack" JSONB NOT NULL DEFAULT '{}',
    "disclaimers" JSONB NOT NULL DEFAULT '{}',
    "thriveCartSetupId" TEXT,
    "thriveCartMonthlyId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "provider_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "provider_plans_slug_key" ON "provider_plans"("slug");

CREATE TABLE "provider_subscriptions" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "lifecycleStatus" "ProviderLifecycleStatus" NOT NULL DEFAULT 'pending_payment',
    "eligibilityTier" "ProviderEligibilityTier" NOT NULL DEFAULT 'paid_unverified',
    "thriveCartOrderId" TEXT,
    "thriveCartSubscriptionId" TEXT,
    "setupPaidAt" TIMESTAMP(3),
    "monthlyStartsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "provider_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "provider_subscriptions_providerId_key" ON "provider_subscriptions"("providerId");
CREATE INDEX "provider_subscriptions_planId_idx" ON "provider_subscriptions"("planId");
CREATE INDEX "provider_subscriptions_lifecycleStatus_idx" ON "provider_subscriptions"("lifecycleStatus");
CREATE INDEX "provider_subscriptions_thriveCartOrderId_idx" ON "provider_subscriptions"("thriveCartOrderId");
ALTER TABLE "provider_subscriptions" ADD CONSTRAINT "provider_subscriptions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_subscriptions" ADD CONSTRAINT "provider_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "provider_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "microsites" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "citySlug" TEXT NOT NULL DEFAULT 'erie',
    "stateCode" TEXT NOT NULL DEFAULT 'PA',
    "status" "MicrositeStatus" NOT NULL DEFAULT 'draft',
    "publishMode" "MicrositePublishMode" NOT NULL DEFAULT 'draft',
    "dataQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "publicProfile" JSONB NOT NULL DEFAULT '{}',
    "privateIntel" JSONB NOT NULL DEFAULT '{}',
    "schemaJson" JSONB DEFAULT '{}',
    "profileJsonPath" TEXT,
    "profileMdPath" TEXT,
    "publishedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "microsites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "microsites_categorySlug_citySlug_stateCode_slug_key" ON "microsites"("categorySlug", "citySlug", "stateCode", "slug");
CREATE INDEX "microsites_providerId_idx" ON "microsites"("providerId");
CREATE INDEX "microsites_status_publishMode_idx" ON "microsites"("status", "publishMode");
ALTER TABLE "microsites" ADD CONSTRAINT "microsites_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "provisioning_jobs" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "jobType" TEXT NOT NULL DEFAULT 'microsite_initial',
    "status" "ProvisioningJobStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "input" JSONB DEFAULT '{}',
    "output" JSONB DEFAULT '{}',
    "runAfter" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "provisioning_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provisioning_jobs_status_runAfter_idx" ON "provisioning_jobs"("status", "runAfter");
CREATE INDEX "provisioning_jobs_providerId_idx" ON "provisioning_jobs"("providerId");
ALTER TABLE "provisioning_jobs" ADD CONSTRAINT "provisioning_jobs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provisioning_jobs" ADD CONSTRAINT "provisioning_jobs_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "provider_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "provider_interests" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "businessName" TEXT,
    "phone" TEXT,
    "niche" TEXT,
    "planSlug" TEXT,
    "sourcePage" TEXT,
    "convertBoxId" TEXT,
    "status" "ProviderInterestStatus" NOT NULL DEFAULT 'new',
    "metadata" JSONB DEFAULT '{}',
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "provider_interests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_interests_email_idx" ON "provider_interests"("email");
CREATE INDEX "provider_interests_status_createdAt_idx" ON "provider_interests"("status", "createdAt");

CREATE TABLE "provider_leads" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "micrositeId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'microsite_quote',
    "sourcePage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "provider_leads_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_leads_providerId_createdAt_idx" ON "provider_leads"("providerId", "createdAt");
ALTER TABLE "provider_leads" ADD CONSTRAINT "provider_leads_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "provider_events" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'erie-pro',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_events_providerId_createdAt_idx" ON "provider_events"("providerId", "createdAt");
CREATE INDEX "provider_events_eventType_idx" ON "provider_events"("eventType");

CREATE TABLE "provider_tasks" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "provider_tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_tasks_providerId_sortOrder_idx" ON "provider_tasks"("providerId", "sortOrder");
ALTER TABLE "provider_tasks" ADD CONSTRAINT "provider_tasks_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "provider_reports" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "summary" TEXT,
    "data" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_reports_providerId_reportType_idx" ON "provider_reports"("providerId", "reportType");

CREATE TABLE "claim_requests" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "directoryListingId" TEXT,
    "email" TEXT NOT NULL,
    "businessName" TEXT,
    "status" "ClaimRequestStatus" NOT NULL DEFAULT 'pending',
    "verificationMethod" TEXT,
    "exclusivity" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB DEFAULT '{}',
    "expiresAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "claim_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "claim_requests_email_idx" ON "claim_requests"("email");
CREATE INDEX "claim_requests_status_idx" ON "claim_requests"("status");
ALTER TABLE "claim_requests" ADD CONSTRAINT "claim_requests_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "thrivecart_product_mappings" (
    "id" TEXT NOT NULL,
    "thriveCartProductId" TEXT NOT NULL,
    "planId" TEXT,
    "offerSlug" TEXT,
    "lineItemType" TEXT NOT NULL DEFAULT 'setup',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "thrivecart_product_mappings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "thrivecart_product_mappings_thriveCartProductId_key" ON "thrivecart_product_mappings"("thriveCartProductId");
CREATE INDEX "thrivecart_product_mappings_planId_idx" ON "thrivecart_product_mappings"("planId");
ALTER TABLE "thrivecart_product_mappings" ADD CONSTRAINT "thrivecart_product_mappings_planId_fkey" FOREIGN KEY ("planId") REFERENCES "provider_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "thrivecart_reconciliation_items" (
    "id" TEXT NOT NULL,
    "thriveCartEventId" TEXT NOT NULL,
    "status" "ThriveCartReconciliationStatus" NOT NULL DEFAULT 'unmatched',
    "reason" TEXT NOT NULL,
    "suggestedAction" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "thrivecart_reconciliation_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "thrivecart_reconciliation_items_thriveCartEventId_key" ON "thrivecart_reconciliation_items"("thriveCartEventId");
CREATE INDEX "thrivecart_reconciliation_items_status_createdAt_idx" ON "thrivecart_reconciliation_items"("status", "createdAt");
ALTER TABLE "thrivecart_reconciliation_items" ADD CONSTRAINT "thrivecart_reconciliation_items_thriveCartEventId_fkey" FOREIGN KEY ("thriveCartEventId") REFERENCES "thrivecart_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "provider_order_items" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "thriveCartOrderId" TEXT,
    "thriveCartProductId" TEXT,
    "lineItemType" TEXT NOT NULL DEFAULT 'setup',
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_order_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_order_items_providerId_idx" ON "provider_order_items"("providerId");
CREATE INDEX "provider_order_items_thriveCartOrderId_idx" ON "provider_order_items"("thriveCartOrderId");
ALTER TABLE "provider_order_items" ADD CONSTRAINT "provider_order_items_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_order_items" ADD CONSTRAINT "provider_order_items_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "provider_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
