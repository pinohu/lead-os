# Standalone Offerings Audit

Date: May 1, 2026

This audit lists every offer surface in this codebase that can reasonably be sold, packaged, provisioned, routed, or presented as a standalone customer outcome.

## Scope

An item is counted as a standalone offering when it meets at least one of these conditions:

- It appears in the provisionable package catalog.
- It has a public package, offer, industry, deliverable, funnel, directory, or documentation route.
- It is represented as a commercial plan, GTM play, funnel blueprint, or live deliverable module that can be bought or bundled independently.
- It has enough onboarding, delivery, or routing structure to be sold as a customer-facing outcome.

Not every item below has the same production readiness. This audit separates primary products from modules, vertical wrappers, funnel blueprints, pricing plans, and GTM plays.

## Source Files Audited

- `src/lib/package-catalog.ts`
- `src/lib/package-persona-blueprints.ts`
- `src/lib/live-deliverables.ts`
- `src/lib/catalog.ts`
- `src/lib/offer-engine.ts`
- `src/lib/public-offer.ts`
- `src/lib/funnel-library.ts`
- `src/config/gtm-use-cases.ts`
- `src/app/packages/**`
- `src/app/offers/**`
- `src/app/industries/**`
- `src/app/deliverables/**`
- `src/app/directory/**`
- `src/app/funnel/**`
- `src/app/marketplace/**`
- `docs/PRODUCT-SURFACES.md`

## Executive Count

| Category | Count | What it means |
|---|---:|---|
| Primary provisionable packages | 23 | Main standalone products under `/packages/[slug]`. |
| Persona/service blueprints | 23 | Specific buyer, resident/end-user, messaging, pain, journey, delivery-shape, and service-blueprint contracts for every primary package. |
| Live deliverable modules | 12 | Individual plan deliverables under `/deliverables/[slug]`. |
| Vertical offer paths | 16 | Niche wrappers under `/offers`, `/industries`, `/assess`, `/resources`, and `/directory`. |
| Funnel blueprints | 10 | Funnel families under `/funnel/[family]`. |
| GTM revenue plays | 10 | Sellable motions and market strategies from the GTM use-case config. |
| Commercial plans | 3 | Public subscription plans that package capacity and deliverables. |

## Primary Standalone Products

These are the strongest candidates for standalone sales because they are defined in the package catalog.

Status definitions:

- Complete automation contract: the package has at least 8 deliverables and at least 4 autonomous workflow steps under the current package automation heuristic.
- Provisionable, workflow gap: the package has deliverables and onboarding fields, but does not yet define autonomous workflow steps. It can be sold as a product concept, but the codebase does not yet prove full automatic delivery.

| # | Slug | Offering | Audience | Status | Buyer | Customer outcome |
|---:|---|---|---|---|---|---|
| 1 | `ai-opportunity-audit` | AI opportunity audit | B2B | Complete automation contract | SMBs, founders, agencies, operators | A concrete AI implementation roadmap showing where AI can save time, recover revenue, or reduce risk. |
| 2 | `ghost-expert-course-factory` | Ghost expert course factory | B2B2C | Complete automation contract | Experts, consultants, coaches, educators, professionals | A finished branded course without the expert writing scripts or performing on camera. |
| 3 | `ai-receptionist-missed-call-recovery` | AI receptionist and missed-call recovery | B2B2C | Complete automation contract | Med spas, dentists, HVAC, roofers, salons, restaurants, clinics | A 24/7 call capture and booking system for missed calls, FAQs, qualification, and handoff. |
| 4 | `lead-reactivation-engine` | Lead reactivation engine | B2B2C | Complete automation contract | Businesses with dormant CRM leads, old inquiries, stale quotes, or past customers | Recovered pipeline and booked appointments from leads the business already paid for. |
| 5 | `speed-to-lead-system` | Speed-to-lead system | B2B2C | Complete automation contract | Businesses running paid ads, forms, demos, or booking funnels | Every new lead gets contacted quickly, qualified, routed, and booked. |
| 6 | `content-repurposing-engine` | AI content repurposing engine | B2B2C | Complete automation contract | Creators, consultants, coaches, founders, podcasters, agencies | One source asset becomes a month of platform-native content. |
| 7 | `ai-ugc-video-ad-studio` | AI UGC and video ad studio | B2B2C | Complete automation contract | Ecommerce, beauty, skincare, wellness, product, and paid-media brands | High-volume product ad creative faster and cheaper than traditional UGC production. |
| 8 | `med-spa-growth-engine` | Med spa growth engine | B2B2C | Complete automation contract | Med spas and aesthetic clinics | More booked consultations through ad creative, Google Business Profile optimization, reviews, and local attribution. |
| 9 | `webinar-lead-magnet-factory` | Webinar lead magnet factory | B2B2C | Complete automation contract | B2B companies, SaaS, agencies, consultants, education businesses | Existing webinars become lead magnets, promo copy, and subscriber or pipeline assets. |
| 10 | `founder-ai-chief-of-staff` | Founder AI chief of staff | B2B | Complete automation contract | Busy founders, creators, executives, small teams, operators | Saved operating time through triage, follow-up, summaries, dashboards, and business-health reporting. |
| 11 | `ai-first-business-os` | AI-first business OS | B2B | Complete automation contract | SMBs, startups, agencies, operators | A multi-department AI operating system with agents, workflows, dashboards, and optimization. |
| 12 | `local-service-lead-engine` | Local service lead engine | B2B2C | Provisionable, workflow gap | Local service businesses and agencies | Capture urgent local service demand, qualify leads, route them, and prove source ROI. |
| 13 | `agency-client-workspace` | Agency client workspace | B2B | Provisionable, workflow gap | Agencies launching client-facing lead systems | A branded client workspace for lead capture, reporting, and operating client outcomes. |
| 14 | `directory-monetization-system` | Directory monetization system | B2B2C | Provisionable, workflow gap | Directory owners and local media operators | Convert directory traffic into routed, monetizable lead demand. |
| 15 | `saas-trial-conversion-system` | SaaS trial conversion system | B2B2C | Provisionable, workflow gap | SaaS founders and PLG teams | Convert trial users using activation signals, nudges, demos, and revenue events. |
| 16 | `consultant-authority-funnel` | Consultant authority funnel | B2B2C | Provisionable, workflow gap | Consultants, experts, coaches, service providers | Qualify prospects before booking and package authority into a conversion funnel. |
| 17 | `franchise-territory-router` | Franchise territory router | B2B2C | Provisionable, workflow gap | Franchises, territory operators, multi-location brands | Route leads to the correct territory with brand-level visibility. |
| 18 | `marketplace-lead-seller-system` | Marketplace lead seller system | B2B2C | Provisionable, workflow gap | Lead sellers and pay-per-lead marketplace operators | Create buyer-ready lead inventory with pricing, claims, routing, and outcome tracking. |
| 19 | `affiliate-partner-revenue-system` | Affiliate and partner revenue system | B2B2C | Provisionable, workflow gap | Affiliate operators, partner programs, channel teams | Capture partner-sourced leads and attribute revenue to the right partner. |
| 20 | `reactivation-retention-system` | Reactivation and retention system | B2B2C | Provisionable, workflow gap | Operators with dormant leads, churn risk, or repeat purchase opportunities | Bring dormant leads and customers back into a measurable revenue path. |
| 21 | `operator-control-plane-system` | Operator control plane system | B2B | Provisionable, workflow gap | Internal operators, agencies, autonomous system owners | Operate packages, queues, toggles, readiness, and revenue from one control plane. |
| 22 | `content-distribution-engine` | Content distribution engine | B2B2C | Provisionable, workflow gap | Operators needing reusable content, lead magnets, and distribution workflows | Launch content capture paths that turn content into qualified leads. |
| 23 | `revenue-attribution-suite` | Revenue attribution suite | B2B | Provisionable, workflow gap | Operators proving campaign, partner, buyer, or channel ROI | Connect lead capture to revenue outcomes and show what actually works. |

## Persona and Service Blueprint Coverage

Every primary package now has a dedicated persona blueprint in `src/lib/package-persona-blueprints.ts` and every `/packages/[slug]` page renders it.

Each primary package page now shows:

- who the offer is for
- the decision maker
- the resident, end user, downstream customer, or internal operator served
- the market-facing messaging
- specific pain points
- expected result
- delivery shape
- user journey
- service blueprint
- verification posture

The package provisioning test suite now requires every package to include these persona fields before the build can be considered healthy.

## Live Deliverable Modules

These are smaller standalone modules exposed as live deliverable pages. They can be sold independently, used as plan features, or bundled into package products.

| # | Slug | Module | Audience | Route | Standalone outcome |
|---:|---|---|---|---|---|
| 1 | `lead-capture-workspace` | Hosted lead capture workspace | B2B2C | `/deliverables/lead-capture-workspace` | A hosted place to capture demand for a business, client, or campaign. |
| 2 | `lead-scoring-routing` | Basic lead scoring and routing | B2B2C | `/deliverables/lead-scoring-routing` | Leads are scored and routed to the right owner or next step. |
| 3 | `email-nurture-workflow` | Email nurture workflow | B2B2C | `/deliverables/email-nurture-workflow` | Captured leads receive structured follow-up. |
| 4 | `embed-capture-script` | Embeddable capture script | B2B2C | `/deliverables/embed-capture-script` | Capture surfaces can be embedded into external pages. |
| 5 | `operator-dashboard` | Operator dashboard access | B2B | `/deliverables/operator-dashboard` | Operators can monitor leads, packages, and delivery activity. |
| 6 | `ab-testing-surface` | A/B testing surface | B2B2C | `/deliverables/ab-testing-surface` | Operators can compare variants and improve capture performance. |
| 7 | `attribution-view` | Attribution view | B2B | `/deliverables/attribution-view` | Operators can see which sources and campaigns create outcomes. |
| 8 | `channel-readiness` | WhatsApp-ready channel toggle | B2B | `/deliverables/channel-readiness` | Messaging channels can be prepared for multi-channel follow-up. |
| 9 | `marketplace-surface` | Marketplace access surface | B2B2C | `/deliverables/marketplace-surface` | Leads and demand can be exposed to a buyer marketplace surface. |
| 10 | `support-lane` | Priority support lane | B2B | `/deliverables/support-lane` | A support path for higher-tier operators or customers. |
| 11 | `funnel-library` | Unlimited funnel definitions | B2B | `/deliverables/funnel-library` | Operators can define and reuse multiple funnel structures. |
| 12 | `production-launch-checklist` | Production launch checklist | B2B | `/deliverables/production-launch-checklist` | A launch-readiness checklist for production rollout. |

## Vertical Offer Paths

These are niche wrappers that can package the core products for a market. They are not all separate product engines, but each can be offered as a market-specific version of the catalog.

| # | Slug | Vertical | Primary route family | Standalone positioning |
|---:|---|---|---|---|
| 1 | `general` | Business Automation | `/offers/general`, `/industries/general`, `/assess/general`, `/resources/general`, `/directory/general` | General automation and lead operations. |
| 2 | `legal` | Legal Operations | `/offers/legal`, `/industries/legal`, `/assess/legal`, `/resources/legal`, `/directory/legal` | Legal intake, qualification, routing, and follow-up. |
| 3 | `home-services` | Home Services | `/offers/home-services`, `/industries/home-services`, `/assess/home-services`, `/resources/home-services`, `/directory/home-services` | Local service lead capture, urgency routing, and booking. |
| 4 | `coaching` | Coaching and Consulting | `/offers/coaching`, `/industries/coaching`, `/assess/coaching`, `/resources/coaching`, `/directory/coaching` | Authority funnels, content, qualification, and appointment setting. |
| 5 | `construction` | Construction and Trades | `/offers/construction`, `/industries/construction`, `/assess/construction`, `/resources/construction`, `/directory/construction` | Quote intake, project qualification, and lead routing. |
| 6 | `real-estate` | Real Estate | `/offers/real-estate`, `/industries/real-estate`, `/assess/real-estate`, `/resources/real-estate`, `/directory/real-estate` | Buyer, seller, investor, and property lead flows. |
| 7 | `tech` | Technology and SaaS | `/offers/tech`, `/industries/tech`, `/assess/tech`, `/resources/tech`, `/directory/tech` | Trial conversion, demos, activation, and pipeline acceleration. |
| 8 | `education` | Education and Training | `/offers/education`, `/industries/education`, `/assess/education`, `/resources/education`, `/directory/education` | Course, webinar, content, and learner conversion flows. |
| 9 | `finance` | Finance and Accounting | `/offers/finance`, `/industries/finance`, `/assess/finance`, `/resources/finance`, `/directory/finance` | Advisory intake, trust content, qualification, and compliance-aware routing. |
| 10 | `franchise` | Franchise Operations | `/offers/franchise`, `/industries/franchise`, `/assess/franchise`, `/resources/franchise`, `/directory/franchise` | Territory routing, local pages, and brand-level attribution. |
| 11 | `staffing` | Staffing and Recruiting | `/offers/staffing`, `/industries/staffing`, `/assess/staffing`, `/resources/staffing`, `/directory/staffing` | Candidate intake, screening, interview routing, and client reporting. |
| 12 | `faith` | Church and Ministry | `/offers/faith`, `/industries/faith`, `/assess/faith`, `/resources/faith`, `/directory/faith` | Community engagement, volunteer routing, and event follow-up. |
| 13 | `creative` | Creative Agencies | `/offers/creative`, `/industries/creative`, `/assess/creative`, `/resources/creative`, `/directory/creative` | Lead intake, client qualification, and content or campaign operations. |
| 14 | `health` | Healthcare and Wellness | `/offers/health`, `/industries/health`, `/assess/health`, `/resources/health`, `/directory/health` | Appointment demand, patient or client intake, and compliance-aware follow-up. |
| 15 | `ecommerce` | E-Commerce | `/offers/ecommerce`, `/industries/ecommerce`, `/assess/ecommerce`, `/resources/ecommerce`, `/directory/ecommerce` | UGC creative, retention, reactivation, and attribution. |
| 16 | `fitness` | Fitness and Wellness | `/offers/fitness`, `/industries/fitness`, `/assess/fitness`, `/resources/fitness`, `/directory/fitness` | Membership lead capture, trial conversion, reactivation, and content. |

## Funnel Blueprints

These are standalone funnel buildouts. They can be sold as packaged funnel SKUs or used inside the larger packages.

| # | Slug | Funnel | Goal | Standalone outcome |
|---:|---|---|---|---|
| 1 | `lead-magnet` | Lead Magnet Funnel | Capture | Convert traffic into subscribers or leads through a gated asset. |
| 2 | `qualification` | Qualification Funnel | Book | Score prospects and route qualified buyers to booking. |
| 3 | `chat` | Conversational Funnel | Capture | Use chat-style intake to collect demand and qualify needs. |
| 4 | `webinar` | Webinar Funnel | Sell | Drive registration, attendance, follow-up, and sales motion. |
| 5 | `authority` | Authority Funnel | Capture | Package expertise and proof into a trust-building conversion path. |
| 6 | `checkout` | Checkout Funnel | Sell | Convert buyer intent into paid orders or purchases. |
| 7 | `retention` | Retention Funnel | Retain | Keep customers engaged and reduce churn. |
| 8 | `rescue` | Rescue Funnel | Recover | Recover abandoned, stale, or lost opportunities. |
| 9 | `referral` | Referral Funnel | Refer | Turn customers or partners into referral sources. |
| 10 | `continuity` | Continuity Funnel | Activate | Move users from purchase or signup into ongoing engagement. |

## GTM Revenue Plays

These are sellable go-to-market plays. Some should remain GTM motions until they are promoted into package catalog products.

| # | Slug | Play | Readiness | Standalone interpretation |
|---:|---|---|---|---|
| 1 | `erie-exclusive-niche` | Erie.pro exclusive niche routing | Active GTM play | Sell exclusive local category routing, starting with plumbing-style local demand. |
| 2 | `exclusive-category-ownership` | Exclusive category ownership | Active GTM play | Sell one city and niche as an owned lead territory. |
| 3 | `managed-lead-ops` | Managed lead ops | Needs package mapping | Sell done-for-you lead operations with capture, routing, and reporting. |
| 4 | `national-territory-directory` | National niche directory territories | Active GTM play | Sell territory-based directory demand routing. |
| 5 | `white-label-agencies` | White-label for agencies and consultants | Active GTM play | Sell the platform as an agency-client delivery layer. |
| 6 | `home-services-concierge` | Home services concierge or broker | Active GTM play | Sell intake, triage, and routing for consumer home-service requests. |
| 7 | `legal-immigration-intake` | Immigration and legal intake routing | Active GTM play | Sell legal intake, eligibility, routing, and follow-up. |
| 8 | `internal-ops-yourdeputy` | Internal ops engine | Needs packaging | Sell internal automation, dashboards, and operator control as an operating system. |
| 9 | `integration-hub` | Integration hub | Needs packaging | Sell reduced Zapier sprawl and cleaned-up workflow integration. |
| 10 | `platform-resale-deferred` | Platform or SaaS resale | Deferred | Do not treat as the primary offer until there are case studies and clearer proof. |

## Commercial Plans

These are standalone commercial containers, not product outcomes by themselves. They determine capacity and available deliverables.

| # | Slug | Plan | Price | Buyer fit | Included posture |
|---:|---|---|---|---|---|
| 1 | `whitelabel-starter` | Starter | `$99/mo` | One operator validating a lead capture workspace | Hosted workspace, basic scoring, email nurture, embed script, dashboard access. |
| 2 | `whitelabel-growth` | Growth | `$249/mo` | Teams running several funnels or client workspaces | Starter plus A/B testing, attribution, WhatsApp-ready toggle, and operator seats. |
| 3 | `whitelabel-enterprise` | Professional | `$499/mo` | Operators preparing a production multi-workspace rollout | Growth plus marketplace surfaces, priority support, unlimited funnels, and launch checklist. |

## Frontend Exposure Audit

| Surface | Exposure status | Notes |
|---|---|---|
| Primary packages | Exposed | `/packages` and `/packages/[slug]` exist for package catalog items. |
| Live deliverables | Exposed | `/deliverables` and `/deliverables/[slug]` exist. |
| Vertical offers | Exposed | `/offers/[slug]`, `/industries/[slug]`, `/assess/[slug]`, `/resources/[slug]`, and `/directory/[vertical]` exist for niche catalog paths. |
| Funnel blueprints | Exposed | `/funnel/[family]` exists for default funnel families. |
| Directory lead router | Exposed | `/directory/lead-router` exists and should be documented as its own directory operating surface. |
| GTM use cases | Partially exposed | They are documented and configured, but several are not package-catalog products. |
| Public plans | Exposed | `/pricing` and plan CTAs exist. |
| Operator control surfaces | Exposed but not public offers | `/dashboard/**` and many `/api/**` routes are operating infrastructure, not customer-facing products. |

## Critical Gaps

1. Twelve primary products are not fully automated by the codebase's own package automation heuristic because they do not define autonomous workflow steps.
2. Some GTM revenue plays are sellable concepts but are not yet product catalog packages. This can confuse operators about whether they are live products, strategies, or future SKUs.
3. The niche catalog and `OFFER_TEMPLATES` do not fully align. For example, the catalog uses `tech` and `health`, while offer templates include `technology` and `healthcare`. This means some vertical offer pages can miss richer niche-specific blueprint content.
4. Vertical pages are market wrappers, not always separate delivery engines. They should be positioned as niche versions of core products unless the catalog defines a dedicated package.
5. Live deliverables are modules. They can be sold independently, but the strongest customer promise comes from bundling them into outcome packages.
6. External-account actions, credentials, live sending, phone numbers, payment processing, and real platform API access still depend on client-provided credentials and configured integrations. The website should avoid claiming guaranteed external provisioning when required credentials are missing.
7. Audience language is mixed across B2B operator, B2B client-business, B2B2C downstream customer, and internal operator surfaces. Primary package pages now separate buyer, decision maker, resident/end user, journey, and service blueprint, but the broader site navigation should still reinforce this hierarchy.

## Recommended Standalone Offer Architecture

Use this hierarchy to avoid confusing customers:

1. Primary products: the 23 package catalog items.
2. Modules: the 12 live deliverables.
3. Vertical wrappers: the 16 niche offer paths.
4. Funnel SKUs: the 10 funnel blueprints.
5. GTM motions: the 10 revenue plays.
6. Commercial containers: the 3 public plans.

## Highest-Priority Fixes

1. Add autonomous workflow definitions to the 12 provisionable packages with workflow gaps.
2. Align `nicheCatalog` slugs with `OFFER_TEMPLATES`, or add aliases so every vertical page receives the right offer blueprint.
3. Promote only the GTM plays that are truly productized into `package-catalog.ts`; keep the rest clearly labeled as GTM strategies.
4. Add a buyer selector across the public site: operator, agency, SMB owner, vertical business, or internal admin.
5. Make the package pages the canonical product list, and treat deliverables, funnels, and verticals as supporting ways to package those products.
