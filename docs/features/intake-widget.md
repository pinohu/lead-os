# Conversational Intake Widget

A sub-90-second AI-led conversation that replaces the form-then-wait flow on the top 5 niche pages. The widget classifies the customer's problem, sets price/timeline expectations, and routes the lead through the same back-end as the legacy form.

## What it ships with

- **Niches enabled (v1):** plumbing, hvac, electrical, roofing, restoration (water-damage)
- **Conversation skeleton:** problem → location → urgency → budget → contact → complete
- **LLM use:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) at two narrow points — niche classification from free text and a 1-2 sentence empathetic ack. All other steps are deterministic.
- **A/B test:** 50/50 by default. Cookie-driven (sticky). Env overrides available.
- **Fallback:** Any unrecoverable error in the widget swaps in the legacy `LeadForm` automatically.

## Files

```
src/lib/intake/
  types.ts                 — Types and API contracts
  templates.ts             — Per-niche conversation copy + price/SLA tiers
  anthropic-client.ts      — Minimal fetch wrapper + niche classifier + ack composer
  conversation.ts          — Orchestrator: startConversation, advanceConversation, step handlers
  feature-flag.ts          — A/B variant resolver (cookie + env overrides)
  __tests__/               — 27 unit tests

src/app/api/intake/
  start/route.ts           — POST  Initialize a conversation, return greeting
  message/route.ts         — POST  Advance one step at a time
  complete/route.ts        — POST  Finalize → routeLead() → Lead row + downstream sync

src/components/
  intake-widget.tsx        — The React component (client)
  intake-or-form.tsx       — Server component: chooses widget vs. legacy form per A/B variant
  intake-or-form-client.tsx— Client wrapper: handles widget-to-form fallback

prisma/
  schema.prisma                                                — IntakeConversation model appended
  migrations/20260516000000_intake_conversation/migration.sql  — Migration SQL
```

## Environment

| Var | Purpose | Default |
|-----|---------|---------|
| `ANTHROPIC_API_KEY` | Anthropic Messages API key. Without it, classifier and ack fall back to deterministic content. | (unset → fallback mode) |
| `INTAKE_WIDGET_FORCE` | `"intake"` / `"form"` / `"off"` — forces all visitors to one variant. | (unset) |
| `INTAKE_WIDGET_PERCENTAGE` | Number 0-100. Percentage of new visitors bucketed to the intake variant. | `50` |

## How it routes

Once the conversation reaches the `complete` step, the server calls the canonical `routeLead(niche, city, leadData)` helper. The same routing logic that powers `/api/lead`:

- Matches a verified, in-business-hours provider in the niche → `routeType: primary | failover | overflow`
- Otherwise → `routeType: unmatched` → customer is shown the concierge phone `(814) 200-0328`

Downstream side-effects (provider notification, consumer confirmation, admin alert, audit log, webhook delivery, Boost.space sync) all fire identically to the legacy form — they're invoked in a `next/server` `after()` block so the API response returns immediately.

## How it survives failure

- **LLM timeout (4s ceiling):** classifier falls back to keyword search against `niches.ts` searchTerms; ack falls back to a templated reply.
- **Classifier returns nothing:** the widget asks the customer to rephrase. The page-context niche is used as a last-resort hint.
- **API 5xx anywhere in the conversation:** the wrapper swaps in the legacy `LeadForm` and the customer can complete via the original path.
- **Already-completed conversations:** the `/api/intake/complete` route is idempotent — returns the existing lead instead of double-creating.

## Metrics to watch

The conversation table (`intake_conversations`) records every interaction, so all of these are SQL-queryable:

- **Intake completion rate** — `outcomeStatus = 'completed'` / total rows per niche per day
- **Abandonment by step** — `currentStep` distribution among `outcomeStatus = 'in_progress'` rows older than 1h
- **A/B conversion** — join `intake_conversations.variant` against `leads.source` to compare intake-widget leads vs. legacy-form leads
- **Classifier accuracy** — `outcome.candidateNiches[0].confidence` distribution; manual spot-check of low-confidence routes

## Killing the feature

If something goes wrong in production:

1. Set `INTAKE_WIDGET_FORCE=form` in Vercel env. All visitors get the legacy form immediately.
2. The IntakeConversation rows remain in the database for analysis.
3. No data loss — even abandoned conversations are recoverable.
