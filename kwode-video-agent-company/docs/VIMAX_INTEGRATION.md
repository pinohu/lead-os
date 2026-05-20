# ViMax Integration

ViMax is the video planning runtime that turns a script + storyboard +
prompt pack into a production manifest. The integration lives in
`packages/connectors/src/vimax/`.

## Environment

```
VIMAX_ENABLED=false
VIMAX_COMMAND=
VIMAX_WORKSPACE_PATH=storage/generated/vimax
VIMAX_OUTPUT_PATH=storage/generated/vimax/out
```

## Modes

| `VIMAX_ENABLED` | `VIMAX_COMMAND` | What happens |
|---|---|---|
| false | (any) | `runVimaxMock()` — one planning asset per prompt, no media |
| true | unset | Packet written to `VIMAX_WORKSPACE_PATH`; mock manifest returned. Operator can run ViMax manually against the packet. |
| true | set | Spawns `<VIMAX_COMMAND> plan --packet <path>` and parses stdout |

## Planning packet shape

```jsonc
{
  "packetVersion": "kwode/vimax/1",
  "jobId": "ck...",
  "title": "Emergency plumbing visibility video",
  "brand": { "name": "Erie Plumbing Demo", "voiceTone": "...", "forbidden": [...] },
  "brief": { "objective": "...", "audience": "...", "hook": "...", "cta": "..." },
  "constraints": { "durationSec": 45, "aspectRatio": "9:16" },
  "script": { "format": "shot-list", "language": "en-US", "body": "..." },
  "scenes": [ { "order": 1, "durationSec": 3, "description": "..." }, ... ],
  "prompts": [ { "sceneOrder": 1, "kind": "image", "toolHint": "comfyui", "body": "..." }, ... ],
  "consistency": {
    "keyVisualEntities": [...],
    "lockedColors": [...],
    "lockedFonts": [...],
    "referenceAssets": [...]
  },
  "meta": { "createdAt": "...", "correlationId": "..." }
}
```

## Result shape

```jsonc
{
  "packetVersion": "kwode/vimax/1",
  "jobId": "ck...",
  "status": "completed" | "failed" | "planned" | "mocked",
  "assets": [
    { "sceneOrder": 1, "kind": "image", "uri": "vimax://...", "mimeType": "image/png" },
    ...
  ],
  "notes": "...",
  "error": "..."
}
```

## How the pipeline calls ViMax

`packages/workflow-engine/src/agent-chain.ts` invokes `invokeVimax()`
inside the `prompt-engineer-agent` step. The output:

1. A `GenerationRun` row records the packet (input), result (output),
   tool id, mode (`mock` vs `api`), and status.
2. One `Asset` row per result asset, with `producedBy = "tool:vimax"`.

This means even in mock mode the pipeline produces inspectable artifacts.

## Future direct integration

To replace the mock with a direct HKUDS/ViMax integration:

1. Install ViMax locally and verify its CLI accepts our packet format.
   (If the upstream CLI shape differs, we adapt in `vimaxAdapter.ts` —
   not in agent code.)
2. Set `VIMAX_ENABLED=true` and `VIMAX_COMMAND=<absolute path>`.
3. Confirm `/api/health/deep` shows `runtimes.vimax.mode === "real"`.

If ViMax requires HTTP rather than CLI, add an HTTP path inside
`vimaxAdapter.invokeVimax()` guarded by a `VIMAX_HTTP_BASE_URL` env.
