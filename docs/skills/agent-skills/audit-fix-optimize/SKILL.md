---
name: audit-fix-optimize
description: Build erie-pro, lead-os-hosted-runtime-wt-hybrid, and neatcircle-beta; run each package’s test script; smoke-check configured deployment URLs — standard QA cycle without hard-coded page or test counts
---

# Audit-Fix-Optimize

**Tier:** STANDARD (Tier 1 — Operational)  
**Category:** Quality Assurance  
**Domain:** Build verification, test execution, endpoint health

## Overview

Default “check everything” flow for this monorepo. **Folder names matter:** the edge app lives in **`neatcircle-beta/`**, not `neatcircle/`.

## Workflow

### Step 1 — Builds

```bash
cd erie-pro && npm run build
cd ../lead-os-hosted-runtime-wt-hybrid && npm run build
cd ../neatcircle-beta && npm run build
```

Record exit code per package. Continue collecting failures even if an earlier package fails.

### Step 2 — Tests

```bash
cd erie-pro && npm test
cd ../lead-os-hosted-runtime-wt-hybrid && npm test
cd ../neatcircle-beta && npm test
```

Record each runner’s summary. **Do not** compare to historical totals from README files.

### Step 3 — Smoke endpoints (optional)

Only if the user gave production/staging URLs (never assume `lead-os-nine.vercel.app` is still the right host):

```text
curl -fsS "$KERNEL_URL/api/health"
curl -fsS "$ERIE_URL/" -o /dev/null
curl -fsS "$NEATCIRCLE_URL/" -o /dev/null
```

### Step 4 — Git

`git status` / `git diff --stat` — stage fixes with conventional commits.

### Step 5 — Fixes

- Build/type errors: fix source, re-run the failed command until green.
- Test failures: distinguish product regression vs outdated expectation.
- Endpoint failures: may be infra — confirm deployment revision before editing code.

## Edge cases

- **Windows paths** — prefer repo-relative `cd` from monorepo root.
- **OOM builds** — `NODE_OPTIONS=--max-old-space-size=4096` for `next build`.
- **Hybrid worker** — queue-heavy features need Redis + `npm run worker`; web-only smoke tests will not catch worker-only bugs.

## Output format

Summarize builds (pass/fail), tests (command + pass/fail counts from stdout), and any endpoint smoke results with timestamps and URLs actually probed.
