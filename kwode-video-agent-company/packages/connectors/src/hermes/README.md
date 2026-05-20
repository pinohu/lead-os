# Hermes connector

This package adapts the Kwode Video Factory's agent invocations to the Hermes
agent runtime — and falls back to a deterministic mock when Hermes is not
installed.

## Files

| File                    | Purpose                                                    |
|-------------------------|------------------------------------------------------------|
| `hermesTaskPacket.ts`   | Versioned packet structure handed to Hermes.               |
| `hermesAdapter.ts`      | Spawns Hermes / falls back to the mock runner.             |
| `hermesResultParser.ts` | Parses Hermes' stdout into a canonical `HermesResult`.     |
| `hermesMockRunner.ts`   | Deterministic responses for every agent intent.            |

## Environment

```
HERMES_ENABLED=false
HERMES_COMMAND=hermes
HERMES_WORKSPACE_PATH=
HERMES_AGENT_CONFIG_PATH=
HERMES_GATEWAY_ENABLED=false
```

While `HERMES_ENABLED=false`, every `invokeHermes()` call returns mock output
from `hermesMockRunner.ts`. The full agent chain runs end-to-end with no
external dependencies.

## Running a real Hermes worker (planned path)

1. Install Hermes locally or in a sibling container.
2. Confirm `which hermes` works inside the container that runs the
   `agent-runner` service.
3. Set `HERMES_ENABLED=true` and `HERMES_COMMAND=<absolute path>`.
4. Point `HERMES_WORKSPACE_PATH` at the directory where Hermes can write its
   per-task scratch files.
5. Restart the `agent-runner` service.

The adapter spawns `HERMES_COMMAND run --stdin` and pipes the task packet to
stdin. If the binary expects a different invocation shape, update
`hermesAdapter.runChild()` rather than calling out from agent code.

## Hermes Gateway (future)

When `HERMES_GATEWAY_ENABLED=true` we will route invocations to a long-lived
HTTP service instead of forking a child per call. This is not implemented in
the MVP — see `docs/HERMES_INTEGRATION.md` for the planned API.
