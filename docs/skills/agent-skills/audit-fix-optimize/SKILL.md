---
name: audit-fix-optimize
description: Build all 3 LeadOS codebases (erie-pro 630pg, kernel 539pg, neatcircle 152pg), run 4151-test suite, verify live endpoints, fix any failures, commit, and deploy -- the standard quality assurance cycle
---

# Audit-Fix-Optimize

**Tier:** STANDARD (Tier 1 -- Operational)
**Category:** Quality Assurance
**Domain:** Build verification, test execution, endpoint health, automated repair

## Overview

This is the standard QA cycle for the LeadOS platform. It builds all three codebases, runs the full test suite, verifies live endpoints respond correctly, fixes any failures it can resolve autonomously, and prepares clean commits. This skill should be the default when the user says "check everything" or when the orchestrator needs a pre-deploy gate.

## Core Capabilities

- Build erie-pro (630 pages), kernel (539 pages), and neatcircle (152 pages) with `next build`
- Run the 4151-test suite across all codebases
- Verify live endpoints return expected status codes and content
- Auto-fix common build failures (missing imports, type errors, unused variables)
- Generate git-ready commits for all fixes
- Produce a structured pass/fail report

## When to Use

Trigger this skill when:
- "run audit", "check builds", "test everything", "QA cycle"
- "are there any errors?", "is everything passing?"
- "pre-deploy check", "sanity check"
- Before any deployment (orchestrator should invoke this automatically)
- After a large refactor or feature merge

## Workflow

### Step 1: Build All Codebases
```bash
cd erie-pro && npm run build
cd ../lead-os-hosted-runtime-wt-hybrid && npm run build
cd ../neatcircle && npm run build
```
Record exit codes. If a build fails, capture the full error output before proceeding.

### Step 2: Run Test Suite
```bash
cd erie-pro && npm test
cd ../lead-os-hosted-runtime-wt-hybrid && npm test
cd ../neatcircle && npm test
```
Expect ~4151 tests total. Record pass/fail/skip counts per codebase.

### Step 3: Health Check Live Endpoints
Verify these endpoints return 200:
- erie-pro production URL (check `/`, `/api/health`, `/sitemap.xml`)
- kernel production URL (check `/`, `/api/health`)
- neatcircle production URL (check `/`)

### Step 4: Git Status
Run `git status` and `git diff --stat` to inventory uncommitted changes. Flag any untracked files that look like they should be committed.

### Step 5: Fix Failures
For each failure found in steps 1-3:
- **Build error** -- Read the error, locate the file, apply the fix, rebuild to confirm.
- **Test failure** -- Read the assertion, check if it is a code bug or a stale test expectation, fix accordingly.
- **Endpoint failure** -- Check deployment status, redeploy if stale, escalate if infrastructure issue.

### Step 6: Commit and Report
Stage fixes with descriptive commit messages. Do NOT push or deploy -- that is the deploy-pipeline skill's job.

## Edge Cases

- **Build failure cascade** -- If erie-pro fails to build, still attempt kernel and neatcircle. Report all failures, not just the first.
- **Flaky tests** -- If a test fails once but passes on retry, mark it as FLAKY in the report and note the test name.
- **Type errors from dependencies** -- Check if `next-env.d.ts` or `tsconfig.json` needs regeneration before attempting code fixes.
- **Out-of-memory build** -- If `next build` OOMs, suggest increasing Node memory with `NODE_OPTIONS=--max-old-space-size=4096`.
- **Lock file drift** -- If `package-lock.json` is out of sync, run `npm install` before building.
- **Stale deployment** -- If endpoints return old content, flag for redeployment rather than treating as a code issue.

## Output Format

```
## Audit-Fix-Optimize Report

| Step | Codebase | Status | Details |
|------|----------|--------|---------|
| Build | erie-pro | PASS/FAIL | [error summary if failed] |
| Build | kernel | PASS/FAIL | [error summary if failed] |
| Build | neatcircle | PASS/FAIL | [error summary if failed] |
| Tests | erie-pro | 2100/2100 | [failure details if any] |
| Tests | kernel | 1500/1500 | [failure details if any] |
| Tests | neatcircle | 551/551 | [failure details if any] |
| Health | erie-pro | PASS/FAIL | [status codes] |
| Health | kernel | PASS/FAIL | [status codes] |
| Health | neatcircle | PASS/FAIL | [status codes] |

### Fixes Applied
- [file: description of fix]

### Commits Created
- [hash: message]

### Follow-up Required
- [items that could not be auto-fixed]
```
