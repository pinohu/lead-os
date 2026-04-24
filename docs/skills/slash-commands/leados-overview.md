# LeadOS Codebase Overview

You are working on **Lead OS** — a monorepo whose **kernel** is `lead-os-hosted-runtime-wt-hybrid/` (Next.js App Router, operator dashboard, public marketing routes, and `/api/*`). Sister deployables include **`erie-pro/`** (territory / local sites) and **`neatcircle-beta/`** (edge marketing, Cloudflare Workers). A lighter **`lead-os-hosted-runtime-wt-public/`** variant also exists.

## Canonical documentation (read first)

- **Route & surface truth table:** `lead-os-hosted-runtime-wt-hybrid/docs/PRODUCT-SURFACES.md` — which URLs are public marketing vs operator vs API-only; deployed apps mirror part of this at **`/docs`**.
- **Operator operations:** `lead-os-hosted-runtime-wt-hybrid/docs/OPERATOR_RUNBOOK.md`
- **Shipping & infra:** `lead-os-hosted-runtime-wt-hybrid/docs/DEPLOYMENT.md`
- **SLA template (legal placeholders):** `lead-os-hosted-runtime-wt-hybrid/docs/SLA.md`

## Kernel (`lead-os-hosted-runtime-wt-hybrid/`)

- **Stack:** Next.js (see that package’s `package.json` for exact version), React, TypeScript strict, Tailwind, Radix/shadcn-style UI.
- **Tests:** `npm test` runs the Node.js test runner over `tests/**/*.test.ts`. **Do not** hard-code “N tests, 100% pass” in agent output — counts change by branch.
- **API surface:** Run `npm run enumerate:api-routes` for an up-to-date list; OpenAPI JSON is served at **`/api/docs/openapi.json`** when the app is running.
- **Auth:** Public routes, operator magic-link sessions for `/dashboard/*`, API keys, and cron secrets are all used depending on the route — see middleware and `docs/SYSTEM-HARDENING.md`.
- **Integrations:** Many adapters **dry-run** or stub when credentials are missing; production behavior requires env keys per `.env.example`.

## Erie Pro (`erie-pro/`)

- Territory / niche marketing site — **see that folder’s `README.md` and `npm run build` output** for current static generation scope and example URLs. Do not copy stale page counts from old prompts.

## NeatCircle (`neatcircle-beta/`)

- Edge / marketing Workers app — see package `README.md` and Wrangler config.

## Git

- Upstream example: `https://github.com/pinohu/lead-os` (clone path on your machine will differ).
