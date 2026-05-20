# Operator Runbook

How an operator drives a video job from intake to delivered.

## 0. Daily morning checks

```bash
curl -s http://localhost:3000/api/health/deep | jq .
# Should show dependencies.database.ok=true, runtimes shown with mode=mock|real,
# safetyFlags.publicPublishingEnabled=false (until you flip it).
```

If `dependencies.database.ok=false`, fix Postgres first. Nothing else
will succeed.

## 1. Create a job

Either via the API:

```bash
curl -X POST http://localhost:3000/api/video-jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantSlug": "erie-pro",
    "videoTypeId": "service-explainer",
    "title": "Emergency plumbing visibility video",
    "intake": {
      "audience": "Erie homeowners",
      "goal": "Drive emergency calls",
      "cta": "Call (814) 200-0328",
      "durationSec": 45,
      "aspectRatio": "9:16"
    }
  }'
```

Or via CLI:

```bash
npx tsx apps/cli/src/index.ts video:create-demo \
  --tenant erie-pro \
  --video-type service-explainer \
  --title "Emergency plumbing demo"
```

The job lands in status `draft`.

## 2. Walk the chain

You can either let the worker pick it up automatically, or run each step
manually for review. Manual is recommended for the first few jobs.

```bash
JOB=<job-id>
curl -X POST http://localhost:3000/api/video-jobs/$JOB/generate-brief
curl -X POST http://localhost:3000/api/video-jobs/$JOB/generate-script
curl -X POST http://localhost:3000/api/video-jobs/$JOB/generate-storyboard
curl -X POST http://localhost:3000/api/video-jobs/$JOB/generate-prompts
curl -X POST http://localhost:3000/api/video-jobs/$JOB/qa
```

Or as one CLI call:

```bash
npx tsx apps/cli/src/index.ts video:run-chain --job $JOB
```

At each step:

- Inspect the job: `curl http://localhost:3000/api/video-jobs/$JOB | jq .`
- Inspect the audit trail: `curl "http://localhost:3000/api/audit-logs?jobId=$JOB" | jq .`

## 3. Review QA

If `qaResult` is `failed`, the latest `QAReview` row will list
`blockingIssues`. Address them and re-run:

```bash
curl -X POST http://localhost:3000/api/video-jobs/$JOB/request-revision \
  -H 'Content-Type: application/json' \
  -d '{ "requestedBy": "ike@kwode.com", "reason": "Fix consent gap", "scope": ["assets"] }'
# Resolve the issue (e.g. add a ConsentRecord), then re-run QA.
curl -X POST http://localhost:3000/api/video-jobs/$JOB/qa
```

## 4. Approve and deliver

```bash
curl -X POST http://localhost:3000/api/video-jobs/$JOB/approve \
  -H 'Content-Type: application/json' \
  -d '{ "decision": "approved", "decidedBy": "ike@kwode.com" }'
curl -X POST http://localhost:3000/api/video-jobs/$JOB/deliver \
  -H 'Content-Type: application/json' \
  -d '{ "channel": "client_portal" }'
```

Delivery refuses to advance if QA isn't passed or hard rules block
delivery — the response body lists the blockers.

## 5. Publishing (gated)

Publishing to GBP / YouTube / Erie.pro / etc. requires:

1. `SAFE_PUBLIC_PUBLISHING_ENABLED=true` in `.env`.
2. The relevant per-connector flag (`ERIE_PRO_ENABLED`, etc.).
3. A real HTTP implementation wired into the connector — the MVP ships
   stubs that return `blocked_by_flag`.

Until both flags are on and the implementation is real, publishing
is recorded as `mocked`.

## 6. Useful queries

```bash
# All jobs in QA pending
curl "http://localhost:3000/api/video-jobs?status=qa_pending" | jq '.jobs[].id'

# Failed jobs
curl "http://localhost:3000/api/video-jobs?status=qa_failed" | jq '.jobs[].id'

# Blocked jobs
curl "http://localhost:3000/api/video-jobs" | jq '.jobs[] | select(.status|startswith("blocked"))'

# Recent audit for an actor
curl "http://localhost:3000/api/audit-logs?actor=agent:creative-brief-agent" | jq .
```

## 7. When something is wrong

| Symptom | Likely cause | Action |
|---|---|---|
| Job stuck in `*_generating` | Worker crashed or step errored | Check `api/audit-logs?jobId=...`; rerun the step manually |
| QA always fails on `rights_and_consent` | Missing ConsentRecord | Add the consent row, then re-run QA |
| `/api/health/deep` shows `dependencies.database.ok=false` | Postgres down | `docker compose restart db` |
| Hermes mode is `mock` but you set `HERMES_ENABLED=true` | Env not loaded into container | Restart API: `docker compose restart api` |
