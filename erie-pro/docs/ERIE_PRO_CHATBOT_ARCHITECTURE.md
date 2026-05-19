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
  llm.ts                 # Provider router (open-weight default)
  llm-config.ts          # CHAT_LLM_PROVIDER / env resolution
  llm-openai-compatible.ts  # OpenRouter, Groq, Ollama (OpenAI tools API)
  llm-anthropic.ts       # Optional Claude Messages API
  llm-prompt-tools.ts    # JSON prompt fallback when native tools missing
  llm-message-converter.ts  # Anthropic ↔ OpenAI message shapes
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

**Production deploy:** After shipping chatbot code, run `npx prisma migrate deploy` against the Neon production database (Vercel does not run migrations automatically). Pending migrations as of the chatbot launch include `20260519120000_provider_offer_system`, `20260519140000_action_status_notifications`, and `20260519160000_chatbot_sessions`. Without `chat_sessions`, `POST /api/chat/session` returns HTTP 503 with `chat_schema_missing`.

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

## LLM providers (open-weight default)

Production recommendation: **OpenRouter** with a capable open model (tool calling via OpenAI-compatible API). **Groq** is a good alternative for low latency. **Anthropic** remains available only when explicitly selected.

| Provider | Env | Default model | API |
|----------|-----|---------------|-----|
| `openrouter` | `OPENROUTER_API_KEY` | `meta-llama/llama-3.3-70b-instruct` | `https://openrouter.ai/api/v1/chat/completions` |
| `groq` | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | Groq OpenAI-compatible |
| `ollama` | `OLLAMA_BASE_URL` (dev) | `llama3.2` | Local `/v1/chat/completions` |
| `anthropic` | `ANTHROPIC_API_KEY` + `CHAT_LLM_PROVIDER=anthropic` | `claude-haiku-4-5-20251001` | Anthropic Messages + tools |

Shared env:

- `CHAT_LLM_PROVIDER` — `openrouter` \| `groq` \| `anthropic` \| `ollama` (optional; auto-detect if unset)
- `CHAT_LLM_MODEL` — override model id per provider

Auto-detect when `CHAT_LLM_PROVIDER` is unset: OpenRouter (if key) → Groq → Ollama. Claude is **not** auto-selected.

The orchestrator still uses the same tool loop: `runChatLlmTurn` returns `{ text, toolCalls }`. Open-weight providers use native `tool_calls` when supported; otherwise `llm-prompt-tools.ts` requests a JSON `tool_calls` payload.

Without any LLM credentials, persona-specific deterministic fallbacks (e.g. provider growth keyword flow) and guardrailed copy still apply.

## Environment

- `OPENROUTER_API_KEY` / `GROQ_API_KEY` / `OLLAMA_BASE_URL` — chat LLM (see table above)
- `ANTHROPIC_API_KEY` — only when `CHAT_LLM_PROVIDER=anthropic`
- `DATABASE_URL` — required for sessions and tools

## Trust rule

Status, notification delivery, subscription, and provisioning answers must come from tool output (`getRequestStatus`, `getFailedNotifications`, etc.). `guardrails.ts` blocks assistant drafts that claim delivery without a tool call in the same turn.
