type AliasMap = Record<string, string[]>;

const ENV_ALIASES: AliasMap = {
  AUTH_SECRET: ["NEXTAUTH_SECRET"],
  STRIPE_WEBHOOK_SECRET: ["STRIPE_SIGNING_SECRET", "STRIPE_SIIGNING_SECRET"],
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ["STRIPE_PUBLISHABLE_KEY"],
};

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getEnvValue(key: string, aliases: string[] = []) {
  const direct = cleanEnvValue(process.env[key]);
  if (direct) return direct;

  for (const alias of aliases) {
    const aliased = cleanEnvValue(process.env[alias]);
    if (aliased) return aliased;
  }

  return "";
}

export function applyEnvAliases(aliasMap: AliasMap = ENV_ALIASES) {
  for (const [canonical, aliases] of Object.entries(aliasMap)) {
    if (cleanEnvValue(process.env[canonical])) continue;

    const aliased = getEnvValue(canonical, aliases);
    if (aliased) {
      process.env[canonical] = aliased;
    }
  }
}

export function getAuthSecret() {
  return getEnvValue("AUTH_SECRET", ENV_ALIASES.AUTH_SECRET);
}

export function getStripeWebhookSecret() {
  return getEnvValue("STRIPE_WEBHOOK_SECRET", ENV_ALIASES.STRIPE_WEBHOOK_SECRET);
}

export function getStripePublishableKey() {
  return getEnvValue(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    ENV_ALIASES.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}
