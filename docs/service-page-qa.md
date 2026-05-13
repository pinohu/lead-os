# Erie.Pro Service Page QA

Run the generator-driven service QA sweep with:

```text
npm run service-pages:qa
```

The script checks every configured Erie.Pro service across desktop and mobile for:

- Service home page status, H1, Erie/local context, lead form, quote CTA, provider CTA, and horizontal overflow.
- Service pricing page status, H1, Erie/local context, ThriveCart checkout links, no Stripe checkout links, expected offer matching, provider-growth copy, and horizontal overflow.
- Screenshot hashes for each checked page and viewport so future runs can detect visual drift.

Outputs:

```text
docs/qa/service-pages/service-page-qa-results.json
docs/qa/service-pages/visual-snapshots.json
```

Useful options:

```text
SERVICE_QA_URL=https://erie.pro npm run service-pages:qa
SERVICE_QA_LIMIT=5 npm run service-pages:qa
npm run service-pages:qa -- --limit=5
```

The first full run establishes the visual snapshot hash ledger. Future runs should compare the JSON diff before merging page, CTA, offer, or layout changes.
