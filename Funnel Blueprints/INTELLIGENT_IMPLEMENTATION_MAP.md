# Intelligent Funnel Implementation Map

This document maps the blueprint files in `Funnel Blueprints/` to:

1. The standard funnel type the title represents
2. What that funnel is typically used for
3. How Lead OS should implement it using the current framework
4. How to make the funnel adaptive instead of static

## Current Lead OS building blocks

Lead OS already has the main primitives needed to implement most of these funnels:

- Behavioral scoring: `neatcircle-beta/src/lib/funnel-engine.ts`
- Blueprint routing: `neatcircle-beta/src/lib/funnel-blueprints.ts`
- On-site orchestration: `neatcircle-beta/src/components/FunnelOrchestrator.tsx`
- Lead capture: assessment, ROI calculator, chat, exit intent, referral, WhatsApp opt-in
- Event tracking: `neatcircle-beta/src/app/api/track/route.ts`
- Contact capture: `neatcircle-beta/src/app/api/contact/route.ts`
- Nurture engine: `neatcircle-beta/src/app/api/cron/nurture/route.ts`
- Niche automations: `neatcircle-beta/src/app/api/automations/*`
- Conversion step: `neatcircle-beta/src/app/api/automations/convert/route.ts`

## Blueprint-by-blueprint interpretation

| Blueprint file | Funnel type | Primary use | Lead OS implementation |
| --- | --- | --- | --- |
| GERU Project Affiliate Email Funnel.pdf | Affiliate/email presell | Warm leads before sending them to a promoted offer | Use `back-to-basics` + `bridge` + nurture email sequence, but replace affiliate offer with niche offer page or partner offer page |
| GERU Project Agency Client-Audit Funnel.pdf | Audit/assessment funnel | Diagnose a prospect and convert them into a booked consultation | Use `client-audit` as the core blueprint |
| GERU Project Agency Free Book Funnel.pdf | Lead magnet funnel | Exchange a free book/report for email, then nurture | Use `back-to-basics` with a niche-specific downloadable asset |
| GERU Project Agency Lead Gen Funnel.pdf | Standard lead gen funnel | Capture leads from cold traffic and route to nurture | Use `lead-gen` |
| GERU Project Agency Value Ladder Funnel.pdf | Ascension/value ladder funnel | Move prospects from free to low-ticket to mid-ticket to high-ticket | Use `value-ladder` with niche-specific tiers |
| GERU Project Appointment Generator Funnel.pdf | Appointment funnel | Drive direct bookings from warm service traffic | Use `appointment-gen` |
| GERU Project Ask Them Funnel.pdf | Survey/sales callout funnel | Use a question or survey to segment intent fast | Combine `chatbot-lead` + assessment entry logic |
| GERU Project Back To Basics.pdf | Simple opt-in funnel | Capture email from cold traffic with minimum friction | Use `back-to-basics` |
| GERU Project Bridge Funnel.pdf | Bridge funnel | Warm cold traffic before sending them to the core offer | Use `bridge` |
| GERU Project Cart Abandonment Seq Funnel.pdf | Abandonment recovery funnel | Recover unfinished checkout or unfinished lead flow | Use `abandonment-recovery` plus nurture retargeting |
| GERU Project Chatbot Lead Funnel.pdf | Conversational lead funnel | Qualify and capture via chat | Use `chatbot-lead` |
| GERU Project Coaching Leads_Sales Funnel.pdf | High-ticket coaching funnel | Convert educational interest into consultation and close | Use `high-ticket-call` + `mini-class` |
| GERU Project Customer Onboarding Funnel.pdf | Onboarding/activation funnel | Activate customers and reduce churn after purchase | Use `customer-onboarding` |
| GERU Project Documentary Funnels.pdf | Story/VSL trust funnel | Build desire and authority through narrative proof | Add a documentary/VSL variant of `bridge` |
| GERU Project Ecom Coupon Funnel.pdf | Coupon funnel | Capture/convert price-sensitive shoppers with discount urgency | Add a coupon offer variant on top of `abandonment-recovery` |
| GERU Project Ecom Sales Funnel.pdf | Direct-response product funnel | Sell a product directly with upsells and downsells | Add a product-sales blueprint with checkout branching |
| GERU Project Evergreen Launch Funnel.pdf | Evergreen launch funnel | Simulate launch dynamics continuously | Add an evergreen webinar/launch blueprint |
| GERU Project First Neat Circle Sales Funnel.pdf | Master hybrid funnel | Combine multiple funnel types into one orchestrated journey | Treat as a master orchestration pattern, not a single page funnel |
| GERU Project Freemium Membership Funnel.pdf | Freemium conversion funnel | Convert free users into paid members over time | Add freemium onboarding + upgrade ladder |
| GERU Project Funnel Breakdown - Webinar Funnel.pdf | Webinar funnel | Use a webinar to educate and convert | Add webinar funnel blueprint |
| GERU Project Giveaway Lead Capture Funnel.pdf | Giveaway funnel | Capture a large volume of cold leads quickly | Add giveaway capture blueprint with strong filtering |
| GERU Project High Ticket Call 2 Funnel.pdf | High-ticket call funnel | Pre-qualify and book strategy sessions for premium offers | Use `high-ticket-call` |
| GERU Project Micro Continuity Funnel.pdf | Continuity/subscription funnel | Turn buyers into recurring subscribers | Add subscription continuity after onboarding or low-ticket entry |
| GERU Project Mini Class Funnel.pdf | Mini class funnel | Educate in short structured lessons, then convert | Use `mini-class` |
| GERU Project Physical Products Funnel.pdf | Physical product funnel | Sell a physical offer with cart, upsells, and follow-up | Add product-sales + abandonment + post-purchase flows |
| GERU Project Refund Prevention Funnel Copy.pdf | Retention/save funnel | Prevent cancellations or refunds post-purchase | Add retention rescue logic after convert/onboarding |
| GERU Project The Content Multiplier Funnel.pdf | Content engine funnel | Turn content consumption into segmented lead capture | Use `bridge` + `lead-gen` + `mini-class` |
| GERU Project Webinar Live Chatbot-Email.pdf | Live webinar hybrid | Drive webinar attendance and rescue drop-off with bot/email | Add webinar blueprint with chatbot and nurture branches |
| GERU Project Webinar Live Funnel.pdf | Live webinar funnel | Register, remind, attend, pitch, close | Add webinar live blueprint |
| GERU Project Webinar Live SMS Funnel.pdf | Webinar reminder funnel | Improve attendance with SMS/WhatsApp reminders | Add webinar live blueprint with WhatsApp reminders |
| GERU Project Webinar On-Demand Funnel.pdf | Evergreen webinar funnel | Run automated webinar replay funnel at scale | Add webinar on-demand blueprint |

## What the titles imply operationally

The 31 files are not 31 totally different systems. They collapse into a smaller set of reusable funnel families:

- Capture: back-to-basics, free book, giveaway, ask-them, chatbot lead
- Qualification: client audit, appointment generator, high-ticket call, coaching sales
- Warm-up: bridge, documentary, content multiplier, mini class
- Conversion: value ladder, ecom sales, physical products, coupon
- Recovery: cart abandonment, refund prevention
- Activation/retention: onboarding, freemium membership, micro continuity
- Event-driven conversion: webinar live, webinar SMS, webinar chatbot-email, webinar on-demand, evergreen launch
- Meta-orchestration: first master sales funnel

This means Lead OS should implement:

1. Reusable funnel primitives
2. Reusable transition rules
3. Reusable channel triggers
4. Reusable recovery branches

instead of hard-coding 31 separate one-off funnels.

## How Lead OS should make each funnel intelligent

Every represented funnel should adapt on five dimensions:

### 1. Visitor intent

Use current scoring and events to determine whether a user should see:

- a low-friction opt-in
- an assessment
- an ROI calculator
- a direct consult CTA
- a recovery offer

### 2. Niche relevance

Use:

- URL path
- selected service
- assessment answers
- chat messages
- company metadata

to infer niche and swap:

- headline
- proof
- offer
- CTA
- automation route

### 3. Channel preference

Route follow-up by strongest available channel:

- email only -> nurture email
- phone captured -> fast-track consult
- WhatsApp opt-in -> reminder + follow-up by WhatsApp
- hot lead score -> Discord/Telegram alert + human outreach

### 4. Buyer temperature

Use different funnels for different temperatures:

- cold: back-to-basics, bridge, giveaway, free book
- warm: client audit, mini class, chatbot lead, appointment
- hot: high-ticket call, value ladder, direct consult
- post-purchase: onboarding, continuity, refund prevention, referral

### 5. Objection state

Infer objection type from behavior:

- pricing page + no form submit -> price objection
- long time on service page + no CTA -> trust objection
- calculator used + no booking -> timing/internal buy-in objection
- started assessment + dropped off -> overwhelm objection

Then switch the next step:

- price objection -> downsell, coupon, ROI proof
- trust objection -> documentary, case study, mini class
- timing objection -> nurture + reminder + booking fallback
- overwhelm objection -> simpler checklist or chatbot

## Recommended implementation model

### A. Expand blueprint families, not just pages

Lead OS already has good coverage for:

- client-audit
- lead-gen
- value-ladder
- high-ticket-call
- chatbot-lead
- appointment-gen
- abandonment-recovery
- bridge
- mini-class
- customer-onboarding
- back-to-basics

Add the next missing families:

- webinar-live
- webinar-evergreen
- giveaway-capture
- documentary-vsl
- product-sales
- coupon-offer
- freemium-membership
- continuity
- refund-prevention
- affiliate-presell
- content-multiplier
- master-orchestration

### B. Add step-level channel triggers

Each funnel step should optionally trigger:

- contact capture
- AITable log
- WhatsApp reminder
- nurture enrollment
- niche automation route
- conversion route

Example:

- webinar registration -> `/api/contact` + `/api/track`
- attended webinar -> add score + enter webinar follow-up
- missed webinar -> on-demand replay branch
- started checkout -> abandonment timer
- converted -> onboarding + referral sequence

### C. Add adaptive step selection

Instead of one linear step list, each blueprint should support branch rules like:

- if score >= 80 and phone exists -> skip to booking
- if chat engaged but no email -> capture step
- if calculator used twice -> ROI proof step
- if return visitor with no capture -> recovery popup
- if referral visitor -> shorter path to appointment

### D. Promote behavior memory

Persist:

- source
- niche
- last blueprint
- last completed step
- objections inferred
- channels available
- purchase stage

Then choose the next step from memory, not just current page.

## Best blueprint use by business model

### Service businesses

Best fits:

- Agency Client-Audit
- Agency Lead Gen
- Agency Value Ladder
- Appointment Generator
- Chatbot Lead
- High Ticket Call 2
- Mini Class
- Bridge Funnel
- Customer Onboarding
- Content Multiplier

### Information/coaching businesses

Best fits:

- Coaching Leads_Sales
- Webinar Funnel
- Webinar Live Funnel
- Webinar On-Demand Funnel
- Evergreen Launch Funnel
- Mini Class
- High Ticket Call 2

### Ecommerce/product businesses

Best fits:

- Ecom Sales
- Ecom Coupon
- Physical Products
- Cart Abandonment
- Refund Prevention
- Micro Continuity

### Membership/subscription businesses

Best fits:

- Freemium Membership
- Micro Continuity
- Customer Onboarding
- Refund Prevention

## How Lead OS should treat each user uniquely

For every visitor, Lead OS should compute:

- `nicheInterest`
- `temperature`
- `objectionType`
- `channelPreference`
- `offerReadiness`
- `customerState`

Then select:

- blueprint family
- next step
- CTA text
- proof type
- delivery channel
- automation route

### Example decisions

- Cold paid traffic from Facebook to a niche page:
  - show `bridge`
  - if engaged, move to `client-audit`
  - if exiting, show `back-to-basics` lead magnet

- Repeat visitor who used ROI calculator twice:
  - bypass soft capture
  - show `high-ticket-call` or `appointment-gen`

- Visitor who completed assessment with weak score:
  - route to `mini-class` or `bridge`
  - do not push hard consult yet

- Visitor with strong assessment score and phone:
  - trigger hot lead alert
  - move directly to booking and WhatsApp follow-up

- Converted customer:
  - move to `customer-onboarding`
  - then `referral` or `continuity` branch

## Practical conclusion

The blueprint library should not be implemented as 31 separate static funnels.

Lead OS should implement them as:

- 12 to 14 reusable blueprint families
- with branching logic
- with behavioral scoring
- with niche-aware copy and offer selection
- with channel-aware follow-up
- with recovery and post-conversion logic

That is how the represented funnels become intelligent rather than just copied.
