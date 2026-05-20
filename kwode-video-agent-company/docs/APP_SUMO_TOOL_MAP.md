# AppSumo Tool Map

How the user's AppSumo tools (and the open-source / commercial neighbors)
slot into the video factory.

## Quick map

| Tool | Category | Connector status | Role |
|---|---|---|---|
| ViMax | video-planning | mock | Script→scene→prompt planning |
| SUPERMACHINE | image-generation | planned | Stylized scene imagery |
| Vadoo AI | video-generation | planned | Short-form vertical |
| Zebracat | video-generation | planned | Alternative short-form |
| ReelCraft | video-generation | planned | Reel generation |
| Fliki | video-generation | planned | Text-to-video w/ TTS |
| BIGVU | talking-head | manual | Teleprompter + face capture |
| OneTake AI | long-form-edit | planned | Auto-edit long-form |
| Minvo | repurposing | planned | Clip extraction |
| FlexClip | assembly | manual | Template assembly |
| InVideo Studio | assembly | manual | Drag-and-drop assembly |
| Gumlet Video | hosting | mock | HLS hosting + analytics |
| Publitio | hosting | mock | Alternative hosting |
| Viloud | channel-embed | manual | 24/7 channel embeds |
| FacePop | overlay | manual | Face overlay |
| Nexweave | personalization | planned | 1:1 personalization |
| YeetDL | source-ingest | manual | Lawful media download (client-owned/licensed only) |
| TeliportMe | real-estate | planned | 360 virtual tour ingest |
| Blogify | content | planned | Blog → video |
| NeuronWriter | seo | planned | SEO research |
| Katteb | content | planned | Fact verification |
| Castmagic | transcription | planned | Transcribe + extract highlights |
| Spoken | tts | planned | TTS |
| Rumble Studio | audio | manual | Interview audio |
| SuiteDash | client-portal | mock | Client portal delivery |
| ThriveCart | billing | mock | Checkout |
| ProductDyno | membership | mock | Member delivery |
| ConvertBox | conversion | planned | Site overlays |
| Kuicklist | list | manual | Listicles |
| Acumbamail | email | planned | Email distribution (outreach-flag gated) |
| GoZen Forms | forms | planned | Intake forms |
| Formaloo | forms | planned | Alternative intake |
| Activepieces | workflow | planned | Workflow orchestration |
| Pabbly | workflow | planned | Workflow orchestration |
| KonnectzIT | workflow | planned | Workflow orchestration |
| Boost.space | workflow | planned | Data sync |
| Brilliant Directories | directory | planned | Directory listings |
| Directorist | directory | manual | WordPress directories |
| Twidget | distribution | manual | Social embed widgets |

## Recommended chains

The router in `packages/connectors/src/appsumo/appsumoRouter.ts`
returns chains based on the video type + intent:

**Local service short video**
```
neuronwriter → katteb → vimax → supermachine → vadoo/zebracat
                                            → gumlet → suitedash
```

**Provider profile video**
```
gozen-forms/formaloo → suitedash → vimax → bigvu/facepop/vadoo
                                          → gumlet → erie.pro (gated)
```

**Long-form repurposing (client-owned source)**
```
client upload / lawful yeetdl source → castmagic/blogify → vimax
                              → minvo/onetakeai → gumlet/publitio
```

**Children's animated story**
```
vimax → supermachine → vimax (animation pass) → flexclip → productdyno
```

## How to wire a real tool

1. Update `packages/tool-registry/registry/tools.yaml` and flip the
   tool's `connector_status` from `planned` to `mock` or `api`.
2. Add a sibling folder under `packages/connectors/src/<tool-id>/`
   with an adapter that returns the standard
   `{ status, externalRef?, error? }` shape.
3. Gate any HTTP call on the appropriate env flag.
4. Re-seed (`npm run db:seed`) — the registry is idempotent.
