-- Service request action, notification, and status visibility (P0)

CREATE TYPE "ServiceRequestStatus" AS ENUM (
  'draft',
  'submitted',
  'consumer_confirmation_queued',
  'consumer_confirmation_sent',
  'consumer_confirmation_failed',
  'provider_notification_queued',
  'provider_notification_sent',
  'provider_notification_failed',
  'completed',
  'cancelled'
);

CREATE TYPE "NotificationEventStatus" AS ENUM (
  'queued',
  'sending',
  'sent',
  'failed'
);

CREATE TYPE "NotificationRecipientRole" AS ENUM (
  'consumer',
  'provider',
  'admin'
);

CREATE TABLE "user_actions" (
  "id" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "actorType" TEXT NOT NULL DEFAULT 'consumer',
  "actorId" TEXT,
  "serviceRequestId" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_requests" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "status" "ServiceRequestStatus" NOT NULL DEFAULT 'submitted',
  "statusAccessToken" TEXT NOT NULL,
  "leadId" TEXT,
  "niche" TEXT NOT NULL,
  "city" TEXT NOT NULL DEFAULT 'erie',
  "firstName" TEXT,
  "lastName" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "message" TEXT,
  "sourcePage" TEXT,
  "routingIntent" TEXT NOT NULL DEFAULT 'general',
  "requestedProviderName" TEXT,
  "requestedProviderSlug" TEXT,
  "requestedProviderPhone" TEXT,
  "requestedProviderAddress" TEXT,
  "routedToProviderId" TEXT,
  "routedToProviderName" TEXT,
  "routeType" TEXT,
  "tcpaConsent" BOOLEAN NOT NULL DEFAULT false,
  "tcpaConsentText" TEXT,
  "tcpaConsentAt" TIMESTAMP(3),
  "tcpaIpAddress" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_templates" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "htmlBody" TEXT NOT NULL,
  "textBody" TEXT,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_events" (
  "id" TEXT NOT NULL,
  "serviceRequestId" TEXT NOT NULL,
  "templateSlug" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "recipientRole" "NotificationRecipientRole" NOT NULL,
  "status" "NotificationEventStatus" NOT NULL DEFAULT 'queued',
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "maxRetries" INTEGER NOT NULL DEFAULT 3,
  "nextRetryAt" TIMESTAMP(3),
  "lastError" TEXT,
  "providerMessageId" TEXT,
  "sentAt" TIMESTAMP(3),
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "status_events" (
  "id" TEXT NOT NULL,
  "serviceRequestId" TEXT NOT NULL,
  "status" "ServiceRequestStatus" NOT NULL,
  "message" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "status_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "service_requests_requestId_key" ON "service_requests"("requestId");
CREATE UNIQUE INDEX "service_requests_correlationId_key" ON "service_requests"("correlationId");
CREATE UNIQUE INDEX "service_requests_statusAccessToken_key" ON "service_requests"("statusAccessToken");
CREATE INDEX "service_requests_email_idx" ON "service_requests"("email");
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");
CREATE INDEX "service_requests_correlationId_idx" ON "service_requests"("correlationId");
CREATE INDEX "service_requests_leadId_idx" ON "service_requests"("leadId");

CREATE UNIQUE INDEX "notification_templates_slug_key" ON "notification_templates"("slug");
CREATE INDEX "notification_events_serviceRequestId_idx" ON "notification_events"("serviceRequestId");
CREATE INDEX "notification_events_status_nextRetryAt_idx" ON "notification_events"("status", "nextRetryAt");
CREATE INDEX "notification_events_templateSlug_idx" ON "notification_events"("templateSlug");

CREATE INDEX "status_events_serviceRequestId_createdAt_idx" ON "status_events"("serviceRequestId", "createdAt");

CREATE INDEX "user_actions_correlationId_idx" ON "user_actions"("correlationId");
CREATE INDEX "user_actions_serviceRequestId_idx" ON "user_actions"("serviceRequestId");
CREATE INDEX "user_actions_actionType_createdAt_idx" ON "user_actions"("actionType", "createdAt");

ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_templateSlug_fkey" FOREIGN KEY ("templateSlug") REFERENCES "notification_templates"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "status_events" ADD CONSTRAINT "status_events_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
