# ConvertBox Placement Verification

Status: BLOCKED-EXTERNAL until the ConvertBox dashboard boxes are activated and their targeting matches the generated 112-service matrix.

Erie.Pro code-side support is installed globally:

- Script loader: `script#app-convertbox-script`
- UUID: `NEXT_PUBLIC_CONVERTBOX_UUID`, defaulting to Erie.Pro UUID `d2c3d694-a219-4659-a17f-93165afe8ba0`
- Page context: `window.erieProConvertBox`
- Dataset context: `data-ep-service-slug`, `data-ep-service-family`, `data-ep-convertbox-id`, `data-ep-county-focus`
- Event endpoint: `POST https://erie.pro/api/events/convertbox`

Generated files:

- Placement matrix: `docs/external-setup/convertbox/placement-matrix.json`
- Verification results: `docs/external-setup/convertbox/placement-verification-results.json`

## Verification Command

Run the fast smoke check:

```bash
npm run convertbox:verify -- --limit=10
```

Run all 112 service pricing pages:

```bash
npm run convertbox:verify
```

Run with an endpoint submission probe:

```bash
npm run convertbox:verify -- --submit-probe --limit=5
```

The submit probe creates QA-marked ConvertBox events in Neon. Use it only when event-write verification is desired.

## ConvertBox Dashboard Checklist

For each service row in `placement-matrix.json`:

1. Open ConvertBox.
2. Open the Erie.Pro site/account.
3. Create or edit the matching box by `boxId` and `boxName`.
4. Set the box active only after the copy, steps, design, and targeting are final.
5. Configure include targets from `convertBoxIncludeTargets`.
6. Configure exclude targets from `excludeTargets`.
7. Use Erie County language, not radius/mileage language.
8. Match steps to the service mental model:
   - Emergency: 3-4 fast-routing steps.
   - Urgent environmental/safety: 4-5 reassurance and risk steps.
   - Appointment/trust services: 5 steps with privacy and fit.
   - Planned projects: 6-7 scope, timing, budget, proof, and contact steps.
   - Seasonal services: 4-5 timing and readiness steps.
9. Add a final submit action that posts to `https://erie.pro/api/events/convertbox`.
10. Include these fields on final submission:
    - `eventType`
    - `sourcePage`
    - `sourcePageType`
    - `serviceSlug`
    - `serviceLabel`
    - `serviceNiche`
    - `family`
    - `boxId`
    - `stepId`
    - `stepName`
    - `branchId`
    - `branchLabel`
    - `consumerName`
    - `consumerPhone`
    - `consumerEmail`
    - `requestSummary`
    - `consentToContact`
    - `marketingConsent`
    - `utmSource`
    - `utmMedium`
    - `utmCampaign`
    - `gclid`
11. Add bridge messages from custom HTML/buttons when possible:

```js
window.parent.postMessage({
  source: "erie-pro-convertbox",
  eventType: "convertbox.step_viewed",
  payload: {
    stepId: "service-fit",
    stepName: "Service fit",
    boxId: 232604
  }
}, "https://erie.pro");
```

12. Save, preview, and verify desktop/mobile.

## Success Criteria

- The Playwright script passes for the public pages.
- Each service page exposes the correct service slug, family, and ConvertBox box ID.
- ConvertBox dashboard boxes are active only on intended service pages.
- All final submission paths post to `/api/events/convertbox`.
- Events create Neon lead events and revenue actions.
- Visitors see helpful, service-specific prompts, not developer-facing strategy text.
- No ConvertBox appears on admin, dashboard, login, privacy, terms, API, or checkout-control pages.
