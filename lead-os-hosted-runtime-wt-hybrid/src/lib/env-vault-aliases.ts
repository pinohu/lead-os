// src/lib/env-vault-aliases.ts
// Maps Vercel "shared" / vault env names into canonical kernel names when the canonical var is unset.
// Runs from instrumentation (Node only). Never logs values.

function firstNonEmptyEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const v = process.env[name]
    if (v != null && String(v).trim() !== "") return v
  }
  return undefined
}

function copyIfEmpty(canonical: string, aliases: readonly string[]): void {
  const cur = process.env[canonical]
  if (cur != null && String(cur).trim() !== "") return
  const v = firstNonEmptyEnv(aliases)
  if (v !== undefined) process.env[canonical] = v
}

/**
 * Apply shared-vault name aliases. Safe to call multiple times; never overwrites a set canonical.
 */
export function applyEnvVaultAliases(): void {
  const pairs: readonly [string, readonly string[]][] = [
    ["AITABLE_API_TOKEN", ["AITABLE_API_KEY"]],
    ["STRIPE_SECRET_KEY", ["STRIPE_API_KEY"]],
    ["STRIPE_WEBHOOK_SECRET", ["STRIPE_SIIGNING_SECRET", "STRIPE_SIGNING_SECRET"]],
    ["OPENAI_API_KEY", ["OPEN_AI_API_KEY"]],
    ["AGENTICFLOW_API_KEY", ["AGENTICFLOW_AI_KEY"]],
    ["WBIZTOOL_API_KEY", ["WBIZTOOL_COM_API_KEY"]],
    ["REOON_API_KEY", ["REOON_EMAIL_VERIFIER_API_KEY"]],
    ["SMSIT_API_KEY", ["SMS_IT_API_KEY", "SMS_IT_API_KEY_1"]],
    [
      "INSIGHTO_API_KEY",
      [
        "INSIGHTO_AI_API_KEY",
        "INSIGHTO_AI_API_KEY_1",
        "INSIGHTO_AI_1_API_KEY",
        "INSIGHTO_AI_API_KEY_FOR_NOTROOM",
      ],
    ],
    [
      "EMAILIT_API_KEY",
      [
        "EMAILIT_API_KEY_1",
        "EMAILIT_API_KEY_2",
        "EMAILIT_API_KEY_FOR_AILUROPHOBIA",
        "EMAILIT_API_KEY_FOR_AILUROPHobia",
      ],
    ],
    ["CALLSCALER_API_KEY", ["CALLSCALER_API_KEY_1"]],
    ["CROVE_API_KEY", ["CROVE_API_KEY_1"]],
    ["FORMALOO_API_KEY", ["FORMALOO_API_SECRET"]],
    ["N8N_API_KEY", ["N8N_FLINT_API_KEY", "N8N_FLINT_API_KEY_1"]],
    [
      "SUPABASE_SERVICE_ROLE_KEY",
      ["SUPABASE_API_KEY_SECRET", "SUPABASE_SERVICE_KEY"],
    ],
    ["SUPABASE_KEY", ["SUPABASE_API_KEY_SECRET"]],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", ["SUPABASE_API_KEY_PUBLISHABLE"]],
    ["SUPABASE_ANON_KEY", ["SUPABASE_API_KEY_PUBLISHABLE"]],
  ]

  for (const [canonical, aliases] of pairs) copyIfEmpty(canonical, aliases)

  if (!process.env.AI_API_KEY?.trim()) {
    const openai = firstNonEmptyEnv(["OPENAI_API_KEY", "OPEN_AI_API_KEY"])
    const anthropic = firstNonEmptyEnv(["ANTHROPIC_API_KEY", "NEW_ANTHROPIC_KEY", "ANTHROPIC_MOLTBOT_KEY"])
    if (openai) {
      process.env.AI_API_KEY = openai
      if (!process.env.AI_PROVIDER?.trim()) process.env.AI_PROVIDER = "openai"
    } else if (anthropic) {
      process.env.AI_API_KEY = anthropic
      if (!process.env.AI_PROVIDER?.trim()) process.env.AI_PROVIDER = "anthropic"
    }
  }
}
