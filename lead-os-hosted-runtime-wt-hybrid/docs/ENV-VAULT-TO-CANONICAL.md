# Vercel shared env names → kernel canonical names

Your Vercel **shared** variables can keep **vault-style names**. At **Node server startup**, `src/lib/env-vault-aliases.ts` (via `src/instrumentation.ts`) copies values into **canonical** names only when the canonical variable is **unset**, so explicit `DATABASE_URL` / `STRIPE_SECRET_KEY` etc. always win.

## Auto-mapped (code)

| Your / vault-style name | Canonical name used by Lead OS kernel |
|---------------------------|------------------------------------------|
| `AITABLE_API_KEY` | `AITABLE_API_TOKEN` |
| `STRIPE_API_KEY` | `STRIPE_SECRET_KEY` |
| `STRIPE_SIIGNING_SECRET` (typo) or `STRIPE_SIGNING_SECRET` | `STRIPE_WEBHOOK_SECRET` |
| `OPEN_AI_API_KEY` | `OPENAI_API_KEY` |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `NEW_ANTHROPIC_KEY` / `ANTHROPIC_MOLTBOT_KEY` | `AI_API_KEY` (+ `AI_PROVIDER` `openai` or `anthropic` if unset) |
| `AGENTICFLOW_AI_KEY` | `AGENTICFLOW_API_KEY` |
| `WBIZTOOL_COM_API_KEY` | `WBIZTOOL_API_KEY` |
| `REOON_EMAIL_VERIFIER_API_KEY` | `REOON_API_KEY` |
| `SMS_IT_API_KEY`, `SMS_IT_API_KEY_1` | `SMSIT_API_KEY` |
| `INSIGHTO_AI_API_KEY`, `INSIGHTO_AI_API_KEY_1`, `INSIGHTO_AI_1_API_KEY`, `INSIGHTO_AI_API_KEY_FOR_NOTROOM` | `INSIGHTO_API_KEY` |
| `EMAILIT_API_KEY_1`, `EMAILIT_API_KEY_2`, `EMAILIT_API_KEY_FOR_AILUROPHOBIA`, `EMAILIT_API_KEY_FOR_AILUROPHobia` | `EMAILIT_API_KEY` |
| `CALLSCALER_API_KEY_1` | `CALLSCALER_API_KEY` |
| `CROVE_API_KEY_1` | `CROVE_API_KEY` |
| `FORMALOO_API_SECRET` | `FORMALOO_API_KEY` (when key empty; adapter uses a single bearer-style field today) |
| `N8N_FLINT_API_KEY`, `N8N_FLINT_API_KEY_1` | `N8N_API_KEY` |
| `SUPABASE_API_KEY_SECRET` | `SUPABASE_SERVICE_ROLE_KEY` (and `SUPABASE_KEY` if still empty) |
| `SUPABASE_API_KEY_PUBLISHABLE` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY` |

## Match already (no alias)

Use the **same** name on Vercel as in `.env.example`: e.g. `DATABASE_URL`, `ANTHROPIC_API_KEY` (if you set `AI_API_KEY` directly you do not need the OpenAI/Anthropic alias path), `VBOUT_API_KEY`, `THOUGHTLY_API_KEY`, `FLOWLU_API_KEY`, `ACUMBAMAIL_API_KEY`, `DATABAR_API_KEY`, `BOOST_SPACE_API_KEY`, `VISTA_SOCIAL_API_KEY`, `SALESPANEL_API_KEY`, `AUTOBOUND_API_KEY`, `HEXOMATIC_API_KEY`, `THRIVECART_API_KEY`, `STRAICO_API_KEY`, `UPVIRAL_API_KEY`, `CLODURA_API_KEY`, `N8N_API_KEY`, `TELEGRAM_BOT_TOKEN`, etc.

## Not used by this kernel (no mapping)

These names are fine to keep in Vercel for **other** repos or tools; **this** Next.js app does not read them unless you add code: e.g. `CLERK_*`, `NEON_API_KEY`, `POSTHOG_PROJECT_TOKEN`, `GROQ_API_KEY`, `GEMINI_*`, `NGROK_*`, most `SUITEDASH_*_API_KEY` tenant-specific keys (the kernel expects one pair `SUITEDASH_PUBLIC_ID` + `SUITEDASH_SECRET_KEY`), `OUTSCRAPER_*` vs `GMAPS_SCRAPER_API_KEY`, platform tokens (`VERCEL_*`, `RAILWAY_*`, `GITHUB_*`, `CURSOR_*`), etc.

To use **Google Maps / Outscraper-style** scraping in this codebase, configure **`GMAPS_SCRAPER_API_KEY`** (and optional `GMAPS_SCRAPER_BASE_URL`) per `src/lib/integrations/gmaps-scraper-adapter.ts` — do not assume `OUTSCRAPER_*` is wired.

## Tools you need

| Tool | Role |
|------|------|
| **Vercel project env UI** | Attach shared vars to the **kernel** project; set Production/Preview as needed. |
| **This repo** | `.env.example` = full canonical list; `npm run detect:env` (from hybrid) shows which `.env.example` keys are set in the **current shell** (for CI); local dev usually uses `.env.local`. |
| **Runtime** | After deploy, hit `/api/health` and `/api/health/deep` (with DB/Redis as configured) — no secrets in responses. |

## Stripe note

`STRIPE_PUBLISHABLE_KEY` / `STRIPE_RESTRICTED_KEY` are **not** read by `src/lib/billing.ts` today (only `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + optional `STRIPE_PRICE_*`). Add a client publishable key only if you implement Checkout.js / Elements and read it from `NEXT_PUBLIC_STRIPE_*` yourself.
