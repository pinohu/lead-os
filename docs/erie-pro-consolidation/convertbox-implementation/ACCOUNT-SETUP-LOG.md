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

The following inactive ConvertBoxes were created and then fully populated with designed content, form fields, and non-live trigger settings:

- `EP-03 Service - Fast Quote - v1`
  - Group: `Erie.Pro - Core`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Fields: `full_name`, `phone`, `email`, `project_details`
  - Trigger configured: 45% scroll

- `EP-02 Emergency - Callback Request - v1`
  - Group: `Erie.Pro - Service Families`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Fields: `full_name`, `phone`, `emergency_details`
  - Trigger configured: immediate

- `EP-04 Pricing - Cost Confidence - v1`
  - Group: `Erie.Pro - Research Nurture`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Fields: `email`, `phone`, `cost_question`
  - Trigger configured: inactivity

- `EP-01 Visitor - Service Finder - v1`
  - Group: `Erie.Pro - Core`
  - Type: Sticky Bar
  - Status: inactive designed draft
  - Fields: `full_name`, `email`, `phone`, `service_need`
  - Trigger configured: delayed

- `EP-05 Project - Planner - v1`
  - Group: `Erie.Pro - Service Families`
  - Type: Center Modal
  - Status: inactive designed draft
  - Fields: `full_name`, `email`, `phone`, `project_scope`
  - Trigger configured: 55% scroll

- `EP-06 Appointment - Professional Services - v1`
  - Group: `Erie.Pro - Service Families`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Fields: `full_name`, `phone`, `email`, `appointment_notes`
  - Trigger configured: delayed

- `EP-07 Research - Checklist Capture - v1`
  - Group: `Erie.Pro - Research Nurture`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Fields: `email`, `checklist_topic`
  - Trigger configured: 65% scroll

- `EP-08 Provider - Claim Territory - v1`
  - Group: `Erie.Pro - Provider Acquisition`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Fields: `business_name`, `full_name`, `email`, `phone`, `territory_services`
  - Trigger configured: delayed

- `EP-09 Exit - Quote Rescue - v1`
  - Group: `Erie.Pro - Core`
  - Type: Center Modal
  - Status: inactive designed draft
  - Fields: `email`, `phone`, `stuck_reason`
  - Trigger configured: exit intent

- `EP-10 Returning - Resume Request - v1`
  - Group: `Erie.Pro - Core`
  - Type: Callout Modal
  - Status: inactive designed draft
  - Fields: `full_name`, `email`, `phone`, `resume_context`
  - Trigger configured: delayed

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

## Important Implementation Note

No ConvertBox was activated.

The visual editor opened successfully, but the builder uses a drag-and-drop canvas and normal browser text-fill automation intermittently failed on text entry with the in-browser clipboard layer. To avoid leaving blank shells, the completed designs were written through ConvertBox's authenticated editor save endpoint using the same structured JSON schema the builder saves.

To protect Erie.Pro user experience, the boxes were left inactive. They are designed and fielded, but should not be activated until final mobile/desktop preview and test submissions are reviewed.

The account is now ready for the next setup pass: final preview QA, integration/webhook mapping, URL targeting refinement inside the visual targeting UI, and test submissions from `IMPLEMENTATION-PACK.md` and `CAMPAIGN-BUILD-SHEET.csv`.

Do not publish a ConvertBox until it has:

- clear headline and body copy
- the correct fields for its intent
- display trigger rules
- URL targeting rules
- mobile review
- close and submit suppression
- test submission verification
