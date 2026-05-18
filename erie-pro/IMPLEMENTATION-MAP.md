# Lead OS Stack — Implementation Map (2026-05-18)

**Purpose.** Per the operator directive, this is a short factual map of what's deployable today, what's blocked, and what the next concrete actions are — across all four surfaces (Erie.Pro, Lead OS kernel, NeatCircle, public embed runtime).

It supersedes nothing. It reconciles `/STATUS.md`, `/FINAL_STATUS.md`, `/docs/LAUNCH_ORDER.md`, `/AUDIT.md` (2026-05-15), and `/erie-pro/AUDIT-2026-05-18.md` (the deep audit shipped on this branch).

---

## 1 — Deployable Surfaces (state today)

| Surface | Repo path | Production | Build | Tests | Notes |
|---|---|---|---|---|---|
| Erie.Pro (consumer site) | `erie-pro/` | LIVE @ https://erie.pro (verified 2026-05-13) | PASS (15.5.12) | 429/429 | Per `STATUS.md` it has a verified Ready Vercel deployment aliased to apex + www. |
| Lead OS hosted runtime (hybrid kernel) | `lead-os-hosted-runtime-wt-hybrid/` | Not yet deployed (see runbook) | PASS | 4280/4281 (1 legitimate skip) | Has its own `OPERATOR_RUNBOOK.md` + 14 migrations. Strong test surface. |
| NeatCircle (B2B funnel) | `neatcircle-beta/` | Not yet deployed | PASS | 22/22 (after CI fix in prior audit) | `next lint` script broken — H3 in prior AUDIT.md, not yet fixed. |
| Public embed runtime | `lead-os-hosted-runtime-wt-public/` | Not yet deployed | PASS | 27/27 | C3 in prior AUDIT.md: **no CI coverage at all**. |

Build / typecheck / test results above are this-branch reruns where reproducible from this container; deployment status is reproduced from `STATUS.md` / `FINAL_STATUS.md` and not re-verified live (no Vercel CLI auth in this container).

---

## 2 — Current Blockers (by surface)

### Erie.Pro — revenue spine
All blockers are `BLOCKED-EXTERNAL` dashboard work, per `docs/LAUNCH_ORDER.md` steps D–H:

| Step | System | Blocker | Doc |
|---|---|---|---|
| D | ThriveCart | Create products to match `docs/external-setup/thrivecart/master-setup.json` slugs/prices; provide `THRIVECART_API_KEY`; one $1 test purchase | `docs/external-setup/thrivecart.md` |
| E | ConvertBox | Activate boxes; apply targeting per `convertbox/placement-matrix.json` | `docs/external-setup/convertbox.md` |
| F | Boost.space | Import scenarios from `boostspace/revenue-action-scenarios.json`; workspace token | `docs/external-setup/boostspace.md` |
| G | SuiteDash | Confirm project/portal/support/task objects per `suitedash/operational-sync-package.json` | `docs/external-setup/suitedash.md` |
| H | ProductDyno | Create products per `fulfillment-channel-map.json`; set `PRODUCTDYNO_*` env vars | `docs/external-setup/offer-fulfillment.md` |
| Closing | Write-mode E2E | `REVENUE_QA_WRITE=1 npm run revenue:e2e` — only after D + one of E/F/G | — |

**Net:** Code is shipped. First dollar is gated on D and at least one of E/F/G.

### Erie.Pro — deep-audit findings (this branch)
See `/erie-pro/AUDIT-2026-05-18.md` for the full list. The five **Critical** items that warrant a sprint plan:

- **C1** TCPA consent version not stored on Lead row (schema migration + writer update).
- **C2** TCPA text duplicated across 5+ component files (refactor to single export).
- **C3** Concierge phone hardcoded in 43+ files (refactor to single export).
- **C4** Intake conversations not bound to a session cookie (anonymous-resource hijack window).
- **C5** Analytics dashboard does not exclude `demo:` seed rows — **fixed on this branch**.

### Lead OS kernel
- Postgres production migration story exists (`scripts/verify-migrations.mjs`) but is `workflow_dispatch`-only in CI (H2 in prior AUDIT.md).
- Nested `.github/workflows/ci.yml` under `lead-os-hosted-runtime-wt-hybrid/` is dead (GitHub honors only repo-root workflows) (H1 in prior AUDIT.md).
- License inconsistency: `package.json` says MIT, README says private (M3).
- Operator auth + Stripe billing wiring requires live Stripe keys + a chosen prod DATABASE_URL — not in this environment.

### NeatCircle
- `npm run lint` invokes deprecated `next lint`, drops to interactive prompt — unusable in CI (H3 in prior AUDIT.md). Either delete the script or migrate to `eslint` CLI per the Next codemod.
- No CI test job (per prior AUDIT recommendation #2). With C2-prior fixed, the 22 tests are now meaningful again.
- Cloudflare/Vercel deploy path needs domain + DNS — external.

### Public embed runtime
- **No CI coverage at all** (C3 in prior AUDIT.md). Recommend mirroring the `typecheck-erie` / `build-edge` jobs.
- Not in `dependabot.yml` (L2).
- 8 high-severity advisories per prior audit's H4 table (Next.js bump).

---

## 3 — Required env vars (per package)

Each package has an `.env.example`. The high-confidence non-secrets list (this is the operator-needs view, not a secret listing):

### Erie.Pro (`erie-pro/.env.example` is canonical; 102 lines)
- `DATABASE_URL` — Neon Postgres (production exists)
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` — already provisioned per `STATUS.md`
- `ANTHROPIC_API_KEY` — intake classifier
- `THRIVECART_API_KEY` + `THRIVECART_WEBHOOK_TOKEN` — **revenue blocker**
- `BOOSTSPACE_*` — revenue routing
- `SUITEDASH_*` — operational sync
- `PRODUCTDYNO_*` — fulfillment
- `CRON_SECRET` — provisioned 2026-05-15, id `rSAQo56Y63WLH3mR`
- `UNSUBSCRIBE_SECRET` — **audit M5**: currently has hardcoded fallback; should be required
- `SLACK_ALERT_WEBHOOK_URL` — recent feature
- `OUTSCRAPER_API_KEY` — directory scrapes (do not run paid scrapes without owner approval)

### Lead OS hybrid kernel (`lead-os-hosted-runtime-wt-hybrid/.env.example`)
- `DATABASE_URL` for prod Postgres
- Stripe keys (publishable + secret + webhook)
- Operator/super-admin bootstrap creds
- Optional Redis URL for the worker

### NeatCircle, public embed
See respective `.env.example` / `.env.sample` files. Both ship `.env.erie.example` variants for the Erie-tenant case.

---

## 4 — Tests & checks available

| Surface | Command | What it covers |
|---|---|---|
| Erie.Pro | `npx vitest run` | 429 tests across intake, routing, schema, viloud, lead-routing, niches |
| Erie.Pro | `npx tsc --noEmit` | TS strict |
| Erie.Pro | `SKIP_ENV_VALIDATION=1 npm run build` | Production build |
| Erie.Pro | `npm run service-pages:qa` | Playwright sweep of all 112 service pages × desktop/mobile (448 checks) — needs network egress to https://erie.pro |
| Erie.Pro | `npm run revenue:e2e` | Read-only revenue smoke — 5 pass / 2 skip without `REVENUE_QA_WRITE=1` |
| Erie.Pro | `npm run revenue:e2e -- REVENUE_QA_WRITE=1` | Full write-mode — requires D + one of E/F/G complete |
| Erie.Pro | `npm run neon:audit` | Neon row-level audit — requires prod `DATABASE_URL` pulled |
| Erie.Pro | `npm run convertbox:verify` | ConvertBox placement matrix check — requires D-E complete |
| Lead OS hybrid | `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run verify:migrations` | per its CI workflow |
| NeatCircle | `npm test`, `npx tsc --noEmit`, `npm run build` | lint broken (H3) |
| Public embed | `npm test`, `npx tsc --noEmit`, `npm run build` | not gated in CI |

---

## 5 — Exact next actions (operator-facing)

In dependency order, smallest unit per row:

### Today / no credentials needed
1. **Land `/erie-pro/AUDIT-2026-05-18.md`** (this branch).
2. **C5 fix** — `intake-analytics/page.tsx` demo filter (this branch).
3. **L7 fix** — gitignore `docs/viloud-curation/output/` (this branch).
4. **Bump Next.js** — `cd erie-pro && npm i next@^15.5.16 && npm i` to clear `npm audit`'s one high advisory (prior AUDIT.md H4, this audit L11). Verify with `npx tsc --noEmit && npx vitest run && npm run build`. Single-line dep change.

### Next sprint (no external creds needed; medium effort)
5. **C2 fix** — extract `TCPA_TEXT_V2` + `TCPA_VERSION` into `erie-pro/src/lib/tcpa-text.ts`; replace 5+ duplicate component definitions with imports; add vitest asserting rendered widget HTML matches DB-stored string.
6. **C3 fix** — same shape for `(814) 200-0328` into `erie-pro/src/lib/concierge.ts`; replace 43+ literal sites; add vitest banning the literal outside `concierge.ts`.
7. **C4 fix** — add HTTP-only `intake_sid` cookie on `/api/intake/start`; store on `IntakeConversation`; verify on every subsequent step. Schema migration adds one column.
8. **C1 fix** — add `tcpaConsentVersion` column to Lead; write `TCPA_VERSION` at capture; backfill existing rows to `v2-2026-04-02`. Migration + 2 writer updates.
9. **H1 fix** — `@@unique([phone, niche, city])` + `@@index([email])` on Lead; wrap `routeLead` and `recordLeadOutcome` in `$transaction`; handle P2002 idempotently in `/api/intake/complete`.
10. **H4 fix** — Sub-page JSON-LD emitter. Highest-leverage SEO ROI on this branch.

### Requires external action (operator only)
11. **LAUNCH_ORDER.md D–H** in priority order (D first, then any of E/F/G, then H).
12. **Closing E2E** — `REVENUE_QA_WRITE=1 npm run revenue:e2e`.
13. **Lead OS kernel deploy** — DATABASE_URL + Stripe keys + Vercel project link.
14. **NeatCircle deploy** — Cloudflare/Vercel + domain.
15. **Public embed CI** — add typecheck/test/build jobs to root `.github/workflows/ci.yml`.

---

## 6 — Day-one operations coverage (per directive)

| Capability | Status | Source |
|---|---|---|
| Live chat (concierge handoff) | Intake widget → phone CTA `(814) 200-0328` | Components ship; no live-agent backend integrated |
| Call tracking | Not wired | No call-tracking provider in code |
| Analytics | Funnel + KPIs at `/admin/intake-analytics`; A/B framework at `src/lib/experiments/*` | DONE (this branch: demo-data filter applied) |
| Email nurture (lifecycle) | Transactional only; no nurture sequencer | Lifecycle nurture sits in offer-fulfillment + boostspace scenarios — BLOCKED-EXTERNAL |
| Directory audit | `scripts/audit-neon.ts` + 1,803 listings cleaned 2026-05-15 | DONE; ~50-150 more lower-confidence noise pending per `LAUNCH_ORDER.md` |
| GDPR export/delete/consent | Audit-log infra exists; `process-deletions` cron is one of the 8 provisioned | Capacity exists; no admin UI for visitor self-serve GDPR right-of-access |
| TCPA consent capture | Captured at intake completion with `TCPA_TEXT_V2` + timestamp | **Audit C1**: version label not stored on row — open |
| Audit logging | `audit_logs` table populated via `lib/audit.ts`; visible at `/admin/audit-log` | DONE |
| Production monitoring | `/api/monitoring/revenue` protected + Vercel cron daily digest | DONE per `STATUS.md` |

---

## 7 — Risks (carrying forward)

- **TCPA traceability gap (C1)** — open and material; should land before any new TCPA wording is ever proposed.
- **Anonymous-conversation hijack (C4)** — small blast radius today, regulatory concern if pollution maps to identifiable leads.
- **Viloud auto-provisioner is scaffolding (H7)** — should not be pointed at production Viloud without selector verification + AST apply-ids rewrite. Manual provisioning is fine in the interim.
- **Next.js dep advisory (L11)** — single `npm i next@^15.5.16` clears it.
- **Public embed has no CI (C3 prior)** — anyone can land a broken build there. Mirror erie-pro's CI shape.

---

## 8 — Cost discipline (per directive's ~$100/mo cap)

| Line item | Used? | Notes |
|---|---|---|
| Neon Postgres | Yes (prod exists) | Within free/low tier for current row counts (451 lead events, 1,803 listings) |
| Vercel | Yes | Within free / Hobby tier for current routes — verify post-launch |
| Anthropic (intake classifier) | Yes, haiku-4-5 | Per-call cost is sub-cent; the budget concern is rate-limit abuse (audit rec: add per-IP rate limit on `/api/intake/message`) |
| ThriveCart | Not yet wired | Already-owned tool per CLAUDE.md context — no additional cost |
| ConvertBox / Boost.space / SuiteDash / ProductDyno | Not yet wired | Already-owned per docs/external-setup/* |
| YouTube Data API v3 | Free quota (10k units/day) | Audit H8: needs caching to stay within budget at 112+ niches |
| Outscraper | Existing | Run only on explicit scrape:places, not on every deploy |
| Slack webhook | Yes | Free for the volume implied |
| Vercel Cron | 8 production jobs gated by `CRON_SECRET` | Within Vercel's free cron entitlement |

No new paid services proposed by this audit cycle.

---

## 9 — How this map should be used

- Owner / operator: section 5 is your action queue.
- Engineer continuing this work: sections 1–4 are the source of truth for "what's running where," and the deep audit `/erie-pro/AUDIT-2026-05-18.md` is the source of truth for in-code findings.
- Future audit: section 7 lists what intentionally was not fixed in this cycle and why, so it isn't silently re-fixed.
