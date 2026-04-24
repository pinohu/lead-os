---
name: completeness-testing
description: Smoke-check production or staging URLs the user actually controls — generate URL lists from each package’s routes/sitemaps; do not use obsolete fixed totals (e.g. 697 URLs)
---

# Completeness Testing

**Tier:** STANDARD (Tier 1 — Operational)  
**Category:** Endpoint verification  
**Domain:** HTTP smoke tests, optional multi-loop stress

## Overview

Historically this skill referenced a frozen “697 URL” matrix and kernel paths like `/admin` that **do not match** the current hybrid App Router. That inventory is **deprecated**.

Correct approach:

1. **Kernel** — derive candidates from `lead-os-hosted-runtime-wt-hybrid/docs/PRODUCT-SURFACES.md`, live `/sitemap.xml`, and `npm run enumerate:api-routes` output for the same commit you deployed.
2. **Erie Pro** — derive from `erie-pro`’s `generateStaticParams`, `next-sitemap` output, or `npm run build` logs for that package only.
3. **NeatCircle** — small static surface; confirm homepage + any linked assets.

Always parameterize base URLs (`KERNEL_BASE`, `ERIE_BASE`, `NEATCIRCLE_BASE`). Never assume third-party demo hosts are still authoritative.

## Workflow

1. Confirm commit SHA + environment.
2. Build URL list programmatically from **current** code (or fetch `sitemap.xml` per site).
3. `curl` with sane timeouts; classify 2xx vs unexpected 4xx/5xx; treat auth redirects as their own class.
4. Optional: repeat N times to catch cold starts / flakiness — record any URL that is not stable across loops.

## Output

Markdown table: URL, final status, latency bucket, notes. Flag “doc drift” when production disagrees with `PRODUCT-SURFACES.md` and open a doc PR.
