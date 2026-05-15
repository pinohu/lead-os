# Lead OS — Tests, Build Health, and Code-Quality Audit

**Date:** 2026-05-15
**Branch:** `claude/full-codebase-audit-K30EH`
**Scope:** All packages in the monorepo, including vendored `_n8n_sources/`.
**Dimensions covered:** Tests, type-checks, builds, lint, CI workflows,
dependency audit findings, code-quality and type-safety refactors.

This audit was run against the working tree at the head of the branch. Findings
are split into things actually fixed in this branch and things that need
follow-up. **Severity** uses the dimension prompt's lens, not security
prioritisation; "Critical" here means "CI is or should be red."

## TL;DR — what changed in this branch

### Round 1 (commit `f1f3eed`) — broken CI gates restored

| Fix | Where | Effect |
|-----|-------|--------|
| Restored hybrid typecheck (was failing on master) | `lead-os-hosted-runtime-wt-hybrid/tests/billing.test.ts`, `tests/package-provisioning.test.ts` | `npx tsc --noEmit` is back to exit 0 |
| Repaired broken `npm test` in NeatCircle | `neatcircle-beta/package.json` | 22 tests now run (were 0) |
| Repaired broken `npm test` in public runtime | `lead-os-hosted-runtime-wt-public/package.json` | 27 tests now run (were 0) |

### Round 2 — code-quality and type-safety refactors

| Fix | Where | Effect |
|-----|-------|--------|
| Killed 4 `as any` casts on runtime API responses | `lead-os-hosted-runtime-wt-hybrid/src/components/LiveDeliverableAction.tsx` | typed nested-property access through a `pick(value, ...path)` helper that returns `unknown` |
| Killed `Object.keys(...) as unknown as WizardStep[]` cast | `lead-os-hosted-runtime-wt-hybrid/src/components/SetupWizardClient.tsx` | replaced with a typed `readonly WizardStep[]` literal |
| Killed triple `as unknown as` casts on `deepMerge` | `lead-os-hosted-runtime-wt-hybrid/src/lib/niche-adapter.ts` (2 call-sites), `src/lib/context-engine.ts`, `src/app/api/niche-generator/[slug]/route.ts` | relaxed three local `deepMerge<T>` signatures from `T extends Record<string, unknown>` to `T extends object`; all four call-sites now compile without casts |
| Killed double-cast spread | `lead-os-hosted-runtime-wt-hybrid/src/app/api/ai/score/route.ts:41` | `{ ...storedLead }` retains the `StoredLeadRecord` properties; assignment to `Record<string, unknown>` is structural |
| Annotated optional out-of-band metadata access | `lead-os-hosted-runtime-wt-hybrid/src/app/api/gmb/ingest/[slug]/quality/route.ts:80` | replaced `(page as unknown as Record<string, unknown>).ingestedProfile` with a typed optional-property assertion plus comment explaining the contract |
| Removed redundant double-parse of webhook body | `erie-pro/src/lib/webhook-delivery.ts` | one `JSON.parse(body)` at the top of the function instead of two inside the headers literal; also narrows the event/timestamp values rather than reading them as `any` |
| Removed unneeded `as unknown as PrismaClient` casts | `erie-pro/src/lib/db.ts` plus 4 scripts under `erie-pro/src/scripts/` | `new PrismaClient({ adapter })` is already correctly typed under Prisma v7 + `@prisma/adapter-pg`; the casts were dead noise |
| Added strict flags to public-runtime tsconfig | `lead-os-hosted-runtime-wt-public/tsconfig.json` | now matches hybrid: `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`. Public code already complies — zero new errors |
| Logged silently-swallowed intake-fetch failures | `neatcircle-beta/src/components/{ROICalculator,ChatWidget,ExitIntent,AssessmentQuiz}.tsx` | fire-and-forget UX preserved, but errors now surface via `console.warn` for dev/debug |

After both rounds, every first-party package's typecheck, test, and build
runs locally without error.

## Verified build & test status (after fixes in this branch)

| Package | Typecheck | Test (count) | Build | Lint | CI gated? |
|---------|-----------|--------------|-------|------|-----------|
| `lead-os-hosted-runtime-wt-hybrid` | PASS | PASS — 4280 pass / 1 skip / 0 fail (4281 total) | PASS | — (no script) | Yes |
| `erie-pro` | PASS | PASS — 182 pass / 0 fail (20 files, vitest) | PASS | — (no script) | Yes |
| `neatcircle-beta` | PASS | PASS — 22 pass / 0 fail (after fix) | PASS | BROKEN (`next lint` is deprecated, interactive prompt) | Build only |
| `lead-os-hosted-runtime-wt-public` | PASS | PASS — 27 pass / 0 fail (after fix) | PASS | — (no script) | **NO CI** |

The one skipped hybrid test (`tests/stripe-webhook-idempotency.test.ts`) is a
legitimate `t.skip()` gated on `DATABASE_URL`, not a forgotten test.

## Critical findings

### C1. Hybrid typecheck was failing on `master` ✅ FIXED

`npx tsc --noEmit` exited with code 1, four errors:

```
tests/billing.test.ts(35,47): TS2704: The operand of a 'delete' operator cannot be a read-only property.
tests/billing.test.ts(36,20): TS2540: Cannot assign to 'NODE_ENV' because it is a read-only property.
tests/billing.test.ts(350,15): TS2540: Cannot assign to 'NODE_ENV' because it is a read-only property.
tests/package-provisioning.test.ts(116,27): TS2345: Argument of type 'string' is not assignable to parameter of type 'PackageSlug'.
```

Root cause: `@types/node ^22.15.21` (and the bundled `process.env` typing) now
marks `process.env.NODE_ENV` as `readonly`. The billing test mutates it during
setup/teardown. `package-provisioning.test.ts` lost its inferred narrow type
when iterating an inline string array.

**Implication:** The `Type Check (Hybrid)` CI job in
`.github/workflows/ci.yml` should be failing on every `master` push and PR
right now. Either CI is not gating merges, or the workflow file is not the
one being executed. Worth checking the GitHub Actions tab.

Fix in this branch: cast `process.env` to `Record<string, string | undefined>`
in the test, and give the inline slug list an explicit `PackageSlug[]`
annotation. No production code touched.

### C2. NeatCircle and public-runtime `npm test` invoked a non-existent Node flag ✅ FIXED

Both `neatcircle-beta/package.json` and `lead-os-hosted-runtime-wt-public/package.json`
shipped this script:

```
node --test --test-concurrency=1 --test-isolation=none --experimental-strip-types tests/**/*.test.ts
```

Node 22 does not accept `--test-isolation=none` (the flag is
`--experimental-test-isolation=none`, as used correctly by the hybrid kernel).
Result: every `npm test` for these two packages aborted instantly with
`node: bad option: --test-isolation=none` (exit 9) — **so 22 + 27 tests have
never actually executed** in either local or CI contexts.

The hybrid root CI workflow does not invoke `neatcircle-beta` or
`lead-os-hosted-runtime-wt-public` tests, which is why this rotted silently.

Fix in this branch: replaced `--test-isolation=none` with
`--experimental-test-isolation=none` in both `package.json` files. Both
suites now run and pass.

### C3. Public runtime has no CI coverage

`lead-os-hosted-runtime-wt-public` is not referenced by any job in
`.github/workflows/ci.yml`. No typecheck, no test, no build, no dependency
audit. It is also missing from `.github/dependabot.yml`. Anyone landing
changes there can ship a broken build / typecheck / test suite (as C2
demonstrates) without CI noticing.

**Recommendation:** mirror the `build-edge` / `typecheck-erie` job pattern
for `lead-os-hosted-runtime-wt-public`. Add a Dependabot stanza.

## High-severity findings

### H1. `lead-os-hosted-runtime-wt-hybrid/.github/workflows/ci.yml` is dead

GitHub Actions only honours workflows under the repository root
`.github/workflows/`. A nested `<package>/.github/workflows/` directory is
ignored. This file therefore cannot run. It also defines a job that calls
`npm run verify:migrations` — which the active root workflow does **not**
call in PR / push contexts (`hybrid-migrations.yml` is
`workflow_dispatch`-only). Anyone reading the nested file would reasonably
assume migration verification is gated on every PR; it isn't.

**Recommendation:** delete the dead nested workflow or, if migration
verification is desired in PR CI, lift its `verify:migrations` step into the
root `ci.yml` (it can be a soft check that no-ops when `DATABASE_URL` is
unset — the script already does this).

### H2. Migrations are never verified in PR CI

`scripts/verify-migrations.mjs` runs an ordering and emptiness check that
works without a database, plus a `lead_os_migrations` presence check that
needs `DATABASE_URL`. The DB-free portion would be a cheap pre-merge guard,
but no PR workflow runs it. As of this audit there are 14 migrations in
`db/migrations/`, and ordering bugs would only surface at deploy time.

### H3. NeatCircle lint script is unusable in CI

`npm run lint` invokes `next lint`, which:

1. Prints a deprecation warning (`next lint` is removed in Next.js 16).
2. Drops into an interactive prompt offering ESLint configuration choices.

This guarantees CI would hang if it were ever wired in. There is no ESLint
config (`.eslintrc*` / `eslint.config.*`) in `neatcircle-beta/`.

**Recommendation:** either delete the script, or migrate to the
ESLint CLI per Next's `next-lint-to-eslint-cli` codemod and commit a
non-interactive config.

### H4. Dependency audit: every package has open advisories

`npm audit --audit-level=critical` is the gate today, which lets through
`high`-severity findings — the actual state is:

| Package | Critical | High | Moderate | Low | Notes |
|---------|----------|------|----------|-----|-------|
| `lead-os-hosted-runtime-wt-hybrid` | 0 | 1+ | 2+ | 1+ | All via direct `next@^16.2.1`; advisories require `next ≥ 16.2.5/16.2.6` |
| `erie-pro` | 0 | 1+ | — | — | Via direct `next@^15.5.12`; needs `next ≥ 15.5.16` |
| `lead-os-hosted-runtime-wt-public` | 0 | 8 | 7 | 2 | Via direct `next@^15.5.12`; same upgrade |
| `neatcircle-beta` | 0 | 9 | 4 | 2 (?) | Transitive: `wrangler` → `miniflare`, `@aws-sdk/*` → `fast-xml-parser`, plus `brace-expansion`, `flatted` |

The hybrid + erie + public Next bumps are likely one-commit fixes. NeatCircle
needs a `wrangler` and `@opennextjs/cloudflare` upgrade pass.

The audit job in root CI is `--audit-level=critical || true`, so even
"critical" findings would not fail the build. Consider tightening to `high`
once the current backlog is cleared.

## Medium-severity findings

### M1. erie-pro Playwright is installed but not wired

`@playwright/test@^1.60.0` is in `devDependencies`, but there is no
`playwright.config.*` and no `test:e2e` script. The `qa:service-pages` and
`verify:convertbox` `tsx` scripts may shell into Playwright directly. If
they do, the lack of an explicit CI job means those QA flows only run when
someone remembers to invoke them.

### M2. No coverage signal anywhere in CI

erie-pro defines `test:coverage` (vitest), but no CI job collects or
publishes it. Hybrid (`node --test`) emits TAP only. There is no way to
spot test-coverage regressions in PRs.

### M3. `lead-os-hosted-runtime-wt-hybrid` declares `"license": "MIT"` but the
package README states "kernel is private — all rights reserved." One of
these is wrong. Repo root README also says "There is no blanket MIT grant
at the repository root." Drift between `package.json` and prose docs.

### M4. README counts drift from filesystem reality

Spot-checked (run `npm run verify:product-surfaces` for the canonical
truth):

| Claim in `README.md` | Filesystem reality | Drift |
|----------------------|--------------------|-------|
| "234 library modules" under `src/lib/` | 206 `.ts`/`.tsx` files | -28 |
| "62 integration adapters" | 63 entries in `src/lib/integrations/` | +1 |
| "Operator Dashboard (31 pages)" | 31 `page.tsx` under `src/app/dashboard/` | matches |
| Hybrid kernel `36 App Router pages + 22 API entrypoints` (per `verify:product-surfaces`) | matches | matches |

These are doc-side; `verify:product-surfaces` is the contractual gate per
`docs/CLAIMS-VERIFICATION.md`.

## Low-severity findings

### L1. Nested `.github/workflows/` in vendored sources

The `_n8n_sources/*` trees vendor 15+ workflow files under nested
`.github/workflows/` directories (czlonkowski-n8n-mcp: 9, Zie619: 5,
growchief: 1). These are inert under GitHub Actions but show up in
repo scanners and any future "what runs on every PR" inventory. Per
`_n8n_sources/README.md`, these are reference material and not Lead OS.
No action recommended unless they start triggering false positives in
tooling.

### L2. Dependabot does not cover `lead-os-hosted-runtime-wt-public`

`.github/dependabot.yml` enumerates `lead-os-hosted-runtime-wt-hybrid`,
`erie-pro`, and `neatcircle-beta`. The public runtime is the same code
shape and benefits from the same weekly bump cadence.

### L3. No lint script in three of four first-party packages

Hybrid, erie-pro, and public-runtime have no `lint` script. Repo-wide
consistency would benefit from a minimal ESLint setup (Next preset is
fine). Not blocking.

## Vendored `_n8n_sources/` summary

Per `_n8n_sources/README.md`: these are upstream copies, not Lead OS code,
and their internal claims should not be treated as binding. I did not run
their test suites, but their build/test state is irrelevant to Lead OS CI
because nothing in the root workflow installs them. Their nested CI
workflows are inert (see L1). License notes: `growchief-growchief` is
AGPL-3.0, `czlonkowski-n8n-mcp` is MIT — neither is imported into
first-party builds, so no cross-licence contamination, but worth flagging
if anyone copies code out of `growchief-growchief`.

## Code-quality findings — Round 2

### Q1. Hybrid `as unknown as` cast inventory ✅ partial fix

Pre-fix grep over `lead-os-hosted-runtime-wt-hybrid/src/`: **49** `as unknown
as` / `as any` sites. Post-fix: **~40**, the remainder fall into categories
that are correct at boundaries:

- Persistence round-tripping (`payload: Record<string, unknown>` storage
  fields holding typed objects) — `src/lib/integrations/*-adapter.ts`,
  `src/lib/runtime-store.ts:345`.
- BullMQ queue/worker generics that don't expose the underlying type
  parameters — `src/lib/integrations/job-queue.ts`.
- Revenue pipeline `Stage<T>` results that intentionally erase to
  `Record<string, unknown>` for the orchestrator —
  `src/lib/revenue-pipeline.ts` (16 sites, all in one function).

I did **not** refactor those: they encode a design decision (typed-in-flight,
generic-at-rest) that would require a new pipeline contract to clean up.

### Q2. Three near-identical `deepMerge` implementations

The same recursive merge appears in:
- `lead-os-hosted-runtime-wt-hybrid/src/lib/niche-adapter.ts:135`
- `lead-os-hosted-runtime-wt-hybrid/src/lib/context-engine.ts:154`
- `lead-os-hosted-runtime-wt-hybrid/src/app/api/niche-generator/[slug]/route.ts:35`
  (this one is `DeepPartial<T>`-shaped)

All three were rewritten to `T extends object` to avoid the cast tax (see
Round 2 table). Consolidating into a shared `src/lib/object-helpers.ts` is
the obvious next step but would touch all callers; left as follow-up.

### Q3. `erie-pro/src/lib/env.ts:73` returns undefined in dev fallback

```typescript
if (!result.success) {
  ...
  if (process.env.NODE_ENV === "development") {
    _env = result.data as unknown as Env;   // result.data is undefined on failure
    return _env;
  }
  throw new Error("Invalid environment configuration");
}
```

Zod's `safeParse` returns `{ success: false, error: ZodError }` on failure —
there is no `.data` field. The cast hides this. Result: in dev with an
invalid env, `getEnv()` returns `undefined`, and the next property access
throws `TypeError: Cannot read properties of undefined`. The "graceful
partial dev setup" branch advertised by the comment does not work as written.

Left unchanged this round (would change runtime behavior and consumer
assumptions); flagged for a follow-up that either throws, or pulls a partial
shape out of `process.env` directly.

### Q4. Large files (>1500 lines) — not split this round

These were flagged for future modularisation but not touched (each holds a
self-contained domain catalog or template registry; splitting requires call-
site review which is out of scope for a code-quality pass):

- `lead-os-hosted-runtime-wt-hybrid/src/lib/dynasty-landing-engine.ts` (2143)
- `lead-os-hosted-runtime-wt-hybrid/src/lib/niche-templates.ts` (1905)
- `lead-os-hosted-runtime-wt-hybrid/src/lib/providers.ts` (1846)
- `lead-os-hosted-runtime-wt-hybrid/src/lib/tool-catalog.ts` (1812)
- `lead-os-hosted-runtime-wt-hybrid/src/mcp/tools.ts` (1622)
- `erie-pro/src/lib/niche-content.ts` (3406 — niche-specific copy table, expected to be large)
- `erie-pro/src/lib/convertbox-service-map.ts` (2054)
- `erie-pro/src/lib/sales-funnels.ts` (1413)

### Q5. False-positive findings from automated scan (not actual issues)

For the record, the read-only investigation flagged these that turned out
to be safe:

- `src/lib/widget-preview.ts:650` `JSON.parse(rawOrigins)` — already inside a
  `try { ... } catch` block.
- `src/app/dashboard/pipeline/page.tsx:103` `JSON.parse(leadJson)` — same.
- `erie-pro/src/lib/settings.ts:19` `JSON.parse(row.value) as T` — wrapped
  in `try/catch` with fallback.
- `src/components/RealtimeProvider.tsx:73-75` empty `catch {}` — comment
  documents intentional ignore of malformed EventSource messages.

## Recommended follow-up (not done in this branch)

Ordered by ratio of safety-improvement to effort:

1. **Add `lead-os-hosted-runtime-wt-public` to root CI** (3 jobs: typecheck,
   test, build) and to Dependabot. (~10 lines of YAML.)
2. **Add NeatCircle `test` job to root CI.** Currently only `build-edge`
   runs; with C2 fixed, the suite is meaningful again.
3. **Decide on `lead-os-hosted-runtime-wt-hybrid/.github/workflows/ci.yml`:**
   delete it (dead code) or fold its unique step (`verify:migrations`) into
   the root workflow.
4. **Bump Next.js** in hybrid (≥16.2.6), erie-pro (≥15.5.16), and public
   runtime (≥15.5.16) to clear the H4 advisories. Dependabot will likely
   propose these on the next run.
5. **Tighten the `npm audit` gate** from `critical` to `high` once the Next
   bumps land.
6. **Fix or remove NeatCircle `lint` script** (H3).
7. **Reconcile `license` in `lead-os-hosted-runtime-wt-hybrid/package.json`**
   with the README's "private — all rights reserved" claim (M3).
8. **Refresh README counts** ("234 library modules" → actual, "62
   integration adapters" → 63) or replace with "run `npm run
   verify:product-surfaces`" pointers (M4).

## How to reproduce this audit

```bash
# From repo root, per package:
cd lead-os-hosted-runtime-wt-hybrid && npm ci && npx tsc --noEmit && \
  npm run test:ci && npm run build && npm audit --json
cd ../erie-pro && npm ci && npx tsc --noEmit && npm test && \
  npm run build && npm audit --json
cd ../neatcircle-beta && npm ci && npx tsc --noEmit && npm test && \
  npm run build && npm audit --json
cd ../lead-os-hosted-runtime-wt-public && npm ci && npx tsc --noEmit && \
  npm test && npm run build && npm audit --json
```
