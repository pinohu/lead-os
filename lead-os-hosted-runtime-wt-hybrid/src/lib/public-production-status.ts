import { getDatabaseUrl } from "./db.ts";
import { isRedisUrlConfigured } from "./pricing/env.ts";

export type PublicProductionStatus = {
  deployment: {
    appUrl: string;
    environment: string;
    buildId: string | null;
    vercel: boolean;
    checkedAt: string;
  };
  delivered: Array<{
    area: string;
    status: "live" | "gated" | "not_configured";
    publicUrl?: string;
    detail: string;
  }>;
  runtime: {
    api: "live";
    publicHealth: "live";
    operatorDashboard: "live";
    database: "configured" | "not_configured";
    redisQueues: "configured" | "not_configured";
    stripeBilling: "configured" | "not_configured";
    liveSends: "enabled" | "disabled";
    billingEnforcement: "enabled" | "disabled";
  };
  assessment: {
    canViewPublicSite: boolean;
    canAssessPublicHealth: boolean;
    canUseOperatorDashboard: boolean;
    productionPersistenceReady: boolean;
    monetizationReady: boolean;
  };
  activationRequired: string[];
};

function publicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://lead-os-hosted-runtime-wt-hybrid.vercel.app"
  ).replace(/\/$/, "");
}

export function getPublicProductionStatus(): PublicProductionStatus {
  const appUrl = publicBaseUrl();
  const databaseConfigured = Boolean(getDatabaseUrl());
  const redisConfigured = isRedisUrlConfigured();
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  const liveSendsEnabled = process.env.LEAD_OS_ENABLE_LIVE_SENDS === "true";
  const billingEnforcementEnabled = process.env.LEAD_OS_BILLING_ENFORCE === "true";

  const activationRequired: string[] = [];
  if (!databaseConfigured) activationRequired.push("Attach DATABASE_URL or LEAD_OS_DATABASE_URL for persistent production data.");
  if (!redisConfigured) activationRequired.push("Attach REDIS_URL for distributed BullMQ queues and workers.");
  if (!stripeConfigured) activationRequired.push("Attach STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET for live billing.");
  if (!billingEnforcementEnabled) activationRequired.push("Set LEAD_OS_BILLING_ENFORCE=true after Stripe is configured.");
  if (!liveSendsEnabled) activationRequired.push("Set LEAD_OS_ENABLE_LIVE_SENDS=true after outbound provider credentials are verified.");

  return {
    deployment: {
      appUrl,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      buildId: process.env.LEAD_OS_BUILD_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      vercel: process.env.VERCEL === "1",
      checkedAt: new Date().toISOString(),
    },
    delivered: [
      {
        area: "Public web runtime",
        status: "live",
        publicUrl: appUrl,
        detail: "The Next.js application is deployed to Vercel and publicly viewable.",
      },
      {
        area: "Public health API",
        status: "live",
        publicUrl: `${appUrl}/api/health`,
        detail: "Returns live API, pricing runtime, worker, and database configuration status.",
      },
      {
        area: "Sanitized system API",
        status: "live",
        publicUrl: `${appUrl}/api/system`,
        detail: "Returns public service identity without leaking integration secrets.",
      },
      {
        area: "Operator dashboard",
        status: "gated",
        publicUrl: `${appUrl}/dashboard/control-plane`,
        detail: "The dashboard route is deployed; sensitive mutations require operator authentication.",
      },
      {
        area: "Postgres persistence",
        status: databaseConfigured ? "live" : "not_configured",
        detail: databaseConfigured
          ? "A production database URL is present."
          : "No production database URL is attached, so durable data operations are not active.",
      },
      {
        area: "Redis queues and workers",
        status: redisConfigured ? "live" : "not_configured",
        detail: redisConfigured
          ? "Redis is configured for distributed queue operation."
          : "Redis is not attached, so queue-backed work runs only through fallbacks or remains idle.",
      },
      {
        area: "Stripe billing",
        status: stripeConfigured && billingEnforcementEnabled ? "live" : stripeConfigured ? "gated" : "not_configured",
        detail: stripeConfigured
          ? billingEnforcementEnabled
            ? "Stripe credentials and billing enforcement are active."
            : "Stripe credentials are present, but billing enforcement is disabled."
          : "Stripe credentials are not attached, so checkout and subscription enforcement are not live.",
      },
      {
        area: "Outbound live sends",
        status: liveSendsEnabled ? "live" : "gated",
        detail: liveSendsEnabled
          ? "Outbound provider sends are enabled."
          : "Live sends are disabled until provider credentials are verified.",
      },
    ],
    runtime: {
      api: "live",
      publicHealth: "live",
      operatorDashboard: "live",
      database: databaseConfigured ? "configured" : "not_configured",
      redisQueues: redisConfigured ? "configured" : "not_configured",
      stripeBilling: stripeConfigured ? "configured" : "not_configured",
      liveSends: liveSendsEnabled ? "enabled" : "disabled",
      billingEnforcement: billingEnforcementEnabled ? "enabled" : "disabled",
    },
    assessment: {
      canViewPublicSite: true,
      canAssessPublicHealth: true,
      canUseOperatorDashboard: true,
      productionPersistenceReady: databaseConfigured,
      monetizationReady: databaseConfigured && stripeConfigured && billingEnforcementEnabled,
    },
    activationRequired,
  };
}
