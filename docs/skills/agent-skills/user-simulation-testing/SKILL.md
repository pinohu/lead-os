---
name: user-simulation-testing
description: Spawn 3 parallel test agents simulating consumer homeowners, service providers, and content auditors navigating erie.pro to identify trust gaps, dead ends, placeholder content, and conversion blockers with 1-10 scoring per page
---

# User Simulation Testing

**Tier:** METHODOLOGY (Tier 2)
**Category:** Quality Assurance & UX Validation
**Domain:** User journey simulation, trust auditing, conversion analysis

## When to Use

Trigger this skill when:
- A new niche or set of pages has been added to erie-pro
- Before a production deployment to validate user experience
- After major design or content changes
- The user says "test as user", "simulate homeowner", "run user tests"
- Checking for placeholder content or broken conversion paths

## 3 Agent Personas

Each agent runs independently and scores every page visited on a 1-10 scale.

### Agent 1: Consumer Homeowner
**Profile:** Erie PA homeowner, age 35-55, searching for a local service provider. Not tech-savvy. Impatient -- will leave if trust signals are missing.

**Journey flow:**
1. Land on homepage or niche page via search
2. Read hero section -- is the value proposition clear within 5 seconds?
3. Scan provider listings -- are there real names, photos, reviews?
4. Check pricing -- is it transparent or hidden behind a form?
5. Look for trust signals -- license numbers, insurance, years in business
6. Attempt to contact a provider -- does the CTA work?
7. Check FAQ -- are questions relevant to Erie homeowners?

**Scoring criteria:**
- 9-10: Clear value prop, real providers, working CTA, Erie-specific trust signals
- 6-8: Mostly complete but missing 1-2 trust elements
- 3-5: Generic content, placeholder providers, unclear pricing
- 1-2: Broken pages, dead-end CTAs, no local relevance

### Agent 2: Service Provider
**Profile:** Local Erie business owner evaluating whether to pay $300-$1500/mo. Skeptical of marketing claims. Wants ROI clarity.

**Journey flow:**
1. Land on provider signup or "For Providers" page
2. Evaluate territory claim process -- is my area available?
3. Review pricing tiers -- what do I get at each level?
4. Check competitor presence -- who else is listed in my niche?
5. Look for lead volume estimates or case studies
6. Attempt to start the signup/claim flow
7. Evaluate the dashboard preview or provider portal

**Scoring criteria:**
- 9-10: Clear ROI story, transparent pricing, working claim flow, dashboard preview
- 6-8: Good pricing info but missing lead volume data or case studies
- 3-5: Vague benefits, no territory map, signup flow incomplete
- 1-2: No provider-facing content, broken forms, pricing contradictions

### Agent 3: Content Auditor
**Profile:** Quality reviewer checking for content completeness, consistency, and professionalism across all pages in a niche.

**Journey flow:**
1. Visit every page type for the niche (main, providers, glossary, seasonal)
2. Check for placeholder text ("Lorem ipsum", "Coming soon", "[TODO]")
3. Verify all images load and are relevant (not stock photos with watermarks)
4. Confirm internal links resolve (no 404s within the niche)
5. Validate meta descriptions exist and are unique
6. Check phone numbers and email addresses are real/functional
7. Verify Schema.org markup renders in structured data test

**Scoring criteria:**
- 9-10: All content complete, no placeholders, all links work, Schema valid
- 6-8: Minor gaps (1-2 missing FAQs, one generic paragraph)
- 3-5: Multiple placeholder blocks, broken links, duplicate meta descriptions
- 1-2: Page is mostly placeholder, critical content missing entirely

## Common Issues Pattern

Agents should flag these recurring problems specifically:
- **Boilerplate text**: Same paragraph appearing across 3+ niches unchanged
- **Fake reviews**: Review quotes with no attribution or generic names ("John D.")
- **Missing phone numbers**: CTA says "Call Now" but no number is displayed
- **Pricing mismatch**: Landing page shows different price than checkout/claim flow
- **Dead-end CTAs**: Buttons that link to `#` or unfinished pages
- **Stock photo overuse**: Same generic image across multiple niche pages
- **Erie relevance gap**: Content could apply to any city with no local anchoring

## Execution Workflow

1. Identify the target niche or page set to test
2. Spawn all 3 agents in parallel (they are independent)
3. Each agent navigates its journey, scoring each page visited
4. Agents compile a per-page score card with specific findings
5. Merge all 3 reports into a unified findings table
6. Prioritize issues by severity: blockers > trust gaps > polish items

## Output Format

```
## User Simulation Report: [Niche Name]

### Summary Scores
| Agent           | Avg Score | Pages Visited | Blockers Found |
|-----------------|-----------|---------------|----------------|
| Homeowner       | X.X/10    | N             | N              |
| Provider        | X.X/10    | N             | N              |
| Content Auditor | X.X/10    | N             | N              |

### Blockers (Must Fix Before Deploy)
1. [Page URL] -- [Issue description] -- [Agent that found it]

### Trust Gaps (Fix Within 1 Sprint)
1. [Page URL] -- [Issue description] -- [Agent that found it]

### Polish Items (Nice to Have)
1. [Page URL] -- [Issue description] -- [Agent that found it]

### Per-Page Scorecard
| Page URL | Homeowner | Provider | Auditor | Worst Issue |
|----------|-----------|----------|---------|-------------|
| /path    | X/10      | X/10     | X/10    | description |
```

## Edge Cases

- **Empty niche**: If a niche has fewer than 2 providers, Agent 1 should score listings 3/10 max and flag for content seeding
- **Gated content**: If a page requires login, Agent 2 (provider) should test the gated path while Agent 1 tests the public path
- **Build-time pages**: Pages generated by `generateStaticParams` may 404 in dev if the dev server was not restarted after adding niche data. Restart before testing.
