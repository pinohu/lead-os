# Conversational Intake Widget — Full Rollout

A sub-90-second AI-led conversation that replaces the form-then-wait flow on **every niche page** in Erie.pro (112 niches). The widget classifies the customer's problem, sets price/timeline expectations, and routes the lead through the same back-end as the legacy form.

## Coverage

- **All 112 niches enabled.** The widget is the default lead-capture experience on every niche page.
- **5 hand-tuned templates** (plumbing, hvac, electrical, roofing, restoration) with bespoke greetings, problem suggestions, urgency copy, and price hints.
- **107 generated templates** produced by `generateTemplate(niche)` from existing `niches.ts` metadata (label, description, searchTerms, avgProjectValue). Quality is "looks hand-tuned" because the description fields are already concise service lists ("Heating, cooling, ventilation, and air quality services" parses into 4 perfect suggestion chips).
- **Final fallback** when there's no niche context at all (e.g. homepage start).

## Conversation flow

```
problem  → location → urgency → budget → contact → complete
```

LLM (`claude-haiku-4-5-20251001`) is used at only two narrow points:

1. **Problem step:** Classify the niche from free text + compose an empathetic 1-2 sentence ack.
2. **Urgency step:** Compose a price-and-timeline hint pulled from the per-niche template.

Everything else is deterministic UI. Hard **4s timeout** per API call. On any LLM failure the classifier falls back to keyword search against `niches.ts` `searchTerms` and the ack falls back to a templated reply.

## How it routes leads

At the `complete` step, the server calls `routeLead(niche, city, leadData)` — the same helper `/api/lead` uses. The Lead row is created with `source = "erie-pro-intake-widget"` and the downstream side-effects (provider notification, consumer confirmation, admin alert, audit, webhook, Boost.space sync) fire identically via `next/server` `after()`.

Idempotent on retry: already-completed conversations return their existing Lead instead of double-creating.

## A/B test (still wired)

- **Default in production:** `INTAKE_WIDGET_PERCENTAGE=100` → every visitor gets the widget.
- **`INTAKE_WIDGET_FORCE=intake|form|off`:** Forces all visitors to one variant. Use `form` or `off` as a kill switch.
- **`INTAKE_WIDGET_PERCENTAGE=N`:** Adjusts the split (0-100).

The variant is re-checked server-side on `/api/intake/start` so a misconfigured client can't bypass the flag.

## Files

```
src/lib/intake/
  types.ts                 Types and API contracts
  templates.ts             Hand-tuned + programmatic generator for all niches
  anthropic-client.ts      Fetch wrapper + classifier + ack composer
  conversation.ts          Step orchestrator
  feature-flag.ts          A/B variant resolver
  __tests__/               30 unit tests

src/app/api/intake/
  start/route.ts           POST  Init conversation
  message/route.ts         POST  Advance one step
  complete/route.ts        POST  Finalize → routeLead → Lead + side-effects
  stats/route.ts           GET   Admin-only funnel breakdown

src/app/api/cron/
  intake-cleanup/route.ts  Daily 4am: mark stale-in-progress as abandoned;
                           delete >30-day-old abandoned rows.

src/components/
  intake-widget.tsx        The React component (client)
  intake-or-form.tsx       Server-side A/B selector
  intake-or-form-client.tsx Client-side fallback wrapper

prisma/schema.prisma       IntakeConversation model
prisma/migrations/20260516000000_intake_conversation/migration.sql
vercel.json                Cron registration for /api/cron/intake-cleanup
```

## Environment variables

| Var | Purpose | Production value |
|-----|---------|------------------|
| `ANTHROPIC_API_KEY` | Anthropic Messages API key for Claude Haiku 4.5. Without it, classifier and ack fall back to deterministic content. | Set via Vercel env |
| `INTAKE_WIDGET_FORCE` | Override: `"intake"` / `"form"` / `"off"` | (unset) |
| `INTAKE_WIDGET_PERCENTAGE` | 0-100 split percentage for new visitors | `100` |
| `CRON_SECRET` | Bearer token for cron endpoints and `/api/intake/stats` | Set via Vercel env |

## Operational hooks

### Daily cleanup cron

`/api/cron/intake-cleanup` runs at 4am daily:
1. Marks `outcomeStatus = "in_progress"` rows older than 24h as `"abandoned"`.
2. Hard-deletes rows with `outcomeStatus IN ("abandoned", "error")` older than 30 days where `leadId IS NULL`.

Completed conversations (tied to Leads) are never deleted.

### Stats endpoint

```sh
curl -H "Authorization: Bearer $CRON_SECRET" https://erie.pro/api/intake/stats
```

Returns total started, completed, completion rate, status breakdown, step abandonment, top niches by volume, variant comparison.

## How it survives failure

- **LLM timeout (4s ceiling):** Classifier → keyword fallback; ack → templated reply.
- **Classifier returns nothing:** Widget asks the customer to rephrase; page-context niche used as last-resort hint.
- **API 5xx mid-conversation:** Wrapper swaps in the legacy `LeadForm` automatically.
- **Already-completed conversation:** `/api/intake/complete` is idempotent.

## Killing the feature

Set `INTAKE_WIDGET_FORCE=form` in Vercel env. All visitors revert to the legacy form on the next request. No code change required.

## SQL queries for ops

```sql
-- Completion rate by niche, last 7 days
SELECT
  COALESCE("startedFromNicheSlug", '(homepage)') AS niche,
  COUNT(*) FILTER (WHERE "outcomeStatus" = 'completed') AS completed,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE "outcomeStatus" = 'completed') / COUNT(*), 1) AS pct
FROM intake_conversations
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY total DESC
LIMIT 25;

-- Where do people drop off?
SELECT "currentStep", COUNT(*) AS count
FROM intake_conversations
WHERE "outcomeStatus" IN ('in_progress', 'abandoned')
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY 1 ORDER BY 2 DESC;

-- Classifier confidence distribution
SELECT outcome->>'primaryNiche' AS niche,
       (outcome->'candidateNiches'->0->>'confidence')::float AS confidence
FROM intake_conversations
WHERE "outcomeStatus" = 'completed'
ORDER BY "createdAt" DESC LIMIT 100;
```
