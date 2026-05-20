# Architecture

## System layers

```
┌──────────────────────────────────────────────────────────────────────┐
│ Layer 1 — Market / Offer                                              │
│   Defines what is sold (pricing plans, productized packs).            │
│   Files: packages/billing/src/plans.ts                                │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 2 — Intake / Client Context                                     │
│   Captures client, brand, niche, audience, area, offer, consent.      │
│   Tables: Client, Provider, BrandProfile, VideoInput, ConsentRecord   │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 3 — Strategy / Brief                                            │
│   Turns intake into objective / audience / hook / CTA / trust.        │
│   Table: CreativeBrief; Agent: creative-brief-agent                   │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 4 — Agentic Creative Planning                                   │
│   Script, storyboard, scenes, prompts, consistency.                   │
│   Tables: Script, Storyboard, Scene, Prompt                           │
│   Agents: scriptwriter, storyboard-director, scene-planning,          │
│           prompt-engineer, visual-consistency                         │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 5 — Asset Generation                                            │
│   Routes to ViMax, ComfyUI, SUPERMACHINE, Vadoo, Zebracat, Fliki, …   │
│   Tables: GenerationRun, Asset, ToolRun                               │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 6 — Video Assembly / Rendering                                  │
│   Remotion / FFmpeg / FlexClip / OneTake / Minvo / manual.            │
│   Agent: remotion-ffmpeg-render-agent                                 │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 7 — QA / Compliance / Approval                                  │
│   9-category QA + hard rules + human approval.                        │
│   Tables: QAReview, Approval, Revision                                │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 8 — Delivery / Publishing                                       │
│   SuiteDash, ProductDyno, Gumlet, Publitio, Erie.pro, GBP, social.    │
│   Tables: Deliverable, PublishingRecord                               │
├──────────────────────────────────────────────────────────────────────┤
│ Layer 9 — Learning / Analytics                                        │
│   Cost per video, QA pass rate, throughput, recommended next videos.  │
│   Tables: PerformanceMetric, MemoryRecord                             │
└──────────────────────────────────────────────────────────────────────┘
```

## Services

| Service | Purpose | Runtime |
|---|---|---|
| `apps/api` | HTTP API (Express) — jobs, agents, tools, catalog, audit, health | Node 20 |
| `apps/worker` | Background poller that runs the next agent when the job state implies one | Node 20 |
| `apps/agent-runner` | Long-lived process that holds the agent registry; future home of a persistent Hermes worker connection | Node 20 |
| `apps/cli` | Operator command-line tool for running steps locally | Node 20 (tsx) |
| Postgres | Persistent state (Prisma schema in `packages/schemas/prisma/schema.prisma`) | Postgres 16 |
| Redis | Reserved for queue upgrade — not yet wired into the worker | Redis 7 |

## Data flow (happy path)

```
intake form ─► POST /api/video-jobs ─► VideoJob(draft) + VideoInput
                                          │
                                          ▼
                              creative-brief-agent
                                          │
                       brief_generating → brief_ready → brief_approved
                                          │
                                          ▼
                              scriptwriter-agent ─► Script
                                          │
                                  script_ready
                                          │
                                          ▼
                              storyboard-director-agent ─► Storyboard + Scene[]
                                          │
                                  storyboard_ready
                                          │
                                          ▼
                              prompt-engineer-agent ─► Prompt[] + GenerationRun (ViMax)
                                          │
                                  prompts_ready
                                          │
                                          ▼
                                qa-reviewer-agent ─► QAReview (hard rules applied)
                                          │
                                  qa_passed / qa_failed
                                          │
                                          ▼
                                   client_review
                                          │
                                  approval (user)
                                          │
                                          ▼
                                       approved
                                          │
                                          ▼
                                      delivered
```

## Why this shape

1. **Single source of truth for state** — `VideoJob.status` runs through
   `packages/workflow-engine/src/state-machine.ts`. Every status change
   writes an AuditLog row.
2. **Hard rules in the database, not the agent** — `packages/qa/src/checks.ts`
   re-checks consent + claims against the actual rows. An agent cannot
   approve its way past a missing ConsentRecord.
3. **Runtime swap** — Hermes is wrapped behind `invokeHermes()`; if it's
   disabled, the mock runner produces deterministic JSON for every intent
   so the chain runs offline.
4. **Tool-agnostic generation** — every model invocation is a
   `GenerationRun` row with `mode = "mock" | "api" | "manual" | "hermes"`.
   Swapping ViMax for Vadoo means a new connector and a registry update,
   not a pipeline rewrite.

## Deployment topology (MVP → production)

```
                              ┌────────────────────────────────┐
                              │  Reverse proxy (Caddy/Nginx)    │
                              └────────────┬────────────────────┘
                                           │
                       ┌───────────────────┼───────────────────┐
                       ▼                   ▼                   ▼
                  apps/api            apps/worker         apps/agent-runner
                       │                   │                   │
                       └───────────────────┼───────────────────┘
                                           ▼
                                       Postgres
                                           │
                                       (Redis — reserved)
                                           │
                            ┌──────────────┴──────────────┐
                            ▼                             ▼
                   storage/ (local FS)            Hermes / ViMax / ComfyUI
                                                  (when enabled)
```

The MVP is a single host. Multi-tenant scale-out involves: pulling all
mutable state into Postgres (already done), promoting Redis to BullMQ,
and sharding the worker across processes by tenant id.
