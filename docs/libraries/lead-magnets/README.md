# Ultimate Lead Magnet Library (v1)

Machine-readable library for the **Universal Lead Engine**: **100** lead magnets across **10** categories. Each record documents the **full funnel** (landing structure, capture, delivery, nurture, conversion, automation) so you can **select**, **generate**, and **deploy** consistently across Lead OS.

## Files

| File | Purpose |
|------|---------|
| [`lead-magnet.schema.json`](./lead-magnet.schema.json) | JSON Schema for a single `LeadMagnet` object (apply to each element of `magnets` in the catalog). |
| [`catalog.v1.json`](./catalog.v1.json) | Generated catalog: metadata + `magnets[]` (100 items). **Source of truth for runtime selection and AI generation.** |
| [`tools/build-lead-magnet-catalog.mjs`](./tools/build-lead-magnet-catalog.mjs) | Regenerates `catalog.v1.json` after editing definitions in the script. |

## Regenerate the catalog

```bash
cd docs/libraries/lead-magnets
node tools/build-lead-magnet-catalog.mjs
```

## How this plugs into Lead OS

1. **Context** — Niche, persona, funnel stage, traffic source, and intent (see `automation_logic.context_detection` on each magnet).
2. **Selection** — Match a `magnet.id` (e.g. cold traffic → quiz; high intent → calculator or audit; warm → course/toolkit).
3. **Runtime** — `lead-os-hosted-runtime` resolves `magnet_id` on intake, assigns experiments, enqueues CRM sync and execution tasks (aligns with [Lead Operating System architecture](../LEAD_OPERATING_SYSTEM_ARCHITECTURE.md)).
4. **Capture** — `lead-os-embed-widgets` boots the experience type implied by `asset_type` (quiz, calculator, form, embed).
5. **CRM & automation** — `suitedash_updates` and `n8n_triggers` describe what to wire in SuiteDash + n8n (see `pinohu/SuiteDash`).
6. **Generation** — `leadgen-ai-portal` (or any LLM workflow) can take a catalog record + business profile and emit copy, questions, and emails **without inventing a new funnel shape**.

## IDs

- Pattern: `lm-catXX-YYY` where `XX` is category 01–10 and `YYY` is 001–010 within that category.

## External references (ideas & patterns)

Template and swipe inspiration often comes from productized libraries (e.g. Leadpages, Canva, ActiveCampaign ideas, Unbounce galleries). This repo encodes **your** canonical, engine-ready definitions—not a copy of third-party assets.
