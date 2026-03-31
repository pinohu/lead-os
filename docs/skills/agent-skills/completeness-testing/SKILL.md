---
name: completeness-testing
description: Execute a full 697-URL completeness test across 3 production sites -- 660 erie-pro niche pages (44 niches x 15 types), 12 static pages, 3 API endpoints, 19 kernel pages, 2 kernel APIs, and 1 neatcircle page -- with 10-loop stress test option
---

# Completeness Testing

**Tier:** STANDARD (Tier 1 -- Operational)
**Category:** Endpoint Verification
**Domain:** URL completeness, production health, stress testing, static page coverage

## Overview

This skill verifies that every page and API endpoint across all three LeadOS production sites is reachable and returns the correct status code. The 697-URL inventory is the source of truth for what must exist in production. The optional 10-loop stress test repeats the full sweep to catch intermittent failures, cold-start latency, and edge caching issues.

## Core Capabilities

- Test all 697 URLs across erie-pro, kernel, and neatcircle production sites
- Verify the 44x15 niche page matrix (660 pages) returns 200 for every combination
- Check 12 erie-pro static pages, 3 erie-pro API endpoints
- Check 19 kernel pages, 2 kernel API endpoints
- Check 1 neatcircle page
- Run the 10-loop stress test for reliability verification
- Detect new 404s, 500s, redirect loops, and timeout failures

## When to Use

Trigger this skill when:
- "completeness test", "check all pages", "are all URLs live?"
- After a deployment to verify nothing regressed
- "stress test", "run it 10 times", "reliability check"
- After adding or removing niches or page types from erie-pro
- Before a client demo or investor presentation
- Weekly scheduled health check

## URL Inventory (697 Total)

### erie-pro (675 URLs)
- **660 niche pages:** 44 niches x 15 types, pattern `/{niche}/{type}`
- **12 static pages:** `/`, `/about`, `/contact`, `/pricing`, `/blog`, `/privacy`, `/terms`, `/sitemap.xml`, `/robots.txt`, `/login`, `/dashboard`, `/admin`
- **3 API endpoints:** `/api/health`, `/api/intake`, `/api/sitemap`

### kernel (21 URLs)
- **19 pages:** `/`, `/admin`, `/settings`, `/tenants`, `/analytics`, `/users`, plus 13 more
- **2 API endpoints:** `/api/health`, `/api/tenant-config`

### neatcircle (1 URL): `/`

## Workflow

### Step 1: Build URL List
Generate the full 697-URL list programmatically. For niche pages, iterate the niches array and types array from the shared config. Prepend the production base URL for each site.

### Step 2: Sequential Sweep
Fetch each URL with a timeout of 10 seconds. Record:
- HTTP status code
- Response time in milliseconds
- Content-Length header (to detect empty responses)
- Any redirect chain (final URL if redirected)

### Step 3: Classify Results
- **PASS** -- 200 status, non-empty body, response under 5 seconds
- **SLOW** -- 200 status but response over 5 seconds
- **FAIL** -- 4xx, 5xx, timeout, or empty body
- **REDIRECT** -- 3xx (note: expected for some routes, unexpected for others)

### Step 4: Stress Test (Optional, 10 Loops)
When requested, repeat the full 697-URL sweep 10 times with a 2-second delay between loops. Track:
- Consistency: does the same URL pass all 10 times?
- Cold start: is the first loop slower than subsequent ones?
- Flaky URLs: any URL that fails in some loops but passes in others

### Step 5: Report
Produce the structured report with pass/fail counts, slowest URLs, and any failures.

## Edge Cases

- **Rate limiting** -- Production may rate-limit rapid sequential requests. Add a 100ms delay between requests. If 429 responses appear, increase to 500ms.
- **Auth-protected pages** -- `/admin`, `/dashboard`, `/settings` may return 302 to login. Count 302 as PASS for auth-protected routes.
- **Cold start latency** -- Serverless functions may take 2-5 seconds on first hit. The stress test's first loop catches this.
- **Sitemap.xml validation** -- Beyond 200 status, verify the XML is well-formed and contains the expected number of URL entries.
- **API endpoint response shape** -- `/api/health` should return `{"status": "ok"}`. Verify the JSON shape, not just the status code.
- **New niches or types** -- If niches or types are added to the config but not yet deployed, the test will fail for those URLs. Check config vs. deployment parity.
- **Regional DNS** -- If testing from a different region than the CDN edge, response times may be misleadingly slow.

## Output Format

```
## Completeness Test Report

**URLs tested:** 697
**Pass:** 695 | **Slow:** 1 | **Fail:** 1 | **Redirect:** 0

### Summary by Site
| Site | Total | Pass | Slow | Fail |
|------|-------|------|------|------|
| erie-pro | 675 | 674 | 1 | 0 |
| kernel | 21 | 20 | 0 | 1 |
| neatcircle | 1 | 1 | 0 | 0 |

### Failures
| URL | Status | Response Time | Error |
|-----|--------|---------------|-------|
| /api/tenant-config | 500 | 234ms | Internal Server Error |

### Slowest URLs (top 5)
| URL | Response Time |
|-----|---------------|
| /plumber/gallery | 4,821ms |

### Stress Test (if run)
| Loop | Pass | Fail | Flaky |
|------|------|------|-------|
| 1 | 695 | 2 | -- |
| 2 | 697 | 0 | -- |
| ... | ... | ... | ... |
| Flaky URLs: /plumber/gallery (failed in loop 1 only)
```
