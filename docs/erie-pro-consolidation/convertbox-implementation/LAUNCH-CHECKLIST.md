# Erie.Pro ConvertBox Launch Checklist

Use this checklist when moving from plan to live ConvertBox configuration.

## Preflight

- Confirm ConvertBox has an `Erie.Pro` site using `erie.pro` and `www.erie.pro`.
- Confirm the ConvertBox script or WordPress/plugin equivalent is installed once on Erie.Pro.
- Confirm the script loads on production pages and not on admin or preview-only routes.
- Confirm the current live service count is 112.
- Confirm each service is represented in `SERVICE-FAMILY-MAP.csv`.
- Confirm each box uses the service-aware copy and question set from `SERVICE-AWARE-FLOW-COPY.md`.
- Confirm no consumer-facing box still uses generic developer-style copy without service context.
- Confirm health, funeral, legal, financial, and senior-care flows use privacy-safe appointment or consultation language instead of contractor or quote language.
- Confirm urgent service flows ask the right first triage question for the service: leak, no heat, electrical hazard, sewage backup, lockout, disabled vehicle, storm damage, or similar.
- Confirm seasonal Erie flows ask timing, property type, storm/season context, and recurring-vs-one-time need.
- Confirm the lead destination is ready before activating public boxes.

## Build Order

- Build `EP-F01 Emergency Home Response - v1`.
- Build `EP-F02 Planned Home Projects - v1`.
- Build `EP-F03 Seasonal Erie Services - v1`.
- Build `EP-F04 Cleaning And Turnover - v1`.
- Build `EP-F05 Pest And Environmental - v1`.
- Build `EP-F06 Auto Roadside And Marine - v1`.
- Build `EP-F07 Health And Wellness Appointments - v1`.
- Build `EP-F08 Professional Legal And Financial - v1`.
- Build `EP-F09 Provider Territory Claim - v1`.
- Build `EP-F10 Returning And Exit Rescue - v1`.

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
- Copy matches the service family and does not read like internal documentation.

## First Activation

Activate only these first:

- `EP-F01 Emergency Home Response - v1`
- `EP-F03 Seasonal Erie Services - v1`
- `EP-F04 Cleaning And Turnover - v1`

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

- Add `EP-F02 Planned Home Projects - v1`.
- Add `EP-F05 Pest And Environmental - v1`.
- Add `EP-F06 Auto Roadside And Marine - v1`.
- Add `EP-F07 Health And Wellness Appointments - v1`.
- Add `EP-F08 Professional Legal And Financial - v1`.
- Add `EP-F09 Provider Territory Claim - v1` only after provider intake routing is ready.
- Add `EP-F10 Returning And Exit Rescue - v1` last.

## Stop Conditions

Pause a box immediately if:

- It appears on page load without visitor action.
- It blocks native Erie.Pro forms.
- It captures leads without service context.
- It sends test or live submissions to the wrong destination.
- It creates duplicate lead storms.
- It creates a poor mobile experience.
