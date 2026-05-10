# ConvertBox + Lead OS Configuration Blueprint

Date: 2026-05-09

## Current ConvertBox Account State

- Logged in successfully.
- Active site selected: `funnelhacks.io`.
- Current groups: `nawa`, `Sales Funnels`.
- Current ConvertBoxes: `0 ConvertBoxes (0 active)`.
- Installation is available through the WordPress plugin or direct site script.

## ConvertBox Capabilities To Use

- Site-level install: WordPress plugin or JavaScript snippet in the site header.
- Groups: use as campaign folders organized by objective.
- ConvertBox types: overlay and embedded.
- Embedded areas: one dynamic embed area can rotate different boxes based on targeting rules.
- Multi-step boxes: steps behave like pages and can be linked by buttons, forms, or text links.
- Form actions: go to next step, jump to step, redirect to URL, open another ConvertBox, close box.
- Conditional actions: route people differently based on previous answers.
- Integrations: native ESP/CRM integrations, HTML forms, Zapier through webhooks, and direct webhooks.
- Webhooks: form submissions can be POSTed as JSON. Standard fields include first name, last name, email, phone, website, referer, campaign name, ConvertBox name, ConvertBox ID. Custom fields are sent by their configured custom IDs.
- Targeting rules: page views, sessions, device, visited URL, URL parameters, referrer, location, seen/not seen ConvertBox, cookies, WordPress login state, and ESP/CRM list/tag membership when identified.
- Link triggers: a ConvertBox can open from a hash link, useful for micro-commitment CTAs.
- A/B testing: duplicate a box into variations and test headlines, CTA copy, colors, offers, and step order. Use cookied tests when the visitor should see only one offer.

## Lead OS Findings That Matter For ConvertBox

Lead OS is a multi-tenant lead generation and routing runtime. It already thinks in the exact primitives ConvertBox can collect:

- Capture sources: contact form, assessment, ROI calculator, exit intent, chat, webinar, checkout, manual.
- Core endpoint: `POST /api/intake`.
- Decision endpoint: `POST /api/decision`.
- Lead score inputs: source, phone present, quote/booking intent, content engagement, explicit score.
- Lead stages: captured, qualified, offered, converted, onboarding, active, referral-ready.
- Funnel families: lead-magnet, qualification, chat, webinar, authority, checkout, retention, rescue, referral, continuity.
- Vertical niches: general, legal, home-services, coaching, construction, real-estate, tech, education, finance, franchise, staffing, faith, creative, health, ecommerce, fitness.
- Three-visit framework:
  - M1: capture identity and deliver immediate value.
  - M2: drive return engagement.
  - M3: book, offer, proposal, checkout, or application.

## Lead OS Offers Most Suitable For ConvertBox

Start with these because ConvertBox can directly improve their capture, qualification, and booking motions:

- `speed-to-lead-system`: paid ads/forms/demo traffic, immediate response, booking handoff.
- `lead-reactivation-engine`: dormant leads, stale quotes, abandoned consults.
- `local-service-lead-engine`: urgent local service demand, quote routing, proof of ROI.
- `consultant-authority-funnel`: expert/coach/consultant qualification before booking.
- `webinar-lead-magnet-factory`: webinar registration, replay, follow-up, sales motion.
- `ai-receptionist-missed-call-recovery`: missed-call and appointment-heavy local business capture.
- `directory-monetization-system`: directory traffic into routed leads.
- `marketplace-lead-seller-system`: lead inventory, buyer-ready qualification.
- `content-distribution-engine`: content to lead magnet to qualified lead.
- `revenue-attribution-suite`: source tracking, conversion tracking, ROI reporting.

## Recommended Group Structure

Rename or create groups around objectives:

- `01 - Lead Magnet Capture`
- `02 - Assessment / Qualification`
- `03 - Booking / High Intent`
- `04 - Webinar / Authority`
- `05 - Exit Intent / Rescue`
- `06 - Reactivation / Returning Visitors`
- `07 - Test Lab`

## First ConvertBoxes To Build

### 1. Global Low-Friction Lead Magnet

Purpose: capture cold or unknown visitors.

Type: embedded large plus optional overlay.

Targeting:

- New/unknown visitors.
- Has not seen this ConvertBox.
- All pages except checkout/booking pages.

Steps:

- Step 1: micro-commitment question.
  - "What are you trying to improve first?"
  - Options: more leads, faster follow-up, better qualification, booking more calls, proving ROI.
- Step 2: name and email.
- Step 3: thank you and next step.
  - CTA: "See the recommended funnel path"
  - Redirect to `/funnel/lead-magnet?niche=general` or relevant Lead OS page.

Webhook fields:

- `source=contact_form`
- `preferredFamily=lead-magnet`
- `niche`
- `goal`
- `email`
- `first_name`
- `$referer`
- UTM hidden fields where possible.

### 2. Two-Minute Assessment Box

Purpose: qualify warmer traffic and route them into Lead OS.

Type: overlay triggered by buttons and embedded on assessment pages.

Best trigger:

- Link trigger from CTA buttons, because ConvertBox notes link triggers often convert better than passive popups due to the click micro-commitment.

Steps:

- Step 1: "Which outcome matters most right now?"
- Step 2: "How fast do you respond to new leads?"
- Step 3: "Do you already have follow-up automated?"
- Step 4: contact details.
- Step 5: result/thank you with routing CTA.

Conditional routing:

- If wants quote or booking, route to `/assess/{niche}` with `preferredFamily=qualification`.
- If content/education interest, route to `/funnel/authority` or `/funnel/webinar`.
- If low readiness, route to lead magnet or mini-class.

### 3. Hot Lead Booking Box

Purpose: convert high-intent visitors before they drift.

Type: overlay or link-triggered modal.

Targeting:

- Pricing pages.
- Package pages.
- Offer pages.
- Returning visitors.
- Page views more than 2.

Fields:

- Name, email, phone, company, primary bottleneck.

CTA copy:

- "Book My Implementation Review"
- "Show Me the Fastest Launch Path"
- Avoid "Submit".

Webhook:

- `source=assessment` or `contact_form`
- `wantsBooking=true`
- `askingForQuote=true`
- `preferredFamily=qualification`
- `score=75` or higher.

### 4. Exit Intent Rescue Box

Purpose: recover visitors leaving high-value pages.

Type: overlay.

Targeting:

- Exit intent on package, pricing, offer, assessment, and calculator pages.
- Do not show to people who already submitted.

Offer:

- "Want the short version? Get the 3-step launch checklist."
- Or "Not ready to book? Get the buyer checklist."

Fields:

- Email only or first name + email.

Webhook:

- `source=exit_intent`
- `preferredFamily=rescue`
- `contentEngaged=true`

### 5. Webinar / Authority Box

Purpose: turn educational traffic into second-touch engagement.

Type: embedded large in blog/resource content and link-triggered overlay.

Steps:

- Step 1: choose topic.
- Step 2: email registration.
- Step 3: "Save my seat" / replay path.

Webhook:

- `source=webinar`
- `preferredFamily=webinar`
- `contentEngaged=true`

### 6. Returning Visitor Progressive Profile

Purpose: do not ask the same question twice. Move milestone 1 leads to milestone 2 or 3.

Targeting:

- Has seen lead magnet ConvertBox.
- Has visited with URL parameter from email/CRM, or identified by prior ConvertBox email submission.
- Page views or sessions more than 1.

Ask:

- If email known: ask role/company/bottleneck.
- If phone absent and booking intent is high: ask phone with a reason.
- If content engaged: ask whether they want checklist, assessment, or booking.

## Field Mapping For Lead OS

ConvertBox field/custom ID -> Lead OS field:

- `first_name` -> `firstName`
- `last_name` -> `lastName`
- `email` -> `email`
- `phone` -> `phone`
- `company` -> `company`
- `website` -> `metadata.website`
- `$referer` -> `metadata.referer`
- `campaign_name` -> `metadata.convertboxCampaign`
- `convertbox_name` -> `metadata.convertboxName`
- `convertbox_id` -> `metadata.convertboxId`
- `niche` -> `niche`
- `service` -> `service`
- `goal` -> `metadata.goalLabel`
- `preferred_family` -> `preferredFamily`
- `wants_booking` -> `wantsBooking`
- `asking_for_quote` -> `askingForQuote`
- `content_engaged` -> `contentEngaged`
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` -> `metadata`

If ConvertBox webhooks cannot transform field names directly, use a lightweight webhook bridge that receives ConvertBox JSON and forwards normalized JSON to Lead OS `/api/intake`.

## Funnel Best Practices To Apply

- Match friction to offer value:
  - Cold lead magnet: first name + email only.
  - Mid-funnel demo/assessment: name, email, company, role or bottleneck.
  - Bottom-funnel booking: add phone and urgency/use case.
- Use multi-step forms for high-value offers and qualification, with progress visible.
- Start with low-friction questions before personal/contact fields.
- Use single-column forms and one question per row.
- Put labels above fields; do not rely on placeholders alone.
- Use action-specific CTA text, not "Submit".
- Put privacy reassurance and trust proof near the CTA.
- Use hidden UTM/source fields wherever possible.
- Avoid aggressive CAPTCHA unless spam becomes a real issue.
- A/B test one variable at a time: headline, CTA, offer, trigger timing, or step order.
- Judge by lead-to-opportunity and booked-call rate, not only opt-in rate.

## First A/B Tests

1. Lead magnet headline:
   - A: "Get the 3-step Lead OS launch checklist"
   - B: "Find the fastest funnel to launch for your business"

2. Assessment first question:
   - A: "What outcome do you want first?"
   - B: "Where is revenue leaking right now?"

3. Booking CTA:
   - A: "Book My Implementation Review"
   - B: "Show Me the Fastest Launch Path"

4. Exit intent offer:
   - A: checklist
   - B: assessment result / diagnosis

5. Trigger:
   - A: time/scroll overlay
   - B: link-triggered modal from CTA button

## Implementation Sequence

1. Confirm the live domain where ConvertBox should be installed. Current account site is `funnelhacks.io`.
2. Confirm whether the site is WordPress. If yes, use ConvertBox plugin; otherwise install the header script.
3. Create/rename objective-based ConvertBox groups.
4. Build the global lead magnet box inactive.
5. Build the assessment box inactive.
6. Build a webhook bridge if Lead OS cannot accept ConvertBox's raw JSON shape.
7. Send ConvertBox test webhooks and verify Lead OS receives normalized payloads.
8. Activate only the lead magnet and assessment boxes.
9. Add booking and exit-intent boxes after baseline metrics exist.
10. Start cookied A/B tests after each box has enough traffic to measure.

## Open Decisions Needed Before Creating Boxes

- What domain should ConvertBox actually run on: `funnelhacks.io`, Lead OS hosted runtime, NeatCircle, Erie Pro, or another site?
- What is the primary offer for the first campaign: Lead OS as platform, speed-to-lead system, local-service lead engine, consultant authority funnel, or another package?
- Where should leads go today: Lead OS `/api/intake`, a CRM, email platform, Zapier, or all of the above?
- What booking URL should hot leads see?
- Which privacy policy URL should be linked from forms?
- Which niches should be first: general, home-services, coaching/consulting, tech/SaaS, legal, health, or another vertical?
