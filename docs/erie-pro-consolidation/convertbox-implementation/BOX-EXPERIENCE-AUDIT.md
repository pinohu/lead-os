# Erie.Pro ConvertBox Box Experience Audit

Date: 2026-05-10

Scope: audit the 10 inactive Erie.Pro ConvertBox drafts before applying any further account changes.

Verdict: the boxes are not ready for activation. They prove mechanics, but they do not yet deliver the service-specific customer journey Erie.Pro needs.

Update after audit application: the findings in this document have now been applied to the existing inactive ConvertBox drafts as draft previews. They are visible in the ConvertBox account under service-family names such as `EP-F01 Emergency Home Response - Draft Preview`, `EP-F07 Health And Wellness Appointments - Draft Preview`, and `EP-F10 Returning And Exit Rescue - Draft Preview`. This does not change the launch verdict: preview is allowed, activation still requires visual/mobile QA and test submissions.

Update after reviewing shared ConvertBox design `SE6OC2LI`: the Erie.Pro draft previews now also include the useful structural lessons from that design. The ecommerce urgency, countdown, and pressure style were intentionally not copied. The adopted pattern is: easy first choice, branched follow-up, useful alternate path when the visitor declines or is unsure, and contact details only after the service context is clear.

## Audit Criteria

Each box is audited across four dimensions:

- Design: visual fit, hierarchy, clarity, mobile suitability, Erie.Pro theme use.
- Psychology: whether the message matches the visitor's emotional state.
- Conversion flow: whether the steps ask the right questions in the right order.
- Journey fit: whether the box helps instead of interrupting the page experience.

## System-Level Findings

### 1. Generic First Step

The current first-step pattern is still too broad. `How can we help?` is friendly, but it does not prove Erie.Pro understands the page the visitor is on.

Better pattern:

- Plumbing page: `What plumbing issue are you dealing with?`
- Snow removal page: `Do you need storm help or a seasonal snow plan?`
- Mental health page: `What kind of appointment support are you looking for?`
- Funeral homes page: `How can we help you plan the next step?`

### 2. The Boxes Need Family-Specific Branching

The current 10 boxes group visitors by broad conversion goal. Erie.Pro needs grouping by service family and visitor intent:

- Emergency home response
- Planned home projects
- Seasonal Erie services
- Cleaning and turnover
- Pest and environmental
- Auto, roadside, and marine
- Health and wellness appointments
- Professional, legal, and financial
- Provider territory claim
- Exit and return rescue

### 3. CTA Language Needs More Service Context

Some CTAs are safe but bland:

- `Send my request`
- `Find me a local pro`
- `Send project details`

They should often become:

- `Send urgent plumbing request`
- `Check snow help availability`
- `Request a private appointment`
- `Start my project match`
- `Check my service category`

### 4. Concierge Offer Must Be Contextual

The optional Concierge step should not appear the same way for every service. It is useful for complex or time-consuming needs, but can feel odd on sensitive services.

Good fit:

- remodeling
- roofing
- estate sale services
- property management
- vacation rental turnover
- commercial snow removal

Use caution:

- mental health counseling
- funeral homes
- urgent locksmith
- emergency roadside
- veterinary urgent care

### 5. Visual Theme Should Be More Than Colors

The boxes use Erie.Pro red, blue, and gray, but final production should also borrow Erie.Pro's product language:

- `One pro. No bidding. Always Erie.`
- privacy before matching
- Erie County communities
- local verification
- calm, professional, low-friction tone

The design should feel like a compact Erie.Pro concierge, not a generic popup with Erie.Pro colors.

## Box 1: EP-01 Visitor - Service Finder - v1

Current purpose:
Broad service finder for homepage, services, directory, and area pages.

Design audit:
- Strength: useful as a low-pressure entry point on broad pages.
- Weakness: a sticky bar can become visual noise if it appears before the user has explored.
- Weakness: the current generic copy does not explain why using the box is faster than the native service search/form.

Psychology audit:
- Visitor state: unsure, browsing, not ready for a form.
- Current mismatch: asks for help before showing enough context.
- Needed feeling: "This will quickly point me to the right path without committing me."

Conversion-flow audit:
- Should not ask contact info immediately.
- Should ask one service-discovery question first:
  - `What kind of help are you looking for?`
  - `Is this for your home, vehicle, pet/health, business, property, or an appointment?`
- Then branch into family-specific copy.

Journey audit:
- Best placement: homepage after scroll, `/services`, `/directory`, `/areas`.
- Avoid: service pages where the page already identifies the service.

Recommended redesign:
- Convert from a generic service finder into a true service-family router.
- Step 1 buttons:
  - `Home or property`
  - `Vehicle or roadside`
  - `Health or appointment`
  - `Business or professional`
  - `Not sure yet`
- Step 2 should show family-specific subchoices.

Activation verdict:
Do not activate until it routes to service families and does not compete with native search.

## Box 2: EP-02 Emergency - Callback Request - v1

Current purpose:
Urgent callback flow for emergency/high-intent service pages.

Design audit:
- Strength: emergency flows are a strong ConvertBox use case.
- Weakness: a generic emergency box cannot cover plumbing, electrical, towing, locksmith, septic, tree, restoration, and snow with the same first question.
- Weakness: visual hierarchy should emphasize phone-first action and shortest path.

Psychology audit:
- Visitor state: stressed, rushed, sometimes worried about damage or safety.
- Current mismatch: generic urgent language can feel like a form instead of help.
- Needed feeling: "This is the fastest safe next step."

Conversion-flow audit:
- First question must identify the emergency type, not just collect a description.
- Good emergency first-step options:
  - `Water leak or backup`
  - `No heat or no cooling`
  - `Electrical hazard`
  - `Locked out`
  - `Vehicle disabled`
  - `Storm or property damage`
  - `Snow or ice help`
- Contact fields should be minimal: phone, zip/community, issue.

Journey audit:
- Best placement: emergency pages, direct CTA clicks, return visitors, exit intent on urgent pages.
- Avoid: sensitive health pages unless the provider inventory truly supports urgent response.

Recommended redesign:
- Rename production family box to `EP-F01 Emergency Home Response - v1`.
- Add path-specific steps:
  - Plumbing: active leak, water shut off, sewer backup.
  - HVAC: no heat/no cooling, vulnerable occupants optional.
  - Electrical: sparks/smell/exposed wire.
  - Locksmith/towing: current location first.

Activation verdict:
High priority, but not until service-specific triage is implemented.

## Box 3: EP-03 Service - Fast Quote - v1

Current purpose:
General quote request for service pages, provider pages, and directory pages.

Design audit:
- Strength: strongest general lead-capture use case.
- Weakness: `fast quote` language is not right for every Erie.Pro service.
- Weakness: quote framing is wrong for mental health, funeral homes, legal, medical appointments, senior care, and some financial services.

Psychology audit:
- Visitor state: high intent but still evaluating.
- Current mismatch: assumes quote intent even when the visitor may need an appointment, consultation, inspection, or discreet help.
- Needed feeling: "This request is tailored enough that I won't waste time."

Conversion-flow audit:
- Should branch by page family before showing form fields.
- For home services: quote fields make sense.
- For appointment services: preferred date/time and reason for visit matter more than project description.
- For professional services: matter type/deadline matters more than "job details."

Journey audit:
- Best placement: commodity and home-service pages after scroll or CTA click.
- Avoid: health, funeral, and sensitive professional pages unless reworded.

Recommended redesign:
- Split into several family boxes:
  - `EP-F04 Cleaning And Turnover - v1`
  - `EP-F05 Pest And Environmental - v1`
  - `EP-F06 Auto Roadside And Marine - v1`
  - `EP-F07 Health And Wellness Appointments - v1`
  - `EP-F08 Professional Legal And Financial - v1`

Activation verdict:
Do not activate as a universal fast-quote box.

## Box 4: EP-04 Pricing - Cost Confidence - v1

Current purpose:
Pricing/cost comparison support for cost, pricing, and compare pages.

Design audit:
- Strength: good fit for research-stage visitors.
- Weakness: cost helper can feel thin unless it asks the cost drivers for that service.
- Weakness: visual treatment should feel like a calculator/guide, not a lead form.

Psychology audit:
- Visitor state: uncertain, price-sensitive, comparing options.
- Current mismatch: generic pricing help does not build much trust.
- Needed feeling: "I understand what changes the price before talking to anyone."

Conversion-flow audit:
- Needs family-specific cost drivers:
  - Roofing: leak vs replacement, roof age, material, insurance claim.
  - Cleaning: rooms/square footage/frequency.
  - Snow: property type, one-time vs seasonal, salting.
  - Legal: practice area and consultation type, not price estimate.
  - Funeral: planning type, gentle language, no hard conversion pressure.

Journey audit:
- Best placement: `/pricing`, `/costs`, `/compare`.
- Avoid: immediate display before the visitor reads pricing context.

Recommended redesign:
- Keep as a research/support layer, but make it family-specific.
- For sensitive categories, rename to appointment/consultation clarity instead of pricing.

Activation verdict:
Useful, but only after service-specific cost drivers are built.

## Box 5: EP-05 Project - Planner - v1

Current purpose:
Planned project support for remodeling, construction, solar, concrete, flooring, kitchen, bath, basement, siding, and decks.

Design audit:
- Strength: one of the best Erie.Pro ConvertBox concepts.
- Weakness: should look more consultative and project-oriented than a basic lead form.
- Weakness: needs step labels that reflect project planning stages.

Psychology audit:
- Visitor state: considering a costly project; may be anxious about scope, budget, disruption, and trust.
- Current mismatch: too little evidence that Erie.Pro understands project complexity.
- Needed feeling: "This will help the first estimate conversation be more useful."

Conversion-flow audit:
- Strong step order:
  1. Project type
  2. Stage of planning
  3. Scope/size
  4. Timing/budget comfort
  5. Contact
  6. Confirmation
- Must change questions by service:
  - kitchen: cabinets, countertops, layout, full/partial.
  - bathroom: shower/tub, tile, vanity, accessibility.
  - concrete/decks: dimensions, repair vs new, material.
  - solar/EV/generator: electrical capacity and property type.

Journey audit:
- Best placement: project service pages, pricing pages, guides, checklist pages.
- Good fit for Concierge offer.

Recommended redesign:
- Rename to `EP-F02 Planned Home Projects - v1`.
- Build service-specific button groups inside first step or duplicate by URL cluster.

Activation verdict:
High-value, but needs project-family branching first.

## Box 6: EP-06 Appointment - Professional Services - v1

Current purpose:
Appointment and professional-service request flow.

Design audit:
- Strength: right concept for health, legal, finance, care, and professional categories.
- Weakness: grouping all professional and health services together creates tone problems.
- Weakness: visual language should be calmer and more private than contractor boxes.

Psychology audit:
- Visitor state varies sharply:
  - health visitor wants privacy and access.
  - legal visitor wants confidentiality and urgency.
  - funeral visitor may be grieving.
  - financial visitor wants trust and competence.
- Current mismatch: too generic and too close to home-service wording.

Conversion-flow audit:
- Should split into at least two production boxes:
  - Health and wellness appointments.
  - Professional, legal, and financial consultations.
- Sensitive categories need softer confirmation copy.
- Avoid asking for detailed legal/medical/financial facts inside ConvertBox.

Journey audit:
- Best placement: health and professional service pages after page engagement or CTA click.
- Avoid: aggressive exit-intent on funeral and mental health pages.

Recommended redesign:
- Rename health flow to `EP-F07 Health And Wellness Appointments - v1`.
- Rename consultation flow to `EP-F08 Professional Legal And Financial - v1`.
- Use privacy-safe summary fields.

Activation verdict:
Do not activate in current general form.

## Box 7: EP-07 Research - Checklist Capture - v1

Current purpose:
Soft capture on guide, checklist, learning, blog, and research pages.

Design audit:
- Strength: lower-friction and less intrusive.
- Weakness: a generic checklist offer will underperform unless the checklist is clearly service-specific.
- Weakness: email-first capture should feel useful before asking for contact.

Psychology audit:
- Visitor state: researching, cautious, not ready for a provider.
- Current mismatch: generic checklist can feel like a thin lead magnet.
- Needed feeling: "This will help me make a better decision without pressure."

Conversion-flow audit:
- Must align the asset with the page:
  - `Roof replacement checklist`
  - `Snow contract questions`
  - `Estate sale planning checklist`
  - `Mental health appointment preparation guide`
  - `Kitchen remodel scope planner`
- Ask email only after naming the specific asset.

Journey audit:
- Best placement: guide/checklist/blog pages after high scroll depth.
- Avoid: emergency pages.

Recommended redesign:
- Keep as a support layer, not the first activation.
- Build checklist copy by service family.

Activation verdict:
Good later-stage nurture asset; not a first launch priority.

## Box 8: EP-08 Provider - Claim Territory - v1

Current purpose:
Provider acquisition and territory claim.

Design audit:
- Strength: clear business-side intent.
- Weakness: should not feel like the same consumer matching flow.
- Weakness: needs provider-specific proof, scarcity, and category clarity.

Psychology audit:
- Visitor state: business owner evaluating ROI, skepticism, exclusivity, and time required.
- Current mismatch: if too generic, it does not answer "why should I claim this?"
- Needed feeling: "This category may be valuable and the next step is low effort."

Conversion-flow audit:
- First step should check:
  - service category
  - communities served
  - response speed
  - claim existing profile vs new provider
- Should avoid overpromising exclusivity before verifying inventory.

Journey audit:
- Best placement: `/pros`, `/for-business`, claim pages, provider profiles.
- Avoid: consumer service request pages.

Recommended redesign:
- Rename to `EP-F09 Provider Territory Claim - v1`.
- Add category availability framing.

Activation verdict:
Useful once provider intake routing is ready.

## Box 9: EP-09 Exit - Quote Rescue - v1

Current purpose:
Recover abandoning visitors on service, pricing, provider, and compare pages.

Design audit:
- Strength: exit intent is appropriate when used carefully.
- Weakness: can feel desperate if generic.
- Weakness: should reflect why the visitor is stuck.

Psychology audit:
- Visitor state: uncertain, comparison-shopping, not convinced, or interrupted.
- Current mismatch: "before you go" style copy is too broad.
- Needed feeling: "I can finish this quickly or get a simpler next step."

Conversion-flow audit:
- First step should ask:
  - `Still comparing prices?`
  - `Not sure which service fits?`
  - `Need help today?`
  - `Want to save this for later?`
- For sensitive pages, avoid pressure.

Journey audit:
- Best placement: high-intent service, pricing, provider, and compare pages.
- Avoid: health/funeral/mental health pages unless copy is gentle and non-intrusive.

Recommended redesign:
- Merge into `EP-F10 Returning And Exit Rescue - v1`.
- Use family-specific rescue copy based on URL.

Activation verdict:
Activate last, after core family boxes are working.

## Box 10: EP-10 Returning - Resume Request - v1

Current purpose:
Help returning high-intent visitors continue a prior request.

Design audit:
- Strength: good user experience if it remembers page context.
- Weakness: generic resume copy is weak without service/page recognition.
- Weakness: should look like a helpful continuation, not a fresh popup.

Psychology audit:
- Visitor state: already aware, maybe comparing, ready to continue.
- Current mismatch: generic "resume request" does not show memory or relevance.
- Needed feeling: "Erie.Pro remembers what I was trying to solve."

Conversion-flow audit:
- Should infer likely service from current or prior page.
- Good copy:
  - `Still looking for snow help?`
  - `Want to finish your roofing request?`
  - `Need to pick up your appointment request?`
- Fields should be minimal: contact and one context field.

Journey audit:
- Best placement: returning visitors on service/pricing/provider pages.
- Avoid: first-time visitors and broad pages.

Recommended redesign:
- Merge with exit rescue as `EP-F10 Returning And Exit Rescue - v1`.
- Use service-family context in headline.

Activation verdict:
Useful, but only after service-family targeting and suppression rules are reliable.

## Priority Rebuild Order

1. `EP-F01 Emergency Home Response - v1`
2. `EP-F03 Seasonal Erie Services - v1`
3. `EP-F04 Cleaning And Turnover - v1`
4. `EP-F02 Planned Home Projects - v1`
5. `EP-F07 Health And Wellness Appointments - v1`
6. `EP-F08 Professional Legal And Financial - v1`
7. `EP-F05 Pest And Environmental - v1`
8. `EP-F06 Auto Roadside And Marine - v1`
9. `EP-F09 Provider Territory Claim - v1`
10. `EP-F10 Returning And Exit Rescue - v1`

## Go/No-Go Checklist Before Editing ConvertBox

Do not edit or activate a box until its replacement spec has:

- service-family-specific headline
- service-family-specific first triage question
- page URL targeting list
- CTA labels that match the service context
- step labels that sound like customer language
- hidden metadata fields for service family, service slug, intent, and urgency
- privacy-safe wording for health, legal, financial, funeral, and senior-care services
- suppression rules that prevent overload
- mobile layout reviewed
- Concierge step reviewed for whether it helps or harms that service context

## Final Audit Verdict

The existing 10 ConvertBoxes are useful as a technical base, but not as customer-ready Erie.Pro funnels.

The correct next action is not to polish the generic copy. The correct next action is to rebuild the production set around service-aware family templates, then duplicate or specialize where service psychology demands it.
