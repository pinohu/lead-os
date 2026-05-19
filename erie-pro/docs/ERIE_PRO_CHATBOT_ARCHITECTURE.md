# Erie.pro persona-locked chatbot

One shared chat platform with persona modes enforced in code. The assistant never invents operational status — it must call tools that read Prisma / notification / status tables.

## Personas

| Persona | Routes (typical) | Purpose |
|---------|------------------|---------|
| `consumer_service` | Directory, home, get-matched | Find providers, service area, create requests |
| `consumer_status` | `/request-status/[id]` | Request timeline, notifications, retries |
| `provider_growth` | `/for-business`, `/offers`, `/pros` | Plans, ThriveCart checkout, interest |
| `provider_operations` | `/dashboard` | Auth-scoped dashboard summary |
| `admin_operations` | `/admin` | Diagnostics (notifications, ThriveCart, provisioning) |

Resolution: `src/lib/chatbot/personas.ts` + `resolveAudienceFromPathname` from `page-audience-registry.ts`.

## Layout

```
src/lib/chatbot/
  personas.ts          # Persona enum + UI copy + resolver
  policies.ts            # Tool allowlists per persona
  prompt-builder.ts      # System prompts
  tool-registry.ts       # Tool defs + router
  guardrails.ts          # Block ungrounded status claims
  memory.ts              # Message persistence
  escalation.ts          # Human handoff
  analytics.ts           # user_actions logging
  orchestrator.ts        # LLM + tool loop
  llm.ts                 # Anthropic Messages API (tools)
  session.ts             # Session CRUD
  tools/
    consumer-tools.ts
    status-tools.ts
    provider-tools.ts
    admin-tools.ts
```

## Data model

- `chat_sessions` — persona, visitor/user/provider links, context JSON (incl. status token)
- `chat_messages` — user/assistant/tool transcript
- `chat_actions` — tool invocations + results
- `chat_escalations` — human queue

Migration: `prisma/migrations/20260519160000_chatbot_sessions/`

## API

| Method | Path | Role |
|--------|------|------|
| POST | `/api/chat/session` | Create session |
| POST | `/api/chat/message` | Send message, run tools |
| GET | `/api/chat/session/[id]` | Fetch transcript |
| POST | `/api/chat/escalate` | Escalate session |

## Frontend

- `ChatLauncher` — floating button + bottom sheet (`SiteChrome`)
- `StatusAssistant` — embedded on request status page
- Uses `AudienceProvider` pathname for persona defaults

## Environment

- `ANTHROPIC_API_KEY` — optional; without it, deterministic fallbacks still enforce tool-first status messaging
- `DATABASE_URL` — required for sessions and tools

## Trust rule

Status, notification delivery, subscription, and provisioning answers must come from tool output (`getRequestStatus`, `getFailedNotifications`, etc.). `guardrails.ts` blocks assistant drafts that claim delivery without a tool call in the same turn.
