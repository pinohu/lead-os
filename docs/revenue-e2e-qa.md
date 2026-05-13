# Revenue E2E QA

Script:

```bash
npm run revenue:e2e
```

Read-only mode checks:

- Erie.Pro health.
- Revenue stack readiness.
- Boost.space revenue-action queue signal.
- SuiteDash revenue-action queue signal.
- Revenue actions include route/learn outcomes.

Write mode:

```bash
REVENUE_QA_WRITE=1 npm run revenue:e2e
```

Write mode creates QA-marked synthetic events:

- ConvertBox lead submission to `/api/events/convertbox`.
- ThriveCart order webhook to `/api/webhooks/thrivecart` when `THRIVECART_WEBHOOK_TOKEN` or `THRIVECART_WEBHOOK_SECRET` is available.

Output:

- `docs/qa/revenue-e2e-results.json`

## Success Criteria

- Read-only production smoke passes.
- Write mode passes after ThriveCart sandbox/webhook credentials are available.
- Synthetic ConvertBox event creates a lead event and revenue actions.
- Synthetic ThriveCart event creates an offer purchase, fulfillment job, generated asset, revenue actions, and downstream Boost.space/SuiteDash queue signals.
- No event is stranded without one of four outcomes: deliver, recover, route, or learn.
