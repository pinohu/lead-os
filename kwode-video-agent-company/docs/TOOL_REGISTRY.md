# Tool Registry

The tool registry catalogs every AppSumo / open-source / commercial tool
the factory can route work to. Tools are tracked in
`packages/tool-registry/registry/tools.yaml` and seeded into the
`ToolRegistry` database table.

## Schema

```yaml
- tool_id: string                       # stable id (lowercase, no spaces)
  name: string
  category: video-planning | image-generation | video-generation |
            assembly | hosting | tts | transcription | seo | content |
            forms | workflow | directory | client-portal | billing |
            membership | …
  role_in_video_factory: string
  best_use_cases: [string]
  input_types: [string]
  output_types: [string]
  automation_possible: boolean
  api_available: yes | no | unknown
  manual_workflow_supported: boolean
  connector_status: planned | mock | manual | api
  env_keys: [string]
  notes: string
```

## connector_status semantics

| Status | What it means | Behavior |
|---|---|---|
| `planned` | We want it; no code yet | Tool appears in registry; no connector method exists |
| `mock` | Connector method exists, returns deterministic mock output | Used in MVP for the full pipeline |
| `manual` | Tool used by an operator; we record the run but don't call an API | A `ToolRun` row is created by the operator manually |
| `api` | Real HTTP call wired up, gated by env flag | Live only when env flag is on |

## Recommended chains (by AppSumo Tool Router)

The router in `packages/connectors/src/appsumo/appsumoRouter.ts`
returns chains shaped by the route context. Reference chains:

**Local service short:**
```
neuronwriter → katteb → vimax → supermachine → vadoo/zebracat → gumlet → suitedash
```

**Provider profile video:**
```
gozen-forms/formaloo → suitedash → vimax → bigvu/facepop/vadoo → gumlet → erie.pro (gated)
```

**Long-form repurposing:**
```
client upload / lawful yeetdl source → castmagic/blogify → vimax → minvo/onetakeai → gumlet/publitio
```

## Adding a new tool

1. Append a new entry to `packages/tool-registry/registry/tools.yaml`.
2. Pick a `connector_status`. If `mock`, add a minimal mock adapter under
   `packages/connectors/src/<tool-id>/`.
3. Re-run `npm run db:seed`.
4. Update `packages/connectors/src/appsumo/appsumoRouter.ts` if the tool
   belongs in a default chain.

## API

```
GET /api/tools         # full registry
GET /api/tools/:id     # one tool
```
