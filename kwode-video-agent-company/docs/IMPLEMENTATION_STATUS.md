# Implementation Status

A truthful, file-by-file accounting of what works in the MVP, what is
mocked, and what is pending. Do not represent any "mocked" or "pending"
item as production-ready.

## What works (live in MVP)

| Capability | Where | Verification |
|---|---|---|
| Monorepo + Docker Compose boot | `docker-compose.yml`, `infra/Dockerfile.*` | `docker compose up --build` boots api + worker + db + redis + agent-runner |
| Prisma schema with 26 tables | `packages/schemas/prisma/schema.prisma` | `npm run db:migrate` |
| Seed: 3 tenants, 50 agent definitions, ~40 tools, 4 pricing plans, 3 demo clients, 7 demo jobs | `scripts/seed.ts` | `npm run db:seed` |
| Agent registry (50 agents) | `packages/agents/definitions/agents.yaml` + loader | `npm run agents:list` |
| Video catalog (50 master types + 23 niche overrides) | `packages/video-catalog/catalog/*.yaml` | `curl /api/video-types` |
| Tool registry (~40 tools) | `packages/tool-registry/registry/tools.yaml` | `npm run tools:list` |
| Express API with all required routes | `apps/api/src/routes/` | `curl /api/health/deep` |
| Job state machine + transition validation | `packages/workflow-engine/src/state-machine.ts` | `tests/unit/state-machine.test.ts` |
| Mock Hermes runner — deterministic per intent | `packages/connectors/src/hermes/hermesMockRunner.ts` | `tests/unit/hermes-mock.test.ts` |
| Mock ViMax runner — planning manifest | `packages/connectors/src/vimax/vimaxMockRunner.ts` | `tests/unit/hermes-mock.test.ts` |
| Agent chain orchestrator — runs the default chain end-to-end | `packages/workflow-engine/src/agent-chain.ts` | `npx tsx apps/cli/src/index.ts video:run-chain --job <id>` |
| QA hard rules — consent + claims gating | `packages/qa/src/checks.ts` | Manual QA + delivery refusal |
| Audit logging on every status change + agent run | `packages/audit/src/index.ts` | `curl /api/audit-logs?jobId=<id>` |
| Operator CLI | `apps/cli/src/index.ts` | `npx tsx apps/cli/src/index.ts agents:list` |
| Worker polling loop | `apps/worker/src/index.ts` | Container logs |
| 4 Vitest suites | `tests/unit/*.test.ts` | `npm test` |

## What is mocked

| Component | Why | Where to flip to live |
|---|---|---|
| Hermes runtime | Hermes not installed in this container | `HERMES_ENABLED=true` + `HERMES_COMMAND` set |
| ViMax runtime | HKUDS/ViMax not installed | `VIMAX_ENABLED=true` + `VIMAX_COMMAND` set |
| ComfyUI | No ComfyUI server in MVP | `COMFYUI_ENABLED=true` + `COMFYUI_BASE_URL` |
| SuiteDash delivery | API key required | `SUITEDASH_ENABLED=true` + key + adapter |
| ThriveCart charges | Live charging is gated | `THRIVECART_ENABLED=true` + `SAFE_LIVE_BILLING_ENABLED=true` + adapter |
| ProductDyno publish | Membership push not wired | `PRODUCTDYNO_ENABLED=true` + `SAFE_PUBLIC_PUBLISHING_ENABLED=true` + adapter |
| Gumlet / Publitio uploads | No real API call yet | per-flag + adapter implementation |
| Erie.pro provider dashboard delivery | Real HTTP wiring deferred | `ERIE_PRO_ENABLED=true` + `SAFE_PUBLIC_PUBLISHING_ENABLED=true` + adapter |
| YourDeputy delivery | Real HTTP wiring deferred | `YOURDEPUTY_ENABLED=true` + flag + adapter |
| Public publishing | Default-off by design | `SAFE_PUBLIC_PUBLISHING_ENABLED=true` |
| Outreach send | Default-off by design | `SAFE_OUTREACH_ENABLED=true` |

## What is pending (not implemented)

| Item | Where it would land |
|---|---|
| Web dashboard | `apps/web/` — intentionally deferred per task allowance; API + CLI are the operator surface in MVP |
| BullMQ-backed worker queue | `apps/worker/` upgrade — Redis is provisioned but not used |
| Real Remotion / FFmpeg render pipeline | `apps/video-renderer/` — only mock assets exist in MVP |
| n8n / Activepieces / Pabbly workflow defs | `workflows/*/` — folders exist but blueprints are not authored |
| Hermes Gateway HTTP path | `hermesAdapter.ts` — spawn path is implemented; HTTP gateway is a TODO |
| Multi-tenant auth + RBAC | API is unauthenticated in MVP; deploy behind reverse-proxy auth or add JWT middleware before exposing publicly |
| Full prisma typed test fixtures | Tests cover loaders + state machine + mocks; DB-touching paths are exercised manually via CLI |
| Real LLM-backed brief / script / storyboard generation | Today these run via the mock; wire to OpenAI/Anthropic/local LLM via Hermes when ready |
| Real consent capture flow | The `ConsentRecord` table is populated by API but no UI exists in MVP |
| Erie.pro production link | Adapter is stub-only — needs Erie.pro provider-API contract before wiring |
| YourDeputy production link | Adapter is stub-only — same |
| Stripe / ThriveCart webhook receiver | Not wired |

## How to verify the MVP

```bash
# 1. Boot
docker compose up --build

# 2. Initialize DB
docker exec kwode-api npx prisma migrate deploy --schema packages/schemas/prisma/schema.prisma
docker exec kwode-api npx tsx scripts/seed.ts

# 3. Run unit tests
docker exec kwode-api npm test

# 4. Walk a demo job end-to-end
docker exec kwode-api npx tsx apps/cli/src/index.ts agents:list | head -5
docker exec kwode-api npx tsx apps/cli/src/index.ts tools:list  | head -5

# create a job
JOB=$(curl -s -X POST http://localhost:3000/api/video-jobs \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"erie-pro","videoTypeId":"service-explainer","title":"verify-demo","intake":{"audience":"Erie homeowners","goal":"verify","cta":"call","durationSec":45,"aspectRatio":"9:16"}}' \
  | jq -r .id)
echo "JOB=$JOB"

# run the chain
docker exec kwode-api npx tsx apps/cli/src/index.ts video:run-chain --job "$JOB"

# inspect
curl -s http://localhost:3000/api/video-jobs/$JOB | jq '{status, qaResult, approvalResult, agentRuns: (.agentRuns | length)}'
curl -s "http://localhost:3000/api/audit-logs?jobId=$JOB" | jq '.logs | length'

# attempt delivery before approval — should refuse
curl -s -X POST http://localhost:3000/api/video-jobs/$JOB/deliver | jq .

# approve + deliver
curl -s -X POST http://localhost:3000/api/video-jobs/$JOB/approve \
  -H 'Content-Type: application/json' \
  -d '{"decision":"approved","decidedBy":"ike@kwode.com"}' | jq '.approvalResult'
curl -s -X POST http://localhost:3000/api/video-jobs/$JOB/deliver \
  -H 'Content-Type: application/json' \
  -d '{"channel":"client_portal"}' | jq .
```

Expected end state:

- `status === "delivered"`
- `qaResult === "passed"`
- `approvalResult === "approved"`
- Audit log has ≥ 10 rows
- Deliverable row exists with channel=client_portal

## Honest gaps

1. **Linting + typecheck are not enforced in CI.** The MVP project has no
   CI configured. `npm run typecheck` should be added as a GitHub Action
   before any next commit.
2. **No web dashboard.** Per the task scope this can be skipped if the
   API + CLI are exposed. It is documented as pending here.
3. **No production tests for DB-touching paths.** Vitest suites cover
   pure-logic surfaces (state machine, mocks, registries). Integration
   tests against a real Postgres would be a next-pass addition.
4. **Connectors for ComfyUI, ThriveCart, ProductDyno, etc. ship as
   stubs**, not full HTTP clients. Each is one file away from a real
   client, but it isn't a real client yet.
