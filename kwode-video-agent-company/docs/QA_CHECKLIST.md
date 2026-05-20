# QA Checklist

Every job passes through a 9-category QA evaluation. The QA Reviewer
Agent emits a `QAReview` row, and `packages/qa/src/checks.ts`
**independently** re-evaluates hard rules against the database state.
Both must pass before a job can be approved + delivered.

## The 9 categories

| Category | Question |
|---|---|
| `visual_quality` | Does the visual output meet the brand + spec? Free of artifacts? |
| `business_accuracy` | Are facts about the business (name, address, services, hours, phone) correct? |
| `brand_consistency` | Does the video align with brand voice / palette / typography / forbidden phrases? |
| `caption_accuracy` | Are captions/SRT accurate (≥98%) and timed correctly? |
| `rights_and_consent` | Are all faces, voices, testimonials, logos consented or not-required? |
| `claims_and_compliance` | No unsupported medical / legal / financial / safety claims? |
| `platform_readiness` | Aspect, length, codec, file size match the target platform? |
| `conversion_strength` | Hook in first 3s, CTA at end, value clearly communicated? |
| `client_readiness` | Does the asset match what the client asked for? |

## Hard rules (cannot be bypassed by an agent)

These checks run inside `evaluateHardRules(jobId)` and read directly
from the database, not from agent output.

1. **Consent** — Any `Asset.consentStatus` of `pending` or `rejected`
   blocks the job. Any `ConsentRecord` of kind
   `face | voice | testimonial | logo | likeness` that is not
   `approved` or `not_required` blocks the job.
2. **Claims** — If `VideoJob.metadata.medicalClaim`, `.legalClaim`, or
   `.financialClaim` is `true`, the job requires an Approval row with
   `decidedBy` starting with `user:` before delivery.
3. **QA pass** — Delivery refuses unless `qaResult = "passed"`.
4. **Approval** — Delivery refuses unless `approvalResult = "approved"`.

## Forbidden in MVP (per requirements)

- No video can be marked delivered unless QA has passed.
- No video involving face / voice / testimonial / client-owned material
  can be approved unless `consentStatus` is `approved` or `not_required`.
- No medical / legal / financial / safety claim can be auto-approved.
- No fake testimonial generation.
- No impersonation or celebrity-likeness generation.
- No public publishing by default.
- No live billing by default.
- No automated outreach by default.
- Every agent output is auditable (`AgentRun` + `AuditLog`).
- Every generated artifact is versioned
  (`CreativeBrief.version`, `Script.version`, `Storyboard.version`,
  `Prompt.version`, `QAReview.version`).

## How to run QA

```bash
curl -X POST http://localhost:3000/api/video-jobs/$JOB/qa
```

The endpoint runs the QA Reviewer Agent (mock or real), then applies
hard rules. The agent cannot "approve" past a hard-rule block — the
`QAReview.blockingIssues` field will list the rule that fired.
