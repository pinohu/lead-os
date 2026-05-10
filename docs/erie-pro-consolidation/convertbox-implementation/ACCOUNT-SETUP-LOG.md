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

Each full funnel contains six native ConvertBox steps:

- `Choose request path`
- `Urgent details`
- `Free match details`
- `Project details`
- `Optional concierge offer`
- `Confirmation`

The opening step segments visitors with ConvertBox button actions:

- `Emergency or today`
- `Get matched free`
- `Plan a larger job`

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

## Important Implementation Note

No ConvertBox was activated.

Correction recorded after visual QA: the first save pass created form/text objects, but those objects used null element ids and therefore appeared as empty move/drop placeholders in the visual builder. The corrected pass assigns unique element ids to every editor element and button item. A later funnel pass replaced the shallow one-step capture boxes with native ConvertBox multi-step funnels using Erie.Pro branding, segmentation buttons, routed forms, hidden metadata, optional Concierge offer steps, and confirmation steps. A geography correction then replaced radius-based messaging with Erie County-focused copy. Render verification confirmed the visible editor now shows the Erie.Pro promise, headings, path buttons, fields, and CTA buttons.

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
