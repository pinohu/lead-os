export type ProductionDependencyKey =
  | "database"
  | "redis"
  | "auth"
  | "cron"
  | "stripe"
  | "siteUrl"
  | "worker";

export type ProductionDependencyStatus = {
  key: ProductionDependencyKey;
  label: string;
  required: boolean;
  configured: boolean;
  envKeys: string[];
  detail: string;
};

export type ProductionReadinessStatus = {
  productionLike: boolean;
  strict: boolean;
  ready: boolean;
  missingRequired: ProductionDependencyStatus[];
  dependencies: ProductionDependencyStatus[];
};

function hasEnv(...keys: string[]) {
  return keys.some((key) => {
    const value = process.env[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function isProductionLikeRuntime() {
  return process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production" ||
    process.env.LEAD_OS_ENV === "production";
}

export function isStrictProductionConfigEnabled() {
  return process.env.LEAD_OS_ENFORCE_PRODUCTION_CONFIG === "true";
}

export function getProductionReadinessStatus(): ProductionReadinessStatus {
  const productionLike = isProductionLikeRuntime();
  const strict = isStrictProductionConfigEnabled();
  const requireInfra = productionLike || strict;
  const requireBilling = process.env.LEAD_OS_BILLING_ENFORCE !== "false" && requireInfra;

  const dependencies: ProductionDependencyStatus[] = [
    {
      key: "database",
      label: "Postgres database",
      required: requireInfra,
      configured: hasEnv("LEAD_OS_DATABASE_URL", "DATABASE_URL", "POSTGRES_URL"),
      envKeys: ["LEAD_OS_DATABASE_URL", "DATABASE_URL", "POSTGRES_URL"],
      detail: "Durable source of truth for tenants, leads, package provisioning, audit logs, billing, and runtime state.",
    },
    {
      key: "redis",
      label: "Redis queue backend",
      required: requireInfra,
      configured: hasEnv("REDIS_URL"),
      envKeys: ["REDIS_URL"],
      detail: "Required for reliable queues, distributed rate limits, retries, scheduler locks, and DLQ replay.",
    },
    {
      key: "auth",
      label: "Application auth secret",
      required: requireInfra,
      configured: hasEnv("LEAD_OS_AUTH_SECRET"),
      envKeys: ["LEAD_OS_AUTH_SECRET"],
      detail: "Signs middleware identities and operator sessions. It must not share the cron secret.",
    },
    {
      key: "cron",
      label: "Cron secret",
      required: requireInfra,
      configured: hasEnv("CRON_SECRET"),
      envKeys: ["CRON_SECRET"],
      detail: "Protects scheduled and internal maintenance endpoints.",
    },
    {
      key: "stripe",
      label: "Stripe billing",
      required: requireBilling,
      configured: hasEnv("STRIPE_SECRET_KEY") && hasEnv("STRIPE_WEBHOOK_SECRET"),
      envKeys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
      detail: "Required when billing enforcement is enabled so checkout, webhooks, and entitlements are real.",
    },
    {
      key: "siteUrl",
      label: "Public site URL",
      required: requireInfra,
      configured: hasEnv("NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL"),
      envKeys: ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL"],
      detail: "Used for checkout return URLs, generated workspaces, embeds, and customer-facing links.",
    },
    {
      key: "worker",
      label: "Dedicated worker runtime",
      required: requireInfra && process.env.LEAD_OS_REQUIRE_WORKER_URL === "true",
      configured: hasEnv("LEAD_OS_WORKER_URL") || process.env.LEAD_OS_REQUIRE_WORKER_URL !== "true",
      envKeys: ["LEAD_OS_WORKER_URL", "LEAD_OS_REQUIRE_WORKER_URL"],
      detail: "Identifies the separately deployed queue worker service when worker URL enforcement is enabled.",
    },
  ];

  const missingRequired = dependencies.filter((dependency) => dependency.required && !dependency.configured);
  return {
    productionLike,
    strict,
    ready: missingRequired.length === 0,
    missingRequired,
    dependencies,
  };
}

export function assertProductionReady(): void {
  const status = getProductionReadinessStatus();
  if (!status.strict || status.ready) return;

  const missing = status.missingRequired
    .map((dependency) => `${dependency.label} (${dependency.envKeys.join(" or ")})`)
    .join(", ");
  throw new Error(`Lead OS production configuration is incomplete: ${missing}`);
}
