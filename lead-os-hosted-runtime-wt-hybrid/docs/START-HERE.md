# Start here — Lead OS monorepo (novice path)

This file is the **single entry point** for humans and for checking that marketing, the app, and the repo agree. If anything below disagrees with another doc, **this file plus** `lead-os-hosted-runtime-wt-hybrid/docs/PRODUCT-SURFACES.md` **plus** `lead-os-hosted-runtime-wt-hybrid/docs/CLAIMS-VERIFICATION.md` (what is machine-checked) win until you fix the drift.

## 1. What you are looking at

| Path on disk | What it is | First command you usually need |
|--------------|------------|----------------------------------|
| `lead-os-hosted-runtime-wt-hybrid/` | **Kernel** — public site, `/dashboard`, most `/api/*`, billing, marketplace, migrations | `npm install` then `npm run dev` |
| `erie-pro/` | **Territory / local SEO app** (Erie-style deployments) | `npm install` then `npm run dev` (port from its README) |
| `neatcircle-beta/` | **Edge / marketing** (Cloudflare Workers path) | `npm install` then see that README |
| `lead-os-hosted-runtime-wt-public/` | **Alternate lighter runtime** — not feature-parity with the kernel | Read its README before using |
| `docs/` (this folder) | **Website-rendered knowledge base** — core repo documents are exposed under `/docs/[slug]` | Read on the website docs hub |
| `_n8n_sources/` | **Vendored upstream n8n/MCP trees** — reference only | Read `_n8n_sources/README.md` |

**In the browser (kernel deployment):** open **`/docs`** for API + SLA summary + links into this repo.

## 2. Clone and run the kernel locally (fastest path)

Run these **exactly** from your machine shell (adjust only the clone directory name if you used one):

```bash
git clone <lead-os-repo-url>
cd lead-os
cd lead-os-hosted-runtime-wt-hybrid
npm install
cp .env.example .env.local
npm run dev
```

Then:

1. Open `http://localhost:3000` — public marketing.
2. Open `http://localhost:3000/api/health` — should return JSON with `success` and runtime flags.
3. Open `http://localhost:3000/docs` — in-app documentation hub.

**No `.env.local`?** The kernel can still boot for many flows using in-memory / dry-run defaults; anything that needs Postgres, Redis, Stripe, or outbound email will stay **off or simulated** until you set variables (see `.env.example`).

## 3. Postgres (when you want persistence, not a demo)

1. Create a database and set **`LEAD_OS_DATABASE_URL`** or **`DATABASE_URL`** in `.env.local` (see `.env.example`).
2. Start the app or any route that initializes the DB pool — the kernel runs **SQL migrations** from `lead-os-hosted-runtime-wt-hybrid/db/migrations/` via `initializeDatabase()` (see `src/lib/db.ts`).
3. Before production, run:

   ```bash
   cd lead-os-hosted-runtime-wt-hybrid
   npm run verify:migrations
   ```

4. Full production checklist: **`lead-os-hosted-runtime-wt-hybrid/docs/DEPLOYMENT.md`**.

**Do not assume** “tables appear without migrations” — they appear because the **migration runner** applies files in `db/migrations/`, not because Postgres auto-infers schema.

## 4. Operator dashboard (internal users)

1. Set **`LEAD_OS_OPERATOR_EMAILS`** and **`LEAD_OS_AUTH_SECRET`** (see `.env.example`).
2. Visit **`/auth/sign-in`**, request a magic link, complete sign-in.
3. Open **`/dashboard`**. Anything under **`/dashboard/*`** is **operator-only** (see `PRODUCT-SURFACES.md`).

## 5. What the marketing site is allowed to promise

- **True without extra work:** configurable funnels, assessments, public pages listed in `PRODUCT-SURFACES.md`, API surface documented via OpenAPI at `/api/docs/openapi.json`, dry-run integrations when keys are missing.
- **True only with configuration:** Postgres + migrations, Redis + `npm run worker` for BullMQ pricing queues, Stripe webhooks, live email/SMS, cron secrets on `/api/cron/*`, marketplace data instead of the demo banner.
- **Legal / commercial SLA:** `docs/SLA.md` is a **template** until your lawyers and DNS match the placeholders — the in-app **`/docs/sla`** page states this; do not resell uptime credits until that is done.

## 6. Quality gate before you say “production ready”

From `lead-os-hosted-runtime-wt-hybrid/`:

```bash
npm test
npx tsc --noEmit
npm run build
npm run verify:product-surfaces
npm run verify:migrations   # when DATABASE_URL is set
```

For Erie and NeatCircle, run **`npm run build`** (and `npm test` where that package defines it) in **each** folder you ship.

## 7. Where other long docs fit

| Document | Use when |
|----------|----------|
| `LEAD-OS-COMPLETE-GUIDE.md` | Broad platform narrative — verify numbers against scripts, not vice versa |
| `docs/CODEBASE_AUDIT.md` | Historical audit snapshot — re-validate findings before acting |
| `docs/API_REFERENCE.md` | Human narrative around APIs — prefer OpenAPI + `enumerate:api-routes` for truth |
| `SERVICE-BLUEPRINTS.md` | Service-design fiction with composite personas — not a contract |
| `make-scenarios/LEAD-OS-USER-JOURNEYS.md` | Vision / partner-stack mapping — not a guarantee every layer is live |

When in doubt, **grep `src/`** or read **`PRODUCT-SURFACES.md`**.
