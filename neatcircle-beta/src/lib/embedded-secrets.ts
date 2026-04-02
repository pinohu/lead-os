// ── Environment-based secrets ─────────────────────────────────────────
// All secrets are read from environment variables. NO hardcoded values.
// See .env.sample for the full list of required env vars.
// ──────────────────────────────────────────────────────────────────────

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const embeddedSecrets = {
  suitedash: {
    publicId: env("SUITEDASH_PUBLIC_ID"),
    secretKey: env("SUITEDASH_SECRET_KEY"),
  },
  emailit: {
    apiKey: env("EMAILIT_API_KEY"),
  },
  aitable: {
    apiToken: env("AITABLE_API_TOKEN"),
    datasheetId: env("AITABLE_DATASHEET_ID"),
  },
  wbiztool: {
    apiKey: env("WBIZTOOL_API_KEY"),
    instanceId: env("WBIZTOOL_INSTANCE_ID"),
  },
  discord: {
    newLeadsWebhook: env("DISCORD_NEW_LEADS_WEBHOOK"),
    errorsWebhook: env("DISCORD_ERRORS_WEBHOOK"),
    winsWebhook: env("DISCORD_WINS_WEBHOOK"),
    highValueWebhook: env("DISCORD_HIGH_VALUE_WEBHOOK"),
  },
  telegram: {
    botToken: env("TELEGRAM_BOT_TOKEN"),
    newLeadsChat: env("TELEGRAM_NEW_LEADS_CHAT"),
    errorsChat: env("TELEGRAM_ERRORS_CHAT"),
    winsChat: env("TELEGRAM_WINS_CHAT"),
    highValueChat: env("TELEGRAM_HIGH_VALUE_CHAT"),
  },
  cron: {
    secret: env("CRON_SECRET"),
  },
  dashboard: {
    secret: env("DASHBOARD_SECRET"),
  },
  stripe: {
    secretKey: env("STRIPE_SECRET_KEY"),
    publishableKey: env("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  },
  callscaler: {
    apiKey: env("CALLSCALER_API_KEY"),
  },
  upviral: {
    apiKey: env("UPVIRAL_API_KEY"),
    campaignUrl: env("UPVIRAL_CAMPAIGN_URL"),
  },
  agenticflow: {
    apiKey: env("AGENTICFLOW_API_KEY"),
  },
  boost: {
    apiKey: env("BOOST_API_KEY"),
    makeApiToken: env("MAKE_API_TOKEN"),
  },
  automation: {
    apiSecret: env("AUTOMATION_API_SECRET"),
  },
};
