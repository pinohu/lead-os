# Erie.Pro ConvertBox Launch Checklist

Use this checklist when moving from plan to live ConvertBox configuration.

## Preflight

- Confirm ConvertBox has an `Erie.Pro` site using `erie.pro` and `www.erie.pro`.
- Confirm the ConvertBox script or WordPress/plugin equivalent is installed once on Erie.Pro.
- Confirm the script loads on production pages and not on admin or preview-only routes.
- Confirm the current live service count is 112.
- Confirm each service is represented in `SERVICE-FAMILY-MAP.csv`.
- Confirm the lead destination is ready before activating public boxes.

## Build Order

- Build `EP-03 Service - Fast Quote - v1`.
- Build `EP-02 Emergency - Callback Request - v1`.
- Build `EP-04 Pricing - Cost Confidence - v1`.
- Build `EP-01 Visitor - Service Finder - v1`.
- Build `EP-05 Project - Planner - v1`.
- Build `EP-06 Appointment - Professional Services - v1`.
- Build `EP-07 Research - Checklist Capture - v1`.
- Build `EP-08 Provider - Claim Territory - v1`.
- Build `EP-09 Exit - Quote Rescue - v1`.
- Build `EP-10 Returning - Resume Request - v1`.

## QA Tests

Test desktop and mobile for each active box:

- Page load does not show an immediate interruption.
- Scroll trigger fires only after the configured threshold.
- CTA click trigger opens the correct flow.
- Close suppression works.
- Submit suppression works.
- Form fields fit without horizontal overflow on mobile.
- The box does not cover primary navigation or native forms.
- Submission reaches the expected lead destination.
- Hidden fields include campaign, service, page, and attribution data.

## First Activation

Activate only these first:

- `EP-03 Service - Fast Quote - v1`
- `EP-02 Emergency - Callback Request - v1`
- `EP-04 Pricing - Cost Confidence - v1`

Run the first activation for 48 to 72 hours before expanding.

Watch:

- submission count
- close rate
- mobile complaints or layout problems
- duplicate leads
- service misclassification
- missing phone/email
- lead destination failures

## Expansion

After the first three boxes are stable:

- Add `EP-01 Visitor - Service Finder - v1` to broad pages.
- Add `EP-05 Project - Planner - v1` to planned project families.
- Add `EP-06 Appointment - Professional Services - v1` to health and professional service families.
- Add `EP-07 Research - Checklist Capture - v1` to guides and checklist pages.
- Add `EP-08 Provider - Claim Territory - v1` only after provider intake routing is ready.
- Add exit intent and returning visitor boxes last.

## Stop Conditions

Pause a box immediately if:

- It appears on page load without visitor action.
- It blocks native Erie.Pro forms.
- It captures leads without service context.
- It sends test or live submissions to the wrong destination.
- It creates duplicate lead storms.
- It creates a poor mobile experience.

