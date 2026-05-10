# ConvertBox Account Setup Log

Date: 2026-05-10

## Site

Selected ConvertBox site:

- `erie.pro`

ConvertBox site id observed in the dashboard URL:

- `8358`

## Groups Created

The following groups were created in the `erie.pro` ConvertBox site:

- `Erie.Pro - Core`
- `Erie.Pro - Service Families`
- `Erie.Pro - Provider Acquisition`
- `Erie.Pro - Research Nurture`
- `Erie.Pro - QA Drafts`

## Designed ConvertBoxes Created

The following inactive ConvertBoxes were created and then fully populated with render-verified Erie.Pro-themed funnel content, form fields, hidden metadata fields, multi-step routing, visitor-safe trigger settings, profile/teaser settings where appropriate, and URL targeting rules.

Each ConvertBox now uses Erie.Pro brand positioning and colors:

- Promise: `One pro. No bidding. Always Erie.`
- Geography: Erie County focused; avoid radius-based geography copy in ConvertBox messaging.
- Primary action color: Erie Red `#C8102E`
- Trust/heading color: Bayfront Blue `#1F3A5F`
- Support text: Steel Gray `#4A4A4A`

Each full funnel contains six native ConvertBox steps. These names are written for the visitor inside the ConvertBox builder, not for developer documentation:

- `How can we help?`
- `Tell us what happened`
- `Tell us what you need`
- `Tell us about the project`
- `Want extra help?`
- `You are all set`

The opening step segments visitors with ConvertBox button actions:

- `I need help today`
- `Find me a local pro`
- `I am planning a project`

The button actions store path metadata through ConvertBox custom field settings where supported, and the downstream form steps add hidden fields for `ep_convertbox_id`, `ep_intent`, `ep_family`, and `ep_urgency`.

- `EP-03 Service - Fast Quote - v1`
  - Group: `Erie.Pro - Core`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Visible fields: `full_name`, `phone`, `email`, `project_details`
  - Hidden fields: `ep_convertbox_id`, `ep_intent`, `ep_family`
  - Trigger configured: 45% scroll
  - URL targeting: URLs containing `/services`, `/service`, `/quote`
  - Features: profile enabled, teaser enabled, six-step routed funnel, optional Concierge offer

- `EP-02 Emergency - Callback Request - v1`
  - Group: `Erie.Pro - Service Families`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Visible fields: `full_name`, `phone`, `emergency_details`
  - Hidden fields: `ep_convertbox_id`, `ep_intent`, `ep_family`
  - Trigger configured: immediate
  - URL targeting: emergency and high-intent trade pages
  - Features: profile enabled, teaser enabled, six-step routed funnel, optional Concierge offer

- `EP-04 Pricing - Cost Confidence - v1`
  - Group: `Erie.Pro - Research Nurture`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Visible fields: `email`, `phone`, `cost_question`
  - Hidden fields: `ep_convertbox_id`, `ep_intent`, `ep_family`
  - Trigger configured: inactivity
  - URL targeting: pricing, cost, service research pages
  - Features: profile enabled, teaser enabled, six-step routed funnel, optional Concierge offer

- `EP-01 Visitor - Service Finder - v1`
  - Group: `Erie.Pro - Core`
  - Type: Sticky Bar
  - Status: inactive designed draft
  - Visible fields: `full_name`, `email`, `phone`, `service_need`
  - Hidden fields: `ep_convertbox_id`, `ep_intent`, `ep_family`
  - Trigger configured: delayed
  - URL targeting: homepage and service category pages
  - Features: six-step routed funnel, optional Concierge offer

- `EP-05 Project - Planner - v1`
  - Group: `Erie.Pro - Service Families`
  - Type: Center Modal
  - Status: inactive designed draft
  - Visible fields: `full_name`, `email`, `phone`, `project_scope`
  - Hidden fields: `ep_convertbox_id`, `ep_intent`, `ep_family`
  - Trigger configured: 55% scroll
  - URL targeting: project, renovation, installation, construction pages
  - Features: profile enabled, six-step routed funnel, optional Concierge offer

- `EP-06 Appointment - Professional Services - v1`
  - Group: `Erie.Pro - Service Families`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Visible fields: `full_name`, `phone`, `email`, `appointment_notes`
  - Hidden fields: `ep_convertbox_id`, `ep_intent`, `ep_family`
  - Trigger configured: delayed
  - URL targeting: appointment, consultation, professional service pages
  - Features: profile enabled, teaser enabled, six-step routed funnel, optional Concierge offer

- `EP-07 Research - Checklist Capture - v1`
  - Group: `Erie.Pro - Research Nurture`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Visible fields: `email`, `checklist_topic`
  - Hidden fields: `ep_convertbox_id`, `ep_intent`, `ep_family`
  - Trigger configured: 65% scroll
  - URL targeting: guide, checklist, learning, blog, service pages
  - Features: profile enabled, teaser enabled, six-step routed funnel, optional Concierge offer

- `EP-08 Provider - Claim Territory - v1`
  - Group: `Erie.Pro - Provider Acquisition`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Visible fields: `business_name`, `full_name`, `email`, `phone`, `territory_services`
  - Hidden fields: `ep_convertbox_id`, `ep_intent`, `ep_family`
  - Trigger configured: delayed
  - URL targeting: provider, partner, join, professional pages
  - Features: profile enabled, teaser enabled, six-step routed funnel, optional provider-claim routing

- `EP-09 Exit - Quote Rescue - v1`
  - Group: `Erie.Pro - Core`
  - Type: Center Modal
  - Status: inactive designed draft
  - Visible fields: `email`, `phone`, `stuck_reason`
  - Hidden fields: `ep_convertbox_id`, `ep_intent`, `ep_family`
  - Trigger configured: exit intent
  - URL targeting: service, quote, pricing pages
  - Features: profile enabled, six-step routed funnel, optional Concierge offer

- `EP-10 Returning - Resume Request - v1`
  - Group: `Erie.Pro - Core`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Visible fields: `full_name`, `email`, `phone`, `resume_context`
  - Hidden fields: `ep_convertbox_id`, `ep_intent`, `ep_family`
  - Trigger configured: delayed
  - URL targeting: service, quote, request pages
  - Features: profile enabled, teaser enabled, six-step routed funnel, optional Concierge offer

## Dashboard Count Verification

The ConvertBox dashboard showed:

- `Erie.Pro - Core`: 4 ConvertBoxes, 0 active.
- `Erie.Pro - Service Families`: 3 ConvertBoxes, 0 active.
- `Erie.Pro - Research Nurture`: 2 ConvertBoxes, 0 active.
- `Erie.Pro - Provider Acquisition`: 1 ConvertBox, 0 active.
- `Erie.Pro - QA Drafts`: 0 ConvertBoxes, 0 active.

Total configured designs:

- 10 ConvertBoxes.
- 0 active.
- 10 ConvertBoxes with real editor elements.
- 10 ConvertBoxes with forms.
- 10 ConvertBoxes with no null editor element ids.
- 10 ConvertBoxes with six native funnel steps.
- 10 ConvertBoxes with button-based path segmentation.
- 10 ConvertBoxes with three routed form paths: urgent, free match, and project.
- 10 ConvertBoxes with optional Concierge offer step before confirmation.
- 10 ConvertBoxes with hidden metadata fields for routing attribution.
- 10 ConvertBoxes with `specific_pages` URL targeting and privacy/terms/admin exclusions.
- 10 ConvertBoxes themed with Erie.Pro's red, blue, gray, and local trust promise.
- 10 ConvertBoxes with the ConvertBox step onboarding flag disabled so the visual Steps panel shows the real six-step funnel instead of the default `Start creating steps` prompt.

## Important Implementation Note

No ConvertBox was activated.

Correction recorded after visual QA: the first save pass created form/text objects, but those objects used null element ids and therefore appeared as empty move/drop placeholders in the visual builder. The corrected pass assigns unique element ids to every editor element and button item. A later funnel pass replaced the shallow one-step capture boxes with native ConvertBox multi-step funnels using Erie.Pro branding, segmentation buttons, routed forms, hidden metadata, optional Concierge offer steps, and confirmation steps. A geography correction then replaced radius-based messaging with Erie County-focused copy.

Second correction recorded after visual QA: ConvertBox still had `meta.steps_introduction` enabled, which caused the visual Steps drawer to show the default onboarding prompt instead of the six configured steps. That flag has now been disabled on all 10 Erie.Pro ConvertBoxes. The visual editor was verified showing the real step list: `How can we help?`, `Tell us what happened`, `Tell us what you need`, `Tell us about the project`, `Want extra help?`, and `You are all set`.

The same pass rewrote developer-facing explanatory text into visitor-facing customer copy. The boxes now speak to the person requesting help, for example: `Need help from a trusted Erie County pro?`, `Tell us what you need. We will match you with one local pro, not a list of companies chasing the same job.`, and `Private until you say yes. One vetted local pro serving Erie County.`

Third correction recorded after service-fit review: the 10 inactive ConvertBoxes now prove the technical configuration, but their visitor copy is still too generic for Erie.Pro's 112-service catalog. They should not be treated as final production funnels until the service-aware copy and questions in `SERVICE-AWARE-FLOW-COPY.md` are applied. The final production direction is family-specific and service-aware: plumbing should ask leak/drain/water-heater questions, roadside should ask location and vehicle status, health services should use private appointment language, funeral-home flows should use gentle non-promotional copy, and seasonal Erie services should reference timing, storm context, and property type.

Fourth correction recorded before further ConvertBox account edits: `BOX-EXPERIENCE-AUDIT.md` audits all 10 current draft boxes across design, psychology, conversion flow, and journey fit. That audit is the go/no-go gate for the next account pass.

Fifth correction recorded after applying the audit findings: the 10 inactive ConvertBox drafts were updated in the ConvertBox account as service-aware draft previews. All 10 saved successfully through the authenticated ConvertBox API, and verification read the updated names, step labels, `ep_service_aware_preview=true`, service-family metadata, and Erie County copy back from the account. The boxes remain inactive (`active=false` verified on box `232597`; all updates preserved inactive draft-preview intent).

Updated draft-preview mapping:

- `232597`: `EP-F01 Emergency Home Response - Draft Preview`
- `232595`: `EP-F01 Emergency Home Response - Draft Preview`
- `232594`: `EP-F04 Cleaning And Turnover - Draft Preview`
- `232596`: `EP-F02 Planned Home Projects - Draft Preview`
- `232598`: `EP-F02 Planned Home Projects - Draft Preview`
- `232599`: `EP-F07 Health And Wellness Appointments - Draft Preview`
- `232600`: `EP-F08 Professional Legal And Financial - Draft Preview`
- `232601`: `EP-F09 Provider Territory Claim - Draft Preview`
- `232602`: `EP-F10 Returning And Exit Rescue - Draft Preview`
- `232603`: `EP-F10 Returning And Exit Rescue - Draft Preview`

Sixth correction recorded after reviewing shared ConvertBox design `https://app.convertbox.com/share/SE6OC2LI`: the useful lessons from that design were applied to the inactive Erie.Pro draft previews without copying the ecommerce pressure style. The applied lessons are:

- choice-first branching before contact fields
- a meaningful `not sure / not ready / save or ask a question` path instead of dead-end declines
- progressive commitment: clarify service context first, contact details later
- service-family-specific first choices and confirmation language
- softer alternate paths for sensitive health, funeral, legal, financial, and senior-care contexts
- draft metadata `ep_branching_lessons_applied=true` and `ep_branching_lesson_source=https://app.convertbox.com/share/SE6OC2LI`

All 10 boxes saved successfully and verified as `active=false`.

Seventh correction recorded after visual-system pass: professional visual elements were applied to all 10 inactive draft previews. The pass added service-family labels, trust rows, family-specific accent colors, profile titles, and teaser labels. Verification confirmed `ep_professional_visual_system_applied=true`, `active=false`, a saved visual label, and trust-row markup on all 10 boxes.

Visual labels now include:

- `Urgent Erie County Help`
- `Project Planning`
- `Cleaning, Moving, And Turnover`
- `Private Appointment Request`
- `Professional Consultation`
- `Provider Category Review`
- `Finish Or Save Your Request`

Eighth correction recorded after profile-photo QA: the prior visual pass enabled profile and teaser labels but left `profile.photo` and `teaser.photo` as `null`. Seven Erie.Pro family avatar SVGs were uploaded to the ConvertBox image library and assigned to both profile and teaser photo fields across all 10 inactive draft previews. Verification confirmed `ep_profile_photos_applied=true`, `active=false`, non-null `profile.photo`, non-null `teaser.photo`, and `teaser.icon=none` on all 10 boxes.

Uploaded avatar assets:

- `erie-pro-emergency-home-response.svg`
- `erie-pro-cleaning-and-turnover.svg`
- `erie-pro-planned-home-projects.svg`
- `erie-pro-health-and-wellness-appointments.svg`
- `erie-pro-professional-legal-and-financial.svg`
- `erie-pro-provider-territory-claim.svg`
- `erie-pro-returning-and-exit-rescue.svg`

Ninth correction recorded after full-box audit: `FULL-BOX-AUDIT-2026-05-10.md` was generated from fresh authenticated ConvertBox API snapshots. The audit found one UX issue in seven boxes: the visual/icon pass had weakened the explicit `not sure / help me choose` fallback path on the first screen. Those seven boxes were corrected, snapshots were refreshed, and the audit now reports zero JSON-level structural issues across all 10 drafts. The boxes are still not approved for activation until visual/mobile preview and test submissions are completed.

Tenth correction recorded after persona-fit review: the earlier `six steps for every box` assumption was removed. Step counts are now driven by persona mental model, urgency, sensitivity, and complexity. Emergency and health flows were shortened, exit/return rescue was made very short, provider claim remains moderately guided, and planned project flows were expanded for comprehensive scoping. The refreshed audit now checks expected persona-fit step counts instead of uniform six-step counts and reports zero JSON-level structural issues.

Eleventh correction recorded after visual-editor QA: the earlier visual pass used bracketed pseudo-icon text such as `[home]`, `[brief]`, and `[phone]` inside choice labels. ConvertBox rendered those tokens literally, so they looked like unfinished placeholder copy instead of professional icons. Those pseudo-icons have now been stripped from all 10 inactive draft boxes, the snapshots were refreshed, and the audit reports zero JSON-level structural issues. Future icon work must use actual ConvertBox image/icon elements or approved uploaded assets, never bracketed text tokens in customer-facing copy.

Twelfth correction recorded after persona-copy audit: the 10 inactive draft boxes were rewritten so the visible copy speaks to visitors instead of exposing internal funnel labels. Stiff taxonomy such as `Provider Territory Claim`, `Returning And Exit Rescue`, `Emergency Home Response`, `Professional Legal And Financial`, and `Health And Wellness Appointments` was removed from visible box text and preserved only in metadata/box names where needed for operations. The rewrite also replaced `One routed path` with visitor-friendly trust chips, softened sensitive-service language, made provider copy benefit-led, and changed several category buttons into action-oriented visitor choices. Fresh snapshots were saved and the JSON audit reports zero structural/copy issues.

Thirteenth correction recorded after full-system planning: `MASTER-112-SERVICE-CONVERTBOX-PLAN.md` now defines the complete rollout architecture for all 112 live Erie.Pro services and their subservice branches. It covers ConvertBox feature usage, funnel doctrine, campaign groups, core templates, family blueprints, page-context rules, display/suppression rules, data/routing fields, A/B testing, analytics, service expansion requirements, build phases, QA gates, and activation guardrails. This is now the master planning document for extrapolating from the 10 prototype boxes into a full service-aware ConvertBox system.

Fourteenth correction recorded after implementation-data generation: `ERIE-CONVERTBOX-112-SERVICE-MATRIX.json` and `ERIE-CONVERTBOX-112-SERVICE-MATRIX.md` now translate the master plan into service-specific ConvertBox implementation data for all 112 live Erie.Pro services. The matrix includes each service's family, template, urgency, persona, service context, subservice intents, first-step copy, button branches, qualifying fields, page targets, suppression/display strategy, metadata routing, payload fields, QA requirements, and A/B hypotheses. Coverage checks confirm 112 services, 0 missing branch sets, 0 missing field sets, 0 missing subservice-intent sets, and 0 missing target sets.

The visual editor opened successfully, but the builder uses a drag-and-drop canvas and normal browser text-fill automation intermittently failed on text entry with the in-browser clipboard layer. To avoid leaving blank shells, the completed designs were written through ConvertBox's authenticated editor save endpoint using the same structured JSON schema the builder saves.

To protect Erie.Pro user experience, the boxes were left inactive. They are designed and fielded, but should not be activated until final mobile/desktop preview and test submissions are reviewed.

The account is now ready for the next setup pass: final mobile/desktop preview QA, integration/webhook mapping, and test submissions from `IMPLEMENTATION-PACK.md` and `CAMPAIGN-BUILD-SHEET.csv`.

Do not publish a ConvertBox until it has:

- clear headline and body copy
- the correct fields for its intent
- display trigger rules
- URL targeting rules
- mobile review
- close and submit suppression
- test submission verification
