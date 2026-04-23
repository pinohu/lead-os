# Lead Operating System — Replicable Architecture

This document is the **canonical reference** for how Lead OS is structured so you can **replicate deployments**, **add niches as config**, and **avoid architectural drift**.

> **Note:** As of March 2026, Lead OS is a unified monorepo. The kernel runtime (`lead-os-runtime`) contains all 488 source files, 278 API endpoints, 35 integration adapters, and 23 dashboard pages. See [LEAD-OS-COMPLETE-GUIDE.md](../LEAD-OS-COMPLETE-GUIDE.md) for the full platform documentation including the AppSumo integration roadmap.

**Repository**

| Repository | Role |
|------------|------|
| [pinohu/lead-os](https://github.com/pinohu/lead-os) | Monorepo: kernel runtime (`lead-os-runtime`), edge layer (`neatcircle-beta`), blueprints, scenarios, **this doc** |

**Legacy repositories** (functionality merged into lead-os monorepo):

| Repository | Status |
|------------|--------|
| pinohu/lead-os-hosted-runtime | Merged into `lead-os-runtime` |
| pinohu/lead-os-embed-widgets | Merged — embed system now in `src/lib/integrations/embed-widgets-adapter.ts` |
| pinohu/SuiteDash | CRM adapter now in `src/lib/integrations/` (SuiteDash + SalesNexus) |
| pinohu/leadnest-flow-forge | Flow Forge adapter now in `src/lib/integrations/flow-forge-adapter.ts` |
| pinohu/leadgen-ai-portal | Functionality absorbed into operator dashboard |

---

## 1. North star

Lead OS is a **programmable, multi-tenant lead-generation infrastructure layer**:

- **Niche** ≈ configurable **instance** (same code, different config graphs and CRM packs).
- **One runtime** owns **decisions and side-effect orchestration** (what happens next, with idempotency and audit).
- **SuiteDash** (or another CRM) is a **projection** of pipeline and human workflow—not a second place where funnel logic is authoritative.
- **Automation** (n8n, crons, webhooks) **executes** and **reflects** outcomes; it does not silently re-implement routing.

---

## 2. Layer model (strict boundaries)

| Layer | Owns | Must not |
|-------|------|----------|
| **Embed / WordPress** (`lead-os-embed-widgets`) | Fast load, capture UX, boot manifest fetch, origin-safe config surface | Business rules beyond client-side validation |
| **Hosted runtime** (`lead-os-hosted-runtime`) | Identity, scoring, funnel graph resolution, queues, experiments, operator tools, webhook/cron entrypoints | Full duplicate CRM semantics |
| **CRM** (SuiteDash tenant) | Contacts, deals, stages, tasks, office artifacts | Authoritative funnel graph or experiment assignment |
| **Automation bus** (n8n + scheduled jobs) | Retries, multi-step flows, channel sends | Fork “next step” logic without consulting runtime contract |
| **Marketing shells** (Lovable apps) | Narrative, landing, demos | System of record for leads or money |

**Integration rule:** cross-layer payloads are **versioned** (intake DTO, CRM sync DTO, webhook envelope). Breaking changes require a **version bump** and a **migration note** in this file or in `CHANGELOG` of the owning repo.

---

## 3. Kernel of record

**Authoritative system of record for funnel-side truth:** `lead-os-hosted-runtime`.

It should be the only component that:

1. Assigns **experiment / variant** and records exposure.
2. Emits **canonical milestones** (qualified, booked, dispatch state, value realized, nurture stage, etc.).
3. Enforces **idempotency** and **replay safety** for intake and downstream jobs.
4. Exposes **operator** controls that change behavior through **config and promotion**, not ad hoc edits in three systems.

**SuiteDash** receives **synced state** and supports **human** processes. **n8n** runs **durable** workflows triggered by **stable events** or schedules, calling documented APIs.

---

## 4. Niche = instance (config, not fork)

To replicate a new vertical in hours, each niche should be describable by a **single spec** (conceptual shape below). Implementation path: validate with **JSON Schema**, load at build or deploy time, and drive manifest generation + runtime defaults + CRM pack selection.

### 4.1 Conceptual niche spec (v1 shape)

Use this checklist until a formal schema lives in `Lead-Acquisition-Retention-Conversion` or `lead-os`:

```yaml
# niche-spec (conceptual — formalize as JSON Schema + files per niche)
id: string                    # e.g. plumbing-metro-v1
tenant_id: string             # isolation key for data and secrets

niche:
  label: string
  pain_points: string[]
  offers: string[]              # logical offer ids
  urgency: low | medium | high

widgets:
  templates: [quiz | calculator | audit | form | chat]
  default_entry: string         # boot recipe / route id

funnel:
  graph_id: string              # references runtime graph / family
  stages_capture_qualify_nurture_convert: true  # maps to internal nodes, not CRM copy

offers_engine:
  catalog:
    - id: string
      kind: low_ticket | high_ticket | subscription
      crm_tags: string[]

crm:
  provider: suitedash
  pipeline_stages:              # enum map — must align SuiteDash setup
    - new_lead
    - qualified
    - booked
    - closed
  field_pack_id: string         # references SuiteDash repo / import bundle

automation:
  n8n_pack_id: string
  email_sequences: string[]     # logical ids inside pack
  sms_flows: string[]
  retargeting_triggers: string[]

experiments:
  namespace: string             # prefix for experiment keys
```

**Secrets** (API keys, signing secrets, webhook tokens) **never** live in this YAML—only **references** to env vars or secret stores.

### 4.2 Replication steps for one niche

1. Copy last niche spec → new `id` / `tenant_id`.
2. Adjust `pain_points`, `offers`, `widgets`, `funnel.graph_id`.
3. Generate or select **CRM field pack** and **pipeline** in SuiteDash (scripts in `pinohu/SuiteDash` where applicable).
4. Import or bind **n8n pack**; point webhooks at **runtime** URLs with auth.
5. Generate **embed manifest** / deployment snippets from runtime (`/api/embed/*` and related).
6. Deploy **hosted runtime** with env for that tenant; deploy **WordPress plugin** or embed snippet on site.
7. Run **health checks**: intake → CRM row → automation fired → operator dashboard shows human traffic (not synthetic).

### 4.3 Lead magnet library (capture layer)

Use the **Ultimate Lead Magnet Library** as the canonical set of **100** engine-ready magnets (full funnel docs per item): [`docs/libraries/lead-magnets/README.md`](./libraries/lead-magnets/README.md) and [`catalog.v1.json`](./libraries/lead-magnets/catalog.v1.json). Reference `magnet_id` from niche config or runtime decisioning; generate copy and assets with `leadgen-ai-portal` or internal LLM workflows **without** inventing new funnel shapes ad hoc.

---

## 5. Event spine (observability and replay)

Treat the platform as a **distributed state machine**:

- Every significant transition produces a **correlation id** (visitor/session) carried: widget → runtime → CRM → n8n.
- Side effects that touch external systems go through **queues or outbox patterns** already oriented in the runtime (booking, documents, workflows)—extend that discipline rather than adding one-off HTTP from random layers.
- **Replay** and **duplicate submission** must remain safe (idempotency keys, replay tokens).

**Operator dashboards** should continue to **separate human traffic from verification/synthetic** traffic by default so KPIs stay trustworthy.

---

## 6. Experimentation and promotion

- **Assignment** happens in the **runtime**, logged with context.
- **Winning variants** promote into **live defaults** via **config** (runtime already supports promoted experiment winners in generation paths—keep that as the only promotion path for public behavior).
- Every material default change has an **owner**, **date**, and either an **experiment id** or an explicit **pinned default** note.

---

## 7. Multi-tenant guardrails

- **Tenant id** on persisted entities and generated manifests where applicable.
- **Widget origin allowlists** and **signed webhooks** per environment.
- **Least privilege** API keys; rotate via runbooks in the SuiteDash deployment repo.

---

## 8. Repository workflow (avoid drift)

- **Kernel changes** → `lead-os-hosted-runtime` (PR + tests + build).
- **Client changes** → `lead-os-embed-widgets`.
- **CRM templates, n8n JSON, deploy scripts** → `pinohu/SuiteDash` (`dynasty-suitedash-deployment` and related).
- **Cross-cutting product intent** → this document under `lead-os/docs/`.
- **Marketing-only** → Lovable repos; do not duplicate funnel truth there.

---

## 9. Definition of done (platform maturity)

The architecture is “replicated correctly” when:

1. A new niche can be added **without forking** the runtime repo—only **config + CRM pack + automation pack + env**.
2. **One** place answers “why did this lead get this next step?”
3. **Events** can be traced end-to-end with **correlation id**.
4. **Promoted** defaults are visible to operators and **reversible**.
5. **Health checks** prove intake, CRM sync, and automation **without** manual glue per site.

---

## 10. Document ownership

- **Maintainer:** update this file when repository roles or integration contracts change.
- **Version:** bump the line below when you make semantic changes to layers or niche spec shape.

**Spec revision:** 1.0.0 · **Last aligned with:** Lead OS multi-repo layout (hosted runtime, embed widgets, SuiteDash kit, umbrella `lead-os`).
