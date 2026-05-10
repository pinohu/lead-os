# Top Repo Priorities

Date: 2026-05-09

This memo narrows the repo focus so ConvertBox, LeadOS, and build work point at one revenue path first instead of spreading effort across every possible asset.

## Priority Stack

### 1. PA CROP Services / Private Utility Locators

Repo inspected: `authoritysite-private-utility-locators`

This should be the top execution priority because it is the clearest near-term lead-generation asset. The repo is already configured around "Private Utility Locators Hub" with quote intent, directory intent, GPR scanning, utility locating, subsurface mapping, and "utility locating near me" keywords. That makes it a good fit for high-intent local/service buyer traffic.

Immediate priority:
- Clean up the niche configuration so the site stops leaking generic SEO/content-marketing copy.
- Make the primary conversion path "Request Quotes" or "Get a Site Scan Quote," not newsletter/content browsing.
- Build ConvertBox around quote capture, job urgency, location, service type, and project timeline.
- Route all captures into LeadOS `/api/intake` with `source`, `service`, `category`, `message`, `phone`, and metadata.

Best ConvertBox first box:
- Name: `PA Utility Locate - Quote Capture`
- Trigger: exit intent, 45+ seconds on page, directory/service pages, return visitor
- Fields: name, email, phone, project zip/city, needed service, timeline
- Tags/metadata: `source=convertbox`, `category=utility-locating`, `preferredFamily=qualification`, `wantsBooking=true`

### 2. LeadOS

Repo inspected: `lead-os`

LeadOS should not be treated as a broad public SaaS launch first. Its highest-value role right now is the lead capture, scoring, routing, and operator backend for the PA services play.

The repo already supports this direction:
- `POST /api/intake` for lead capture.
- Directory routing and buyer handoff through the Erie flow.
- GTM docs explicitly rank directory/exclusive niche plays before platform resale.
- Platform resale is explicitly marked "Defer" until there are 3-5 wins.

Immediate priority:
- Create a PA/private-utility-locator tenant pattern based on the Erie directory model.
- Smoke-test intake from ConvertBox webhook or form action.
- Define lead scoring rules for urgent excavation, same-week project, phone provided, and commercial job.
- Keep platform messaging private until at least one vertical has real proof.

### 3. Dynasty Launcher / Dynasty AI Dashboard

Repos inspected: `dynasty-ai-dashboard`, `DYNASTY`

The dashboard should be treated as the internal operating console, not a public product priority. It is useful because it can monitor agents, costs, service status, and knowledge base activity, but its own audit says backend integrations are still pending or partly mocked.

Immediate priority:
- Wire only the minimum dashboard signals that help execute the PA/LeadOS funnel: lead volume, response status, agent activity, and cost.
- Avoid expanding dashboard features until the first funnel is producing or routing real leads.
- Use DYNASTY docs as strategic reference only; avoid turning its broad archive into weekly execution scope.

### 4. Authority Site Generator

Repo inspected: `authoritysite`

This is reusable infrastructure, but not a separate business priority right now. It matters only insofar as it accelerates the PA CROP/private utility locator site and later clones for proven verticals.

Immediate priority:
- Harvest reusable template improvements from the generic authority site repo.
- Do not launch new niches until the first service funnel has live lead flow and follow-up.

## What Not To Prioritize Yet

- LeadOS as a generalized SaaS.
- White-label agency offers.
- Multiple directory niches at once.
- Deep Dynasty documentation expansion.
- ConvertBox campaigns for every repo/site.
- Newsletter-first funnels for urgent service buyers.

## ConvertBox Focus

For the next configuration pass, create only three ConvertBox assets:

1. `Utility Locate Quote Capture`
   - Primary service-buyer funnel.
   - Goal: phone-qualified quote requests.

2. `Utility Locate Project Checklist`
   - Lead magnet for earlier-stage visitors.
   - Goal: email plus service context.

3. `Hot Lead Booking Rescue`
   - Shown after quote-page abandonment or repeat visits.
   - Goal: book a call or request urgent callback.

Everything should map into LeadOS with consistent metadata so Dynasty Dashboard can report on the same funnel instead of becoming another silo.

## One-Sentence Strategy

Use PA CROP/private utility locator demand as the cash engine, LeadOS as the routing engine, and Dynasty Dashboard as the control room.
