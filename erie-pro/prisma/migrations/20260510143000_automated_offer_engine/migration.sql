CREATE TYPE "OfferFulfillmentType" AS ENUM (
  'scorecard',
  'blueprint',
  'template_kit',
  'campaign_kit',
  'automation_kit',
  'subscription_report',
  'website_blueprint'
);

CREATE TYPE "OfferStatus" AS ENUM ('active', 'paused', 'archived');

CREATE TYPE "OfferPurchaseStatus" AS ENUM (
  'pending',
  'paid',
  'fulfilled',
  'failed',
  'refunded',
  'cancelled'
);

CREATE TYPE "FulfillmentJobStatus" AS ENUM (
  'pending',
  'generating',
  'fulfilled',
  'emailed',
  'synced',
  'failed',
  'cancelled'
);

CREATE TYPE "GeneratedAssetType" AS ENUM (
  'html_report',
  'pdf_blueprint',
  'template_pack',
  'checklist',
  'dashboard_link'
);

CREATE TABLE "offers" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "shortTitle" TEXT,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "fulfillmentType" "OfferFulfillmentType" NOT NULL,
  "status" "OfferStatus" NOT NULL DEFAULT 'active',
  "basePriceCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "checkoutUrl" TEXT,
  "checkoutProductId" TEXT,
  "repoSource" TEXT,
  "autoFulfillable" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offer_variants" (
  "id" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "serviceSlug" TEXT,
  "serviceFamily" TEXT,
  "headline" TEXT NOT NULL,
  "subheadline" TEXT NOT NULL,
  "painPoint" TEXT NOT NULL,
  "promise" TEXT NOT NULL,
  "primaryCta" TEXT NOT NULL,
  "deliverySummary" TEXT NOT NULL,
  "deliverableConfig" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "offer_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_offer_maps" (
  "id" TEXT NOT NULL,
  "serviceSlug" TEXT NOT NULL,
  "serviceLabel" TEXT NOT NULL,
  "serviceFamily" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "visitorSegment" TEXT NOT NULL DEFAULT 'provider',
  "urgency" TEXT NOT NULL DEFAULT 'standard',
  "conversionAngle" TEXT NOT NULL,
  "painPoint" TEXT NOT NULL,
  "recommendedPriceCents" INTEGER,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_offer_maps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offer_customers" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "fullName" TEXT,
  "phone" TEXT,
  "companyName" TEXT,
  "websiteUrl" TEXT,
  "googleBusinessUrl" TEXT,
  "city" TEXT NOT NULL DEFAULT 'erie',
  "county" TEXT NOT NULL DEFAULT 'Erie County',
  "state" TEXT NOT NULL DEFAULT 'PA',
  "suitedashRecordId" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "offer_customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offer_purchases" (
  "id" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "serviceSlug" TEXT NOT NULL,
  "serviceLabel" TEXT NOT NULL,
  "serviceFamily" TEXT NOT NULL,
  "status" "OfferPurchaseStatus" NOT NULL DEFAULT 'pending',
  "amountCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "sourceSystem" TEXT NOT NULL DEFAULT 'erie-pro',
  "sourcePage" TEXT,
  "sourcePageType" TEXT,
  "convertBoxId" TEXT,
  "convertBoxEventId" TEXT,
  "thriveCartOrderId" TEXT,
  "thriveCartProductId" TEXT,
  "checkoutSessionId" TEXT,
  "coupon" TEXT,
  "affiliate" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "gclid" TEXT,
  "rawPayload" JSONB DEFAULT '{}',
  "normalizedPayload" JSONB DEFAULT '{}',
  "boostspaceSyncStatus" TEXT NOT NULL DEFAULT 'not_configured',
  "boostspaceSyncedAt" TIMESTAMP(3),
  "boostspaceLastError" TEXT,
  "suitedashSyncStatus" TEXT NOT NULL DEFAULT 'not_configured',
  "suitedashRecordId" TEXT,
  "emailDeliveryStatus" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "fulfilledAt" TIMESTAMP(3),
  CONSTRAINT "offer_purchases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fulfillment_jobs" (
  "id" TEXT NOT NULL,
  "purchaseId" TEXT NOT NULL,
  "jobType" TEXT NOT NULL,
  "status" "FulfillmentJobStatus" NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "input" JSONB DEFAULT '{}',
  "output" JSONB DEFAULT '{}',
  "runAfter" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fulfillment_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "generated_assets" (
  "id" TEXT NOT NULL,
  "purchaseId" TEXT NOT NULL,
  "fulfillmentJobId" TEXT,
  "assetType" "GeneratedAssetType" NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "contentHtml" TEXT,
  "contentMarkdown" TEXT,
  "downloadUrl" TEXT,
  "publicToken" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "generated_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "thrivecart_events" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "orderId" TEXT,
  "productId" TEXT,
  "customerEmail" TEXT,
  "purchaseId" TEXT,
  "signatureValid" BOOLEAN NOT NULL DEFAULT false,
  "rawPayload" JSONB NOT NULL DEFAULT '{}',
  "normalizedPayload" JSONB DEFAULT '{}',
  "processedAt" TIMESTAMP(3),
  "processingStatus" TEXT NOT NULL DEFAULT 'pending',
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "thrivecart_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offer_interactions" (
  "id" TEXT NOT NULL,
  "offerId" TEXT,
  "customerId" TEXT,
  "eventType" TEXT NOT NULL,
  "serviceSlug" TEXT,
  "serviceLabel" TEXT,
  "serviceFamily" TEXT,
  "sourcePage" TEXT,
  "sourcePageType" TEXT,
  "visitorSegment" TEXT,
  "convertBoxId" TEXT,
  "sessionId" TEXT,
  "visitorId" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "gclid" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "offer_interactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offer_subscription_entitlements" (
  "id" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "purchaseId" TEXT,
  "serviceSlug" TEXT,
  "serviceFamily" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "renewsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "externalSubscriptionId" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "offer_subscription_entitlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "offers_slug_key" ON "offers"("slug");
CREATE INDEX "offers_status_category_idx" ON "offers"("status", "category");
CREATE INDEX "offers_checkoutProductId_idx" ON "offers"("checkoutProductId");

CREATE UNIQUE INDEX "offer_variants_offerId_serviceSlug_serviceFamily_key" ON "offer_variants"("offerId", "serviceSlug", "serviceFamily");
CREATE INDEX "offer_variants_serviceSlug_idx" ON "offer_variants"("serviceSlug");
CREATE INDEX "offer_variants_serviceFamily_idx" ON "offer_variants"("serviceFamily");

CREATE UNIQUE INDEX "service_offer_maps_serviceSlug_offerId_visitorSegment_key" ON "service_offer_maps"("serviceSlug", "offerId", "visitorSegment");
CREATE INDEX "service_offer_maps_serviceSlug_priority_idx" ON "service_offer_maps"("serviceSlug", "priority");
CREATE INDEX "service_offer_maps_serviceFamily_idx" ON "service_offer_maps"("serviceFamily");
CREATE INDEX "service_offer_maps_offerId_idx" ON "service_offer_maps"("offerId");

CREATE UNIQUE INDEX "offer_customers_email_key" ON "offer_customers"("email");
CREATE INDEX "offer_customers_email_idx" ON "offer_customers"("email");

CREATE INDEX "offer_purchases_status_createdAt_idx" ON "offer_purchases"("status", "createdAt");
CREATE INDEX "offer_purchases_serviceSlug_idx" ON "offer_purchases"("serviceSlug");
CREATE INDEX "offer_purchases_serviceFamily_idx" ON "offer_purchases"("serviceFamily");
CREATE INDEX "offer_purchases_thriveCartOrderId_idx" ON "offer_purchases"("thriveCartOrderId");
CREATE INDEX "offer_purchases_customerId_idx" ON "offer_purchases"("customerId");

CREATE INDEX "fulfillment_jobs_status_runAfter_idx" ON "fulfillment_jobs"("status", "runAfter");
CREATE INDEX "fulfillment_jobs_purchaseId_idx" ON "fulfillment_jobs"("purchaseId");

CREATE UNIQUE INDEX "generated_assets_publicToken_key" ON "generated_assets"("publicToken");
CREATE INDEX "generated_assets_purchaseId_idx" ON "generated_assets"("purchaseId");
CREATE INDEX "generated_assets_assetType_idx" ON "generated_assets"("assetType");

CREATE INDEX "thrivecart_events_eventType_idx" ON "thrivecart_events"("eventType");
CREATE INDEX "thrivecart_events_orderId_idx" ON "thrivecart_events"("orderId");
CREATE INDEX "thrivecart_events_productId_idx" ON "thrivecart_events"("productId");
CREATE INDEX "thrivecart_events_customerEmail_idx" ON "thrivecart_events"("customerEmail");
CREATE INDEX "thrivecart_events_processingStatus_idx" ON "thrivecart_events"("processingStatus");

CREATE INDEX "offer_interactions_eventType_idx" ON "offer_interactions"("eventType");
CREATE INDEX "offer_interactions_serviceSlug_idx" ON "offer_interactions"("serviceSlug");
CREATE INDEX "offer_interactions_offerId_idx" ON "offer_interactions"("offerId");
CREATE INDEX "offer_interactions_customerId_idx" ON "offer_interactions"("customerId");

CREATE INDEX "offer_subscription_entitlements_status_renewsAt_idx" ON "offer_subscription_entitlements"("status", "renewsAt");
CREATE INDEX "offer_subscription_entitlements_customerId_idx" ON "offer_subscription_entitlements"("customerId");
CREATE INDEX "offer_subscription_entitlements_externalSubscriptionId_idx" ON "offer_subscription_entitlements"("externalSubscriptionId");

ALTER TABLE "offer_variants" ADD CONSTRAINT "offer_variants_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_offer_maps" ADD CONSTRAINT "service_offer_maps_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_purchases" ADD CONSTRAINT "offer_purchases_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "offer_purchases" ADD CONSTRAINT "offer_purchases_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "offer_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fulfillment_jobs" ADD CONSTRAINT "fulfillment_jobs_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "offer_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generated_assets" ADD CONSTRAINT "generated_assets_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "offer_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generated_assets" ADD CONSTRAINT "generated_assets_fulfillmentJobId_fkey" FOREIGN KEY ("fulfillmentJobId") REFERENCES "fulfillment_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offer_interactions" ADD CONSTRAINT "offer_interactions_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offer_interactions" ADD CONSTRAINT "offer_interactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "offer_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offer_subscription_entitlements" ADD CONSTRAINT "offer_subscription_entitlements_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "offer_subscription_entitlements" ADD CONSTRAINT "offer_subscription_entitlements_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "offer_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_subscription_entitlements" ADD CONSTRAINT "offer_subscription_entitlements_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "offer_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
