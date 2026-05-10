# Erie.Pro ConvertBox Implementation Pack

This pack turns the Erie.Pro ConvertBox strategy into a build-ready configuration. It assumes the live site has 112 service groups and thousands of intent URLs, so the ConvertBox setup should be systematic rather than one-off popups.

## Goal

Use ConvertBox as a polite conversion layer on top of Erie.Pro authority pages. The overlay should help visitors move faster, not distract them.

Primary outcomes:

- Capture high-intent service requests from visitors who are ready now.
- Route emergency visitors into phone-first callback flows.
- Help research-stage visitors choose the right service without pressure.
- Preserve a calm, premium user experience across desktop and mobile.
- Keep the first launch small enough to manage, while still covering every service.

## ConvertBox Account Setup

Create or select the site:

- Site name: `Erie.Pro`
- Site domain: `erie.pro`
- Secondary domain: `www.erie.pro`

Create these groups:

- `Erie.Pro - Core`
- `Erie.Pro - Service Families`
- `Erie.Pro - Provider Acquisition`
- `Erie.Pro - Research Nurture`
- `Erie.Pro - QA Drafts`

Recommended naming:

`EP-[number] [Audience] - [Intent] - [Version]`

Examples:

- `EP-01 Visitor - Service Finder - v1`
- `EP-02 Emergency - Callback Request - v1`
- `EP-04 Pricing - Cost Confidence - v1`

## Global UX Rules

These rules matter more than any individual offer.

- Do not show a ConvertBox immediately on page load, except after a direct CTA click.
- Show at most one proactive ConvertBox per session.
- Suppress all proactive boxes for 7 days after a visitor closes one.
- Suppress quote and callback boxes for 30 days after a successful submission.
- On mobile, use bottom bars or small slide-ins. Use modal boxes only after a visitor clicks a CTA.
- Never cover Erie.Pro's native form if it is visible in the viewport.
- Emergency pages may show a faster callback prompt, but only after 20 seconds, exit intent, or CTA click.
- Research pages should offer checklists, comparison help, or service matching, not hard-sell language.
- Returning visitors should see a resume-style prompt, not the same first-visit prompt.

## Field Standard

Every lead capture box should collect only what the visitor's intent justifies.

Minimum fast-quote fields:

- First name
- Phone
- Email
- ZIP code
- Service needed
- Timeline
- Short description

Emergency callback fields:

- First name
- Phone
- ZIP code
- Emergency type
- Can receive SMS updates

Project planner fields:

- First name
- Phone
- Email
- ZIP code
- Service category
- Project type
- Timeline
- Property type
- Budget range when appropriate
- Short description

Professional appointment fields:

- First name
- Phone
- Email
- ZIP code
- Service type
- Preferred appointment window
- New or returning customer

Provider acquisition fields:

- Business name
- Owner or manager name
- Email
- Phone
- Service category
- Service area
- Claim existing profile

## Metadata Standard

Each ConvertBox submission should pass these hidden fields into LeadOS or the Erie.Pro inbound lead endpoint.

- `source`: `convertbox`
- `site`: `erie-pro`
- `box_name`
- `campaign_group`
- `service_label`
- `service_slug`
- `service_family`
- `page_url`
- `page_path`
- `page_type`
- `intent`
- `urgency`
- `timeline`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `referrer`
- `device_type`
- `form_version`
- `sms_consent`

## Launch Campaigns

### EP-01 Visitor - Service Finder - v1

- Group: `Erie.Pro - Core`
- Type: slide-in on desktop, bottom bar on mobile
- Audience: first-time or unknown visitors
- Pages: `/`, `/services`, `/directory`, `/areas`, broad service listing pages
- Trigger: 40 seconds, 50 percent scroll, or second pageview
- Goal: help visitors choose the correct service without forcing a form
- CTA: `Find the right Erie pro`
- First step question: `What kind of help do you need?`
- Next steps: service category, ZIP code, timeline, contact details only after the visitor continues
- Suppression: 7 days after close, 30 days after submit

### EP-02 Emergency - Callback Request - v1

- Group: `Erie.Pro - Service Families`
- Type: modal after click, slide-in if passive
- Audience: emergency service visitors
- Pages: emergency pages and emergency-family service pages
- URL rule examples: contains `/emergency`, `/water-damage-restoration`, `/fire-damage-restoration`, `/storm-damage-repair`, `/towing-roadside-assistance`, `/locksmith-services`, `/drain-cleaning`, `/sewer-line-repair`, `/ac-repair`, `/furnace-repair`, `/ice-dam-removal`, `/emergency-board-up`, `/basement-flood-cleanup`
- Trigger: CTA click, 20 seconds, exit intent
- Goal: phone-first callback lead
- CTA: `Request urgent callback`
- Fields: first name, phone, ZIP code, emergency type, SMS consent
- Suppression: 30 days after submit; emergency CTA click may override close suppression

### EP-03 Service - Fast Quote - v1

- Group: `Erie.Pro - Core`
- Type: slide-in on desktop, bottom bar on mobile
- Audience: visitors on service and provider pages
- Pages: service main pages, provider pages, directory pages
- Trigger: 45 seconds, 60 percent scroll, second high-intent pageview
- Goal: capture ready-to-buy leads
- CTA: `Get a fast quote`
- Fields: first name, phone, email, ZIP code, service needed, timeline, description
- Suppression: 7 days after close, 30 days after submit

### EP-04 Pricing - Cost Confidence - v1

- Group: `Erie.Pro - Research Nurture`
- Type: slide-in
- Audience: visitors comparing prices
- Pages: URLs containing `/pricing`, `/costs`, `/compare`
- Trigger: 50 percent scroll or 60 seconds
- Goal: convert pricing research into a quote request
- CTA: `Check realistic local pricing`
- Fields: service, ZIP code, project type, timeline, contact details after opt-in
- Message angle: local price ranges vary by scope, urgency, and property details

### EP-05 Project - Planner - v1

- Group: `Erie.Pro - Service Families`
- Type: multi-step modal launched by CTA or slide-in
- Audience: planned project visitors
- Pages: remodeling, construction, outdoor build, solar, concrete, flooring, kitchen, bath, basement, siding, decks
- Trigger: CTA click, 70 percent scroll, second pageview
- Goal: collect enough scope to route the lead intelligently
- CTA: `Plan my project`
- Fields: project type, property type, timeline, budget range, ZIP, name, phone, email, description

### EP-06 Appointment - Professional Services - v1

- Group: `Erie.Pro - Service Families`
- Type: slide-in or CTA modal
- Audience: health, legal, finance, real estate, and other appointment-style visitors
- Pages: professional and health service categories
- Trigger: 50 seconds, 60 percent scroll, CTA click
- Goal: appointment request or consultation lead
- CTA: `Request an appointment`
- Fields: service type, preferred window, ZIP, name, phone, email
- UX note: avoid urgent home-repair language here

### EP-07 Research - Checklist Capture - v1

- Group: `Erie.Pro - Research Nurture`
- Type: soft slide-in
- Audience: early-stage readers
- Pages: `/guides`, `/checklist`, `/certifications`, `/seasonal`, `/tips`, blog pages
- Trigger: 70 percent scroll or 90 seconds
- Goal: capture research-stage email or route to service finder
- CTA: `Send me the checklist`
- Fields: email, service category, ZIP code optional
- Suppression: 14 days after close, 45 days after submit

### EP-08 Provider - Claim Territory - v1

- Group: `Erie.Pro - Provider Acquisition`
- Type: slide-in or embedded ConvertBox if available
- Audience: business owners and providers
- Pages: `/pros`, `/for-business`, `/for-business/claim`, provider profile pages
- Trigger: 35 seconds, 50 percent scroll, CTA click
- Goal: recruit service providers and claim business profiles
- CTA: `Claim my Erie profile`
- Fields: business name, owner name, email, phone, service category, service area

### EP-09 Exit - Quote Rescue - v1

- Group: `Erie.Pro - Core`
- Type: exit intent desktop, mobile back/scroll fallback if supported
- Audience: high-intent visitors who have not submitted
- Pages: service pages, pricing pages, provider pages
- Trigger: exit intent only
- Goal: save abandoning visitors without interrupting committed users
- CTA: `Before you go, want a quick match?`
- Fields: service, ZIP, phone or email
- Suppression: once per 14 days after close

### EP-10 Returning - Resume Request - v1

- Group: `Erie.Pro - Core`
- Type: slide-in
- Audience: returning visitors who viewed service/pricing pages but did not submit
- Pages: service, pricing, provider, compare pages
- Trigger: 20 seconds on return visit
- Goal: make the experience feel remembered and easy
- CTA: `Continue where I left off`
- Fields: preselect likely service when page context is clear, then ZIP and contact
- Suppression: 30 days after submit

## Priority Build Order

Build in this order:

1. `EP-03 Service - Fast Quote - v1`
2. `EP-02 Emergency - Callback Request - v1`
3. `EP-04 Pricing - Cost Confidence - v1`
4. `EP-01 Visitor - Service Finder - v1`
5. `EP-05 Project - Planner - v1`
6. `EP-06 Appointment - Professional Services - v1`
7. `EP-07 Research - Checklist Capture - v1`
8. `EP-08 Provider - Claim Territory - v1`
9. `EP-09 Exit - Quote Rescue - v1`
10. `EP-10 Returning - Resume Request - v1`

This order captures the highest commercial intent first and delays the softer nurturing experiences until the core request flows work.

## Copy Bank

Use short, plain copy. Erie.Pro should feel useful and local, not noisy.

Fast quote headline:

`Need help finding the right Erie pro?`

Fast quote body:

`Tell us what you need and where the job is. We will help route the request to the right service path.`

Emergency headline:

`Need urgent help in Erie?`

Emergency body:

`Share the basics and request a callback. Keep this short so help can move quickly.`

Pricing headline:

`Want a realistic local price check?`

Pricing body:

`A few details make Erie pricing much more useful than a generic estimate.`

Project planner headline:

`Planning a bigger project?`

Project planner body:

`Answer a few scope questions so the request reaches the right kind of pro.`

Appointment headline:

`Request an appointment`

Appointment body:

`Tell us the service and preferred timing so the next step is simple.`

Research checklist headline:

`Want the local checklist?`

Research checklist body:

`Get a practical checklist for comparing Erie providers before you choose.`

Provider headline:

`Serve customers in Erie?`

Provider body:

`Claim your profile or tell us where your business should appear.`

## Routing Rules

Use URL path and page context first. Ask the visitor to choose only when the context is ambiguous.

Recommended page type detection:

- `/services`: service directory
- `/services/[service-slug]`: service page
- `/services/[service-slug]/pricing`: pricing page
- `/services/[service-slug]/costs`: costs page
- `/services/[service-slug]/compare`: comparison page
- `/services/[service-slug]/emergency`: emergency page
- `/services/[service-slug]/guides`: guide page
- `/services/[service-slug]/checklist`: checklist page
- `/providers` or provider profile route: provider page
- blog route: research page

## Lead Quality Rules

Mark as high priority when:

- Timeline is `now`, `today`, or `emergency`.
- Page type is emergency, pricing, provider, or service page.
- Visitor provides phone number.
- Visitor submits from a returning visit.

Mark as nurture when:

- Visitor only requests checklist.
- Timeline is more than 30 days.
- No phone number is provided.
- Page type is guide, seasonal, tips, glossary, or blog.

## QA Checklist

Before activating any ConvertBox:

- Confirm the Erie.Pro tracking script is installed once.
- Confirm no box appears before the configured trigger.
- Confirm mobile rendering does not block navigation or native form controls.
- Confirm every submission includes `source=convertbox`.
- Confirm service, slug, family, page URL, and UTM values are captured when available.
- Confirm close suppression works.
- Confirm submit suppression works.
- Confirm emergency CTA click opens the emergency flow even if no passive box has appeared.
- Confirm test leads reach the expected LeadOS or Erie.Pro destination.
- Confirm no ConvertBox appears on admin, auth, preview, or non-public pages.

## Activation Policy

Start with draft mode, then activate by family:

1. Emergency home response
2. Planned home projects
3. Cleaning and property turnover
4. Health and appointment services
5. Professional and financial services
6. Seasonal Erie services
7. Auto, marine, and roadside
8. Provider acquisition

Do not activate all ten campaigns at once. Launch the first three, review submissions and UX, then expand.

