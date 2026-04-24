---
name: multi-tenant-testing
description: Run kernel, erie-pro, and neatcircle-beta test scripts; emphasize hybrid node:test suite and multi-tenant-stress isolation — never hard-code historical test totals
---

# Multi-Tenant Testing

**Tier:** METHODOLOGY (Tier 2 — Patterns & Standards)  
**Category:** Testing Strategy  
**Domain:** Tenant isolation, Node.js `node:test` (kernel), Vitest (erie-pro), package-local runners

## Overview

Lead OS ships as a **monorepo** with **different test runners per package**:

| Package | Folder | Test command | Runner |
|---------|--------|----------------|--------|
| Kernel | `lead-os-hosted-runtime-wt-hybrid/` | `npm test` | Node.js `node:test` on `tests/**/*.test.ts` |
| Erie Pro | `erie-pro/` | `npm test` | Vitest (`vitest run`) |
| NeatCircle | `neatcircle-beta/` | `npm test` | Node.js `node:test` on that package’s `tests/` |

**Never** cite a fixed “4151 tests” or “70 suites” total — those figures were stale fiction. Always print the runner summary from **your** checkout.

Isolation-critical kernel coverage includes `tests/multi-tenant-stress.test.ts` (10 subtests). Read that file for the authoritative list of behaviors under test.

## Core Capabilities

- Run **`npm test`** inside each package that ships tests and capture pass/fail/skip.
- Extend kernel tests with `node:test` + `node:assert` — **do not** add Jest to the hybrid kernel.
- After auth / middleware / intake changes, re-run hybrid tests and any Erie Vitest suites that touch tenant or session assumptions.

## When to Use

- “run tests”, “regression check”, “tenant isolation”
- Changes to `src/middleware.ts`, operator auth, intake, tenant store, or rate limiting
- Before merge when the user expects a full gate (often paired with audit-fix-optimize)

## Methodology

### Kernel (primary)

```bash
cd lead-os-hosted-runtime-wt-hybrid
npm test
```

### Erie Pro

```bash
cd erie-pro
npm test
```

### NeatCircle beta

```bash
cd neatcircle-beta
npm test
```

### Regression heuristics

- Sudden **large drop** in reported tests usually means files were skipped, renamed, or the glob no longer matches — inspect `git diff` and the package’s `package.json` `test` script.
- Search for `.skip` / `test.skip` / `describe.skip` in the failing package only.

## Output format (example)

Report whatever the runners print — do not fabricate a unified table unless you actually ran all three commands on the same commit.

```
## Test report (branch=…, sha=…)

### lead-os-hosted-runtime-wt-hybrid
<paste npm test summary>

### erie-pro
<paste vitest summary>

### neatcircle-beta
<paste node:test summary>
```
