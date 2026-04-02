-- CreateEnum
CREATE TYPE "ProviderTier" AS ENUM ('primary', 'backup', 'overflow');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'trial', 'past_due', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "LeadRouteType" AS ENUM ('primary', 'failover', 'overflow', 'unmatched');

-- CreateEnum
CREATE TYPE "LeadOutcomeType" AS ENUM ('responded', 'converted', 'no_response', 'declined', 'cancelled');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('cold', 'warm', 'hot', 'burning');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('new_lead', 'sla_warning', 'lead_expired', 'review_received', 'payment_failed', 'subscription_activated', 'subscription_cancelled');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'sms', 'both');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('connected', 'voicemail', 'missed', 'busy');

-- CreateEnum
CREATE TYPE "CheckoutSessionType" AS ENUM ('territory_claim', 'lead_purchase');

-- CreateEnum
CREATE TYPE "CheckoutSessionStatus" AS ENUM ('pending', 'completed', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('pending', 'approved', 'denied');

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'erie',
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "addressStreet" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "serviceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL DEFAULT '',
    "yearEstablished" INTEGER,
    "employeeCount" TEXT,
    "license" TEXT,
    "insurance" BOOLEAN NOT NULL DEFAULT false,
    "tier" "ProviderTier" NOT NULL DEFAULT 'primary',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'trial',
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 400,
    "billingInterval" TEXT NOT NULL DEFAULT 'monthly',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "convertedLeads" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLeadAt" TIMESTAMP(3),
    "churnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'erie',
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "routeType" "LeadRouteType" NOT NULL DEFAULT 'unmatched',
    "temperature" "LeadTemperature" NOT NULL DEFAULT 'warm',
    "slaDeadline" TIMESTAMP(3),
    "tcpaConsent" BOOLEAN NOT NULL DEFAULT false,
    "tcpaConsentText" TEXT,
    "tcpaConsentAt" TIMESTAMP(3),
    "tcpaIpAddress" TEXT,
    "routedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_outcomes" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "outcome" "LeadOutcomeType" NOT NULL,
    "responseTimeSeconds" DOUBLE PRECISION,
    "satisfactionRating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territories" (
    "id" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'erie',
    "providerId" TEXT NOT NULL,
    "tier" "ProviderTier" NOT NULL DEFAULT 'primary',
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" TIMESTAMP(3),

    CONSTRAINT "territories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "providerId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'email',
    "message" TEXT NOT NULL,
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracked_calls" (
    "id" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'erie',
    "callerPhone" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "routedTo" TEXT NOT NULL,
    "providerId" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "recordingUrl" TEXT,
    "outcome" "CallOutcome" NOT NULL DEFAULT 'missed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracked_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "id" TEXT NOT NULL,
    "sessionType" "CheckoutSessionType" NOT NULL,
    "stripeSessionId" TEXT,
    "niche" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'erie',
    "providerEmail" TEXT NOT NULL,
    "providerName" TEXT,
    "providerId" TEXT,
    "monthlyFee" DOUBLE PRECISION,
    "status" "CheckoutSessionStatus" NOT NULL DEFAULT 'pending',
    "leadId" TEXT,
    "temperature" "LeadTemperature",
    "price" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_disputes" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'pending',
    "creditAmount" DOUBLE PRECISION,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "providerId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'provider',
    "providerId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "niche" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE INDEX "providers_niche_city_idx" ON "providers"("niche", "city");

-- CreateIndex
CREATE INDEX "providers_email_idx" ON "providers"("email");

-- CreateIndex
CREATE INDEX "providers_stripeCustomerId_idx" ON "providers"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "leads_niche_city_idx" ON "leads"("niche", "city");

-- CreateIndex
CREATE INDEX "leads_routedToId_idx" ON "leads"("routedToId");

-- CreateIndex
CREATE INDEX "leads_routeType_niche_idx" ON "leads"("routeType", "niche");

-- CreateIndex
CREATE INDEX "lead_outcomes_leadId_idx" ON "lead_outcomes"("leadId");

-- CreateIndex
CREATE INDEX "lead_outcomes_providerId_idx" ON "lead_outcomes"("providerId");

-- CreateIndex
CREATE INDEX "territories_providerId_idx" ON "territories"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "territories_niche_city_key" ON "territories"("niche", "city");

-- CreateIndex
CREATE INDEX "notifications_providerId_idx" ON "notifications"("providerId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "tracked_calls_niche_city_idx" ON "tracked_calls"("niche", "city");

-- CreateIndex
CREATE INDEX "tracked_calls_providerId_idx" ON "tracked_calls"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_sessions_stripeSessionId_key" ON "checkout_sessions"("stripeSessionId");

-- CreateIndex
CREATE INDEX "checkout_sessions_stripeSessionId_idx" ON "checkout_sessions"("stripeSessionId");

-- CreateIndex
CREATE INDEX "checkout_sessions_providerEmail_idx" ON "checkout_sessions"("providerEmail");

-- CreateIndex
CREATE INDEX "lead_disputes_leadId_idx" ON "lead_disputes"("leadId");

-- CreateIndex
CREATE INDEX "lead_disputes_providerId_idx" ON "lead_disputes"("providerId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_providerId_idx" ON "audit_logs"("providerId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_routedToId_fkey" FOREIGN KEY ("routedToId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_outcomes" ADD CONSTRAINT "lead_outcomes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_outcomes" ADD CONSTRAINT "lead_outcomes_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "territories" ADD CONSTRAINT "territories_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracked_calls" ADD CONSTRAINT "tracked_calls_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_disputes" ADD CONSTRAINT "lead_disputes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_disputes" ADD CONSTRAINT "lead_disputes_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
