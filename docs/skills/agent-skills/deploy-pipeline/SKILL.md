---
name: deploy-pipeline
description: Deploy LeadOS applications to Vercel production -- kernel from repo root (rootDirectory set via API), erie-pro from subdirectory, with pre-deploy build verification and post-deploy endpoint testing
---

# Deploy Pipeline

**Tier:** STANDARD (Tier 1 -- Operational)
**Category:** Deployment & Infrastructure
**Domain:** Vercel deployment, root directory configuration, post-deploy verification

## Overview

This skill handles the full deployment lifecycle for LeadOS applications on Vercel. The critical nuance is that kernel deploys from the monorepo root while erie-pro deploys from its subdirectory, and Vercel's rootDirectory setting must be correct or builds will fail with double-path errors. This skill knows the project IDs, the API patterns to fix misconfigurations, and the post-deploy checks to confirm success.

## Core Capabilities

- Deploy erie-pro and kernel to Vercel production
- Fix the rootDirectory setting via Vercel API when auto-deploy misconfigures it
- Run pre-deploy build verification (invokes audit-fix-optimize)
- Perform post-deploy endpoint testing to confirm the deployment is live and correct
- Detect and resolve stale deployments that serve outdated content
- Handle the outputDirectory/rootDirectory interaction that causes API route 404s

## When to Use

Trigger this skill when:
- "deploy", "push to production", "ship it"
- "site is down", "deployment failed", "Vercel error"
- "API routes returning 404", "pages not updating"
- "rootDirectory error", "double path error"
- After audit-fix-optimize passes all checks

## Vercel Project Configuration

| Property | erie-pro | kernel |
|----------|----------|--------|
| Project Name | erie-pro | lead-os-runtime |
| Root Directory | erie-pro/ | ./ (repo root) |
| Framework | Next.js | Next.js |
| Build Command | next build | next build |
| Output Directory | .next | .next |
| Node Version | 18.x | 18.x |

**Team ID:** Stored in `.vercel/project.json` at repo root and in `erie-pro/.vercel/project.json`.
**Auth Token:** Use the Vercel MCP tools or `vercel` CLI with stored credentials.

## Workflow

### Step 1: Pre-Deploy Verification
Before any deployment, confirm builds pass locally:
```bash
cd erie-pro && npm run build
cd ../lead-os-runtime && npm run build
```
If either build fails, STOP. Do not deploy broken code. Invoke the audit-fix-optimize skill to resolve.

### Step 2: Check Root Directory Configuration
Use the Vercel API to verify rootDirectory is set correctly:
```
GET /v9/projects/{projectId}
```
- For erie-pro: rootDirectory MUST be `erie-pro`
- For kernel: rootDirectory MUST be `null` or empty (repo root)

If incorrect, fix with:
```
PATCH /v9/projects/{projectId}
Body: { "rootDirectory": "erie-pro" }  // or null for kernel
```

### Step 3: Deploy
Trigger deployment via Vercel MCP tools or CLI:
- erie-pro: `vercel --prod` from the erie-pro directory
- kernel: `vercel --prod` from the repo root

For git-triggered deploys, push to master and let Vercel auto-deploy. Monitor the build logs for errors.

### Step 4: Post-Deploy Endpoint Testing
Wait for deployment to complete, then verify:

**erie-pro endpoints:**
- `GET /` -- expect 200, check for hero section content
- `GET /sitemap.xml` -- expect 200, valid XML
- `GET /api/health` -- expect 200, JSON response
- `GET /[city]/[niche]` -- spot-check 2-3 city/niche combos

**kernel endpoints:**
- `GET /` -- expect 200
- `GET /api/health` -- expect 200

### Step 5: Validate No Regressions
Compare the new deployment against known-good baselines:
- Page count should match or exceed previous deployment
- No new 404s on previously-working routes
- API response shapes unchanged

### Step 6: Rollback if Needed
If post-deploy checks fail:
1. Identify the last successful deployment via Vercel dashboard or API
2. Promote the previous deployment to production
3. Report the failure with full error context

## Edge Cases

- **Double-path error** -- Build fails with paths like `erie-pro/erie-pro/src/...`. This means rootDirectory is set to `erie-pro` but Vercel is ALSO auto-detecting the subdirectory. Fix by ensuring rootDirectory is set exactly once via the API.
- **Stale auto-deploy** -- Vercel sometimes caches old deployments. Force a fresh deploy with `vercel --prod --force` or trigger a redeploy from the dashboard.
- **API route 404s** -- If pages work but `/api/*` routes 404, the outputDirectory is misconfigured. Ensure it is `.next` (or unset to use the default) and that rootDirectory is correct.
- **Environment variables** -- If the deploy succeeds but the app errors at runtime, check that all required env vars are set in the Vercel project settings for the Production environment.
- **Branch protection** -- Vercel only auto-deploys from the branch configured in project settings. If deploying from a feature branch, use `vercel --prod` explicitly.
- **Build timeout** -- Vercel free tier has a 45-minute build limit. If erie-pro's 630 pages cause a timeout, enable ISR for low-traffic pages.

## Output Format

```
## Deployment Report

| Project | Status | URL | Duration |
|---------|--------|-----|----------|
| erie-pro | DEPLOYED/FAILED | https://... | Xm Xs |
| kernel | DEPLOYED/FAILED | https://... | Xm Xs |

### Root Directory Check
- erie-pro: [correct/fixed from X to Y]
- kernel: [correct/fixed from X to Y]

### Post-Deploy Verification
| Endpoint | Status | Response |
|----------|--------|----------|
| erie-pro / | 200 | OK |
| erie-pro /api/health | 200 | OK |
| kernel / | 200 | OK |
| kernel /api/health | 200 | OK |

### Issues
- [any problems encountered and how they were resolved]

### Rollback
- [not needed / rolled back to deployment X because Y]
```
