# Directory expansion plan

This document is the operating plan for expanding the Erie.pro directory pattern into national, regional, state, and major-city directory surfaces without creating redundant page files.

## Core decision

Use one reusable route template:

`/directory/[vertical]`

That route now resolves two kinds of pages:

1. Existing vertical pages from `nicheCatalog`, such as `/directory/home-services`.
2. Directory coverage pages from `src/lib/directory-coverage.ts`, such as `/directory/city-erie-pa`, `/directory/state-pa`, `/directory/region-great-lakes`, and `/directory/national-home-services`.

Do not create separate page files for every city, state, region, or national niche. Add entries to `src/lib/directory-coverage.ts` instead.

## Page families

| Family | Example | Purpose |
|---|---|---|
| National network | `/directory/national` | Top-level directory network across all niches and markets. |
| National niche | `/directory/national-home-services` | Category-level national page for sponsorship, search, and territory discovery. |
| Regional all-niche hub | `/directory/region-great-lakes` | Groups many cities and states together before every city earns standalone proof. |
| State access | `/directory/state-pa` | Statewide page for all niches, with links to major city routes. |
| Major city access | `/directory/city-erie-pa` | Local demand capture and buyer-routing promise for a city market. |

## Why this structure is efficient

- One frontend template avoids dozens or hundreds of nearly identical routes.
- National niche pages create category authority without forcing every city/niche combination to exist on day one.
- Regional pages group all niches together, which is useful before search traffic or buyer demand justifies city-by-niche long tails.
- State pages provide a middle layer for buyers who want statewide access.
- City pages become the local conversion surface when a market is seeded, sold, or actively tested.

## Erie.pro audit result

Erie is the first complete city directory entry.

Verified surfaces:

- Tenant seed: `erie`
- Buyer nodes: `plumber_erie_test_1`, `hvac_erie_test_1`
- Seeded categories: `plumbing`, `hvac`
- Public city page: `/directory/city-erie-pa`
- Router page: `/directory/lead-router`
- Runbook: `/docs/erie-pro`
- Source reference: `/docs/source/src/lib/erie/directory-lead-flow.ts`
- Route audit table: `lead_os_directory_routes`
- Delivery handoff: `sendLead()` via the lead delivery hub

Operational inputs still needed before live paid traffic:

- Real buyer destinations for each sold category.
- Verified proof after actual traffic and lead routing.
- Paused/inactive buyer slots for unsold categories.

## Expansion rules

1. Start with a national niche page when the category can be sold nationally.
2. Add a regional hub when several cities share search demand, buyer pools, or operational ownership.
3. Add a state page when statewide sponsorship or regulatory/geographic identity matters.
4. Add a city page when there is buyer demand, local SEO value, or an owned territory sale.
5. Add city-by-niche pages only after proof exists. Until then, city pages should group all niches together.
6. Never publish testimonials, lead counts, or revenue claims without verified evidence.

## Implementation source of truth

- Coverage catalog: `src/lib/directory-coverage.ts`
- Directory index: `src/app/directory/page.tsx`
- Directory page template: `src/app/directory/[vertical]/page.tsx`
- Erie lead flow: `src/lib/erie/directory-lead-flow.ts`
- Erie tests: `tests/erie-directory-flow.test.ts`
- Coverage tests: `tests/directory-coverage.test.ts`

## Current coverage model

The initial coverage catalog includes:

- National network page
- National niche pages for all non-general `nicheCatalog` entries
- Regional all-niche hubs for Northeast, Great Lakes, Southeast, Florida, Texas, West Coast, Mountain West, and Plains/Midwest
- State access pages for all U.S. states plus DC
- Major city pages for priority metro and regional markets, with Erie, PA marked as the seeded anchor

## How to add the next market

1. Add the city to `directoryMarkets`.
2. Assign it to one `directoryRegions` entry.
3. Confirm the matching state exists in `directoryStates`.
4. If the city is sold, add or migrate a tenant and buyer nodes.
5. Add real buyer destinations.
6. Smoke `/directory/city-{city}-{state}` and `/api/intake`.
7. Add proof only after real results are verified.

## How to add the next category

1. Add or update the category in `nicheCatalog` if it is a broad reusable vertical.
2. Add pricing and buyer examples to `directoryCategories` if it is a routeable lead category.
3. Add buyer nodes per sold city or tenant.
4. Use `/directory/national-{niche}` for category authority.
5. Use regional, state, and city pages for local access.
