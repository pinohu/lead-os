# Security and Consent

This factory deals with three categories of irreversible action that
require dedicated safeguards.

## 1. Public publishing

Publishing to YouTube, GBP, social, Erie.pro, ProductDyno, etc. is gated
behind two flags:

- `SAFE_PUBLIC_PUBLISHING_ENABLED=true` (global, irreversible-action gate)
- The relevant per-connector flag (`ERIE_PRO_ENABLED`, etc.)

Both must be on for a publishing connector to make a real HTTP call.
With either off, the connector returns `status: "mocked"` or
`"blocked_by_flag"` and records the attempt in `PublishingRecord`.

Code: `packages/config/src/flags.ts::assertPublishingAllowed()`.

## 2. Live billing

Charges via ThriveCart (or any future billing connector) require:

- `SAFE_LIVE_BILLING_ENABLED=true`
- The per-connector flag (`THRIVECART_ENABLED`)

Until both are set, every charge returns `mocked` and is recorded as
such. `PricingPlan` rows exist for product configuration but do not
authorize charges by themselves.

Code: `packages/config/src/flags.ts::assertBillingAllowed()`.

## 3. Outreach automation

Any agent that contacts a prospect directly (the
`personalized-outreach-video-agent` plus any future email/SMS sender)
requires `SAFE_OUTREACH_ENABLED=true`. The default mock path never
sends.

Code: `packages/config/src/flags.ts::assertOutreachAllowed()`.

## Consent model

`ConsentRecord` is the canonical row for every consent question. Kinds:

| Kind | When required |
|---|---|
| `face` | Any person's face appears on-screen |
| `voice` | Any real person's voice is used (recorded or cloned) |
| `testimonial` | A customer quote is used by name or attribution |
| `logo` | A third-party logo appears |
| `trademark` | A trademark name is named/displayed |
| `likeness` | Synthetic image/video that could resemble a real person |
| `client_asset` | Client-supplied photo/video used in the output |

`Asset.consentStatus` is the per-asset rollup: `not_required`, `pending`,
`approved`, or `rejected`. QA hard rules block any job that has assets in
`pending` or `rejected`.

The `Legal/Rights/Consent Agent` reads consent records vs. asset usage
and refuses to advance the job if any face/voice/logo lacks an
approved record.

## Claims gating

`VideoJob.metadata.medicalClaim | legalClaim | financialClaim` is the
operator-set flag indicating that the brief touches a regulated domain.
When any is `true`, QA forbids auto-approval and requires a human
approval (`Approval.decidedBy` starts with `user:`).

The factory **does not** auto-detect claims with high confidence; the
client intake / brief stages should explicitly set these flags. Future
work: layer a claim classifier into the QA Reviewer.

## Forbidden behaviors (never overridden)

These are explicit hard refusals regardless of flags:

1. **Fake testimonials.** The factory will not generate a testimonial
   for a person who has not consented. If a job carries
   `metadata.fakeTestimonial=true`, intake must refuse.
2. **Impersonation / celebrity likeness.** The visual-consistency
   agent will not lock onto a real person's likeness without a
   `ConsentRecord(kind="likeness", status="approved")` for that person.
3. **Deletion of client data.** No agent has `delete_client_data` in
   `tools_allowed`. Cascading deletes happen only when a video job
   itself is deleted, which is an operator-only action.

## Audit + traceability

Every consequential action writes an `AuditLog` row with
`actor`, `action`, `target`, `jobId`, `payload`. Use:

```
GET /api/audit-logs?jobId=<id>
GET /api/audit-logs?actor=user:ike@kwode.com
```
