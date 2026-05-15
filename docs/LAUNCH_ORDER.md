# Erie.Pro Launch Order — What's Left

**State as of May 15, 2026, master sha `ac184c1e562a`:** all code, schema,
infrastructure, and production cron auth are done. The remaining work is five
third-party dashboard configurations (D–H) that can only be done from their
respective UIs, followed by one verification re-run. None of D–H depends on the
others; the recommended order below is by time-to-first-revenue, not technical
ordering.

You can do each of these in any order, but you cannot run the closing
verification step (`revenue:e2e --write`) until D and at least one of E/F/G is
complete.

---

## D. ThriveCart — products + checkout pages (~1–2 hr)

This is the only step that's strictly blocking the first dollar. Without it,
nothing can be sold.

1. Open `docs/external-setup/thrivecart.md` and `docs/external-setup/thrivecart/master-setup.json`. The JSON file lists every product, funnel, and subscription that the code expects to find — slug, price, and trial mechanics included.
2. In the ThriveCart dashboard, create each product to match those slugs and prices exactly. The slugs are referenced in code; do not improvise.
3. In ThriveCart → Settings → API, copy the API key and confirm it is stored in Vercel as `THRIVECART_API_KEY` (it already is — leave it alone unless you rotate).
4. Run `npx tsx erie-pro/src/scripts/setup-thrivecart.ts` from the repo root once products exist; it subscribes the webhook endpoint so events reach `/api/integrations/thrivecart/webhook`.
5. Send one $1 test purchase through a checkout page. Verify it appears in `offer_purchases` and that re-sending the same webhook payload does NOT create a duplicate row (the May 15 idempotency migration is doing its job).

## E. ConvertBox — activate boxes + targeting (~30–60 min)

Without this, the lead capture moments on the niche pages won't fire.

1. Open `docs/external-setup/convertbox.md` and `docs/external-setup/convertbox/placement-matrix.json`. The matrix tells you exactly which box ID belongs on which page-type and which event payload it should fire.
2. In the ConvertBox dashboard, activate each box and apply the targeting rules from the matrix. Pay attention to the `ConvertBoxPageContext` — the embed reads it client-side, so the targeting must match the context names verbatim.
3. After activation, re-run `npx tsx erie-pro/src/scripts/verify-convertbox-placement.ts` and confirm the 5 smoke pages still pass.

## F. Boost.space — import scenarios (~30–60 min)

Boost.space runs the polling and revenue-action callbacks for ConvertBox → ThriveCart routing. Without it, leads are captured but nothing routes.

1. Open `docs/external-setup/boostspace.md` and `docs/external-setup/boostspace/revenue-action-scenarios.json`. The JSON is a direct scenario export.
2. In Boost.space, create a workspace token, then import each scenario in the JSON. The endpoint they should call is the live `/api/integrations/boostspace/revenue-actions`.
3. Run one scenario manually in Boost.space and confirm it succeeds. The callback writes to `revenue_actions`; you can verify via the existing read-only `revenue:e2e`.

## G. SuiteDash — confirm project/portal/support/task objects (~30–60 min)

SuiteDash is the operational sync target. Without it, sold orders don't generate the right downstream artifacts (client portal, project, task list).

1. Open `docs/external-setup/suitedash.md` and `docs/external-setup/suitedash/operational-sync-package.json`.
2. In SuiteDash, confirm each object (project type, portal template, support pipeline, task template) exists with the slug listed in the package JSON. Create any missing ones.
3. The retrying/idempotent contact API client is already wired; no further code work needed.

## H. ProductDyno — connect destinations (~30 min)

ProductDyno is the fulfillment destination for digital offers. Without it, paid customers don't receive what they bought.

1. Open `docs/external-setup/offer-fulfillment.md` and `docs/external-setup/offer-fulfillment/fulfillment-channel-map.json`. The channel map lists every offer family and its expected ProductDyno product.
2. In ProductDyno, create each product/connection to match. Copy the webhook URL into Vercel as the appropriate `PRODUCTDYNO_*` env var if not already present.
3. Send one test fulfillment via the existing offer-fulfillment cron and confirm delivery.

---

## Closing verification (only after D + at least one of E/F/G is done)

From the repo root, with production env pulled to `.env.local`:

```bash
REVENUE_QA_WRITE=1 npm run revenue:e2e
```

This re-runs the same `revenue:e2e` script that currently produces 5 passed / 2
skipped, but in write mode it submits a synthetic ConvertBox event (tagged
`qa+revenue-…@erie.pro`) and posts a synthetic ThriveCart webhook signed with
`THRIVECART_WEBHOOK_TOKEN`. Expected result: 7 passed / 0 skipped / 0 failed.

Results are written to `docs/qa/revenue-e2e-results.json`.

If the write-mode run passes, the BLOCKED-EXTERNAL items in `STATUS.md` can be
moved to `DONE-VERIFIED`. The platform is shippable from an engineering
standpoint.

## What's still NOT done (and is genuinely follow-up work)

- **Broader directory quality audit.** The May 15 cleanup caught 3 obvious
  big-box mis-categorizations. There are likely 50–150 more lower-confidence
  noise entries (Outscraper broad-keyword search returning adjacent businesses).
  Targeted re-scrape per specialty niche with tighter queries is the right fix,
  not a bulk re-run of `scrape:places`.
- **Integration tests for the two new defenses.** PR #38 added Postgres-backed
  login rate-limiting and ThriveCart webhook idempotency. Both have correct unit
  surfaces but no integration test exercising the duplicate-event path or the
  multi-instance auth path. Worth adding once revenue is flowing.

Neither blocks first revenue.
