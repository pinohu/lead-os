# Kwode Video Factory

A company of Hermes agents that runs an AI Video Production Factory under Kwode LLC.

## What this is

An operator-ready control plane that takes video requests from local service businesses,
Erie.pro providers, YourDeputy clients, and other Kwode LLC ventures, walks them
through a multi-agent production pipeline (intake → brief → script → storyboard →
prompts → assets → QA → approval → delivery), and tracks every step in a
state-machine-backed database with full audit logs.

**Status: MVP.** The control plane is real. Asset generation runs through Hermes
(real or mock) and ViMax (real or mock); both default to deterministic mock runners
so the entire pipeline works without external dependencies.

See `docs/IMPLEMENTATION_STATUS.md` for a truthful breakdown of what works,
what is mocked, and what is pending.

## Run locally (Docker)

```bash
cp .env.example .env
docker compose up --build
# In another terminal:
docker exec kwode-api npx prisma migrate deploy --schema packages/schemas/prisma/schema.prisma
docker exec kwode-api npx tsx scripts/seed.ts
curl http://localhost:3000/api/health/deep | jq .
```

## Run locally (Node)

```bash
cp .env.example .env
# Start Postgres separately (e.g. via Docker compose db service or your own).
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Run a demo job end-to-end

```bash
# Seed creates 7 demo jobs in draft. Pick one and walk it through.
npx tsx apps/cli/src/index.ts video:create-demo --tenant erie-pro --video-type service-explainer --title "demo"
# Note the printed job id, then:
npx tsx apps/cli/src/index.ts video:generate-brief    --job <id>
npx tsx apps/cli/src/index.ts video:generate-script   --job <id>
npx tsx apps/cli/src/index.ts video:generate-storyboard --job <id>
npx tsx apps/cli/src/index.ts video:generate-prompts  --job <id>
npx tsx apps/cli/src/index.ts video:qa                --job <id>
# Or one-shot:
npx tsx apps/cli/src/index.ts video:run-chain         --job <id>
```

## Documentation map

| Doc | Purpose |
|---|---|
| `docs/ARCHITECTURE.md` | System layers + services + data flow |
| `docs/AGENT_COMPANY_DESIGN.md` | 21 departments + 50 agents + chains |
| `docs/VIDEO_CATALOG.md` | 50+ video types + niche overrides |
| `docs/TOOL_REGISTRY.md` | AppSumo + open-source + commercial tools |
| `docs/HERMES_INTEGRATION.md` | Hermes runtime, mocking, fallback path |
| `docs/VIMAX_INTEGRATION.md` | ViMax planning packets + fallback |
| `docs/OPERATOR_RUNBOOK.md` | How an operator runs the factory |
| `docs/QA_CHECKLIST.md` | 9-category QA + hard rules |
| `docs/SECURITY_AND_CONSENT.md` | Consent gating, claims rules, safety flags |
| `docs/ERIE_PRO_INTEGRATION.md` | Provider + consumer video flows |
| `docs/YOURDEPUTY_INTEGRATION.md` | YourDeputy video productization |
| `docs/APP_SUMO_TOOL_MAP.md` | Tool roles + recommended chains |
| `docs/IMPLEMENTATION_STATUS.md` | Truthful what-works summary |

## License

Internal Kwode LLC project. Not licensed for external distribution.
