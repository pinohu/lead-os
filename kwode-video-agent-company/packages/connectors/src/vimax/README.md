# ViMax connector

Generates ViMax-compatible planning packets (script → scene list → prompt pack
→ consistency instructions) and exports them as JSON the
[HKUDS/ViMax](https://github.com/HKUDS/ViMax) runtime can consume.

## Behavior

| Mode                                    | What happens                                                                                                                          |
|-----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `VIMAX_ENABLED=false`                   | `runVimaxMock()` returns a planning-only manifest with one mock asset per prompt. No media is produced.                              |
| `VIMAX_ENABLED=true`, no `VIMAX_COMMAND`| Packet is written to `VIMAX_WORKSPACE_PATH` for manual ViMax invocation; mock manifest is returned so the pipeline can advance.       |
| `VIMAX_ENABLED=true`, with command set  | We spawn `<VIMAX_COMMAND> plan --packet <path>`; stdout is parsed via `parseVimaxResult`.                                            |

## Files

- `vimaxPlanningPacket.ts` — packet shape (kwode/vimax/1).
- `vimaxAdapter.ts` — orchestrator, picks mock vs. real path.
- `vimaxResultParser.ts` — parses ViMax stdout.
- `vimaxMockRunner.ts` — deterministic planning manifest.

## Environment

```
VIMAX_ENABLED=false
VIMAX_COMMAND=
VIMAX_WORKSPACE_PATH=storage/generated/vimax
VIMAX_OUTPUT_PATH=storage/generated/vimax/out
```
