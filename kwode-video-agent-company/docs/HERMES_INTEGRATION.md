# Hermes Integration

The factory uses Hermes as its agent runtime when available, and a
deterministic mock runner when it isn't. The integration is in
`packages/connectors/src/hermes/`.

## Environment

```
HERMES_ENABLED=false
HERMES_COMMAND=hermes
HERMES_WORKSPACE_PATH=
HERMES_AGENT_CONFIG_PATH=
HERMES_GATEWAY_ENABLED=false
```

## Behavior matrix

| `HERMES_ENABLED` | `HERMES_GATEWAY_ENABLED` | Path used |
|---|---|---|
| false | (any) | `hermesMockRunner.ts` — deterministic JSON per intent |
| true | false | `spawn(HERMES_COMMAND, ['run', '--stdin'])` with packet on stdin |
| true | true | Reserved for long-lived HTTP gateway (not implemented in MVP) |

If a real Hermes invocation fails for any reason, the adapter falls back
to the mock and stamps the error message into `result.notes`. This
guarantees the pipeline never stalls because a runtime is misconfigured.

## Task packet

Every Hermes invocation receives a `HermesTaskPacket`
(see `hermesTaskPacket.ts`):

```jsonc
{
  "packetVersion": "kwode/hermes/1",
  "agentId": "creative-brief-agent",
  "agentDefinition": {
    "name": "Creative Brief Agent",
    "mission": "...",
    "promptTemplate": "...",
    "toolsAllowed": [...],
    "toolsDisallowed": [...]
  },
  "context": {
    "jobId": "ckxxx",
    "tenantSlug": "erie-pro",
    "clientName": "Erie HVAC Demo",
    "brandSummary": "Erie HVAC Demo — voice: warm, confident",
    "videoTypeId": "service-explainer",
    "priorArtifacts": { "brief": null, "script": null }
  },
  "task": {
    "intent": "generate_brief",
    "inputs": { ... }
  },
  "guardrails": {
    "forbidden": ["guaranteed cheapest"],
    "consentRequired": false,
    "publicPublishing": false
  },
  "meta": {
    "createdAt": "2026-05-20T...",
    "correlationId": "..."
  }
}
```

## Result packet

Hermes responds with a `HermesResult` (parseable by `hermesResultParser.ts`).
The mock always returns valid `kwode/hermes/1` JSON. Real Hermes can return
arbitrary stdout; we wrap unstructured output as `{ text: "..." }`.

## Running real Hermes

1. Install Hermes locally or in a sibling container.
2. Confirm `which hermes` works inside the container that will run
   `apps/agent-runner` (or the API, since the adapter spawns from
   whichever process called `invokeHermes()`).
3. Set:
   ```
   HERMES_ENABLED=true
   HERMES_COMMAND=/path/to/hermes
   HERMES_WORKSPACE_PATH=/path/to/scratch
   ```
4. Restart the relevant containers.
5. Visit `/api/health/deep` and confirm `runtimes.hermes.mode === "real"`.

## Future: Hermes Gateway

When the team operates Hermes as a long-lived HTTP service, set
`HERMES_GATEWAY_ENABLED=true` and add an HTTP path to `hermesAdapter.ts`
that POSTs the packet to the gateway. The result format does not change.

## Swapping agent runtimes

The adapter contract (`HermesTaskPacket` in / `HermesResult` out) is the
only thing the workflow engine knows about. To use a different runtime
(LangGraph, OpenAI Assistants, an in-house LLM router, etc.):

1. Add a sibling connector under `packages/connectors/src/<runtime>/`.
2. Implement an `invoke<Runtime>()` that returns a `HermesResult`-compatible
   shape (rename if you want — only the parser cares).
3. Update `packages/workflow-engine/src/agent-chain.ts` to pick the right
   adapter based on env flags / per-agent config.

The mock runner is also where new agent intents should land first — any
agent whose intent isn't in `hermesMockRunner.ts` falls through to a
generic echo response.
